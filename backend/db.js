import { createClient } from '@supabase/supabase-js';
import { AsyncLocalStorage } from 'node:async_hooks';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_KEY not set — running in DEMO mode (in-memory)');
}

export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

// ───────────────────────────────────────────────────────────────
// 🏢 Multi-tenant context
// ทุก HTTP request วิ่งภายใน tenantContext.run({ tenantId }, ...) (set โดย requireAuth).
// db.* อ่าน tenant ปัจจุบันผ่าน currentTenantId() → ไม่ต้องส่ง tenant_id ทุก call site.
// cron (ไม่มี request) wrap งานแต่ละ row ด้วย runWithTenant(row.tenant_id, ...).
// ───────────────────────────────────────────────────────────────
export const tenantContext = new AsyncLocalStorage();
export const DEFAULT_TENANT_ID = 1;

export function currentTenantId() {
  const store = tenantContext.getStore();
  return store?.tenantId || DEFAULT_TENANT_ID;
}

export function runWithTenant(tenantId, fn) {
  return tenantContext.run({ tenantId: Number(tenantId) || DEFAULT_TENANT_ID }, fn);
}

const memory = { contents: [], settings: {} };

export const db = {
  // ─────────── tenants ───────────
  tenants: {
    async create({ name, slug, plan = 'free' }) {
      if (!supabase) return { id: DEFAULT_TENANT_ID, name, slug, plan };
      const { data, error } = await supabase
        .from('tenants')
        .insert({ name, slug: slug || null, plan })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    async getById(id) {
      if (!supabase) return { id: DEFAULT_TENANT_ID, name: 'Default Workspace' };
      const { data } = await supabase.from('tenants').select('*').eq('id', id).maybeSingle();
      return data || null;
    },
  },

  // ─────────── users ───────────
  users: {
    async findByEmail(email) {
      if (!supabase) return null;
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', String(email).toLowerCase())
        .maybeSingle();
      return data || null;
    },
    async create({ tenant_id, email, password_hash, name, role = 'owner' }) {
      if (!supabase) return { id: 1, tenant_id, email, role };
      const { data, error } = await supabase
        .from('users')
        .insert({ tenant_id, email: String(email).toLowerCase(), password_hash, name: name || null, role })
        .select('id, tenant_id, email, name, role, created_at')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    async listByTenant(tenantId) {
      if (!supabase) return [];
      const { data } = await supabase
        .from('users')
        .select('id, email, name, role, created_at')
        .eq('tenant_id', tenantId);
      return data || [];
    },
  },

  // ─────────── contents (tenant-scoped) ───────────
  contents: {
    async insert(row) {
      if (supabase) {
        const withTenant = { ...row, tenant_id: currentTenantId() };
        const { data, error } = await supabase
          .from('contents')
          .insert(withTenant)
          .select('id,course,topic,framework,hook,caption,media_url,platforms,status,scheduled_at,created_at')
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
      const r = { id: Date.now(), created_at: new Date().toISOString(), tenant_id: currentTenantId(), ...row };
      memory.contents.push(r);
      return r;
    },
    async list() {
      if (supabase) {
        const { data, error } = await supabase
          .from('contents')
          .select('id,course,topic,framework,hook,caption,media_url,platforms,status,scheduled_at,published_at,last_error,created_at,updated_at,retry_count,last_attempt_at,post_results')
          .eq('tenant_id', currentTenantId())
          .order('scheduled_at', { ascending: false })
          .limit(500);
        if (error) throw new Error(error.message);
        return data;
      }
      const tid = currentTenantId();
      return [...memory.contents].filter(c => (c.tenant_id || DEFAULT_TENANT_ID) === tid).sort((a, b) => b.id - a.id);
    },
    async getById(id) {
      if (supabase) {
        const { data, error } = await supabase
          .from('contents').select('*')
          .eq('id', id).eq('tenant_id', currentTenantId())
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      }
      return memory.contents.find(c => c.id === id && (c.tenant_id || DEFAULT_TENANT_ID) === currentTenantId()) || null;
    },
    async getByIds(ids) {
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const numeric = ids.map(Number).filter(Boolean);
      if (supabase) {
        const { data, error } = await supabase
          .from('contents').select('*')
          .in('id', numeric).eq('tenant_id', currentTenantId());
        if (error) throw new Error(error.message);
        const map = new Map((data || []).map(r => [r.id, r]));
        return numeric.map(id => map.get(id)).filter(Boolean);
      }
      const map = new Map(memory.contents.map(c => [c.id, c]));
      return numeric.map(id => map.get(id)).filter(Boolean);
    },
    async update(id, patch) {
      if (supabase) {
        const { data, error } = await supabase
          .from('contents')
          .update(patch)
          .eq('id', id).eq('tenant_id', currentTenantId())
          .select('id,course,topic,framework,hook,caption,media_url,platforms,status,scheduled_at,published_at,last_error,retry_count,last_attempt_at,created_at,updated_at')
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
      const i = memory.contents.findIndex(c => c.id === id);
      if (i < 0) return null;
      memory.contents[i] = { ...memory.contents[i], ...patch };
      return memory.contents[i];
    },
    // ⚠️ GLOBAL — cron ประมวลผล scheduled posts ของ "ทุก tenant" รวมกัน
    //    row ที่คืนมามี tenant_id ติดมาด้วย → cron wrap งานแต่ละ row ด้วย runWithTenant()
    async due() {
      const now = new Date().toISOString();
      const staleProcessing = new Date(Date.now() - 5 * 60_000).toISOString();
      if (supabase) {
        const { data: scheduledRows } = await supabase
          .from('contents').select('*')
          .eq('status', 'scheduled').lte('scheduled_at', now);
        const { data: stuckRows } = await supabase
          .from('contents').select('*')
          .eq('status', 'processing').lt('last_attempt_at', staleProcessing);
        return [...(scheduledRows || []), ...(stuckRows || [])];
      }
      return memory.contents.filter(c =>
        (c.status === 'scheduled' && new Date(c.scheduled_at) <= new Date()) ||
        (c.status === 'processing' && c.last_attempt_at && new Date(c.last_attempt_at) < new Date(staleProcessing))
      );
    }
  },

  // ─────────── settings (tenant-scoped) ───────────
  settings: {
    async get(key) {
      const tid = currentTenantId();
      if (supabase) {
        if (key) {
          const { data } = await supabase.from('settings')
            .select('value').eq('tenant_id', tid).eq('key', key).maybeSingle();
          return data ? data.value : null;
        }
        const { data } = await supabase.from('settings')
          .select('*').eq('tenant_id', tid).eq('key', 'brand_voice').maybeSingle();
        return data ? { brand_voice: data.value } : null;
      }
      if (key) return memory.settings[key] || null;
      return memory.settings;
    },
    async getAll() {
      if (supabase) {
        const { data } = await supabase.from('settings')
          .select('*').eq('tenant_id', currentTenantId());
        return Object.fromEntries((data || []).map(d => [d.key, d.value]));
      }
      return { ...memory.settings };
    },
    async set(patch) {
      const tid = currentTenantId();
      if (supabase) {
        const upserts = Object.entries(patch).map(([k, v]) => ({ tenant_id: tid, key: k, value: String(v) }));
        const { data, error } = await supabase.from('settings')
          .upsert(upserts, { onConflict: 'tenant_id,key' }).select();
        if (error) throw new Error(error.message);
        return Object.fromEntries((data || []).map(d => [d.key, d.value]));
      }
      Object.assign(memory.settings, patch);
      return { ...memory.settings };
    }
  },
  // 🔐 FB credentials — อ่าน/เขียนผ่าน db.settings (tenant-scoped อัตโนมัติ)
  fbCreds: {
    async get(course = null) {
      const all = await db.settings.getAll();
      const c = (course || '').toLowerCase();
      const pageId = (c && all[`fb_page_id_${c}`]) || all.fb_page_id || process.env.FB_PAGE_ID || null;
      const pageToken = (c && all[`fb_page_token_${c}`]) || all.fb_page_token || process.env.FB_PAGE_TOKEN || null;
      const igId = (c && all[`ig_business_id_${c}`]) || all.ig_business_id || process.env.IG_BUSINESS_ID || null;
      const ult = (c && all[`fb_long_lived_user_token_${c}`]) || all.fb_long_lived_user_token || null;
      const appId = (c && all[`fb_app_id_${c}`]) || all.fb_app_id || process.env.FB_APP_ID || null;
      const appSecret = (c && all[`fb_app_secret_${c}`]) || all.fb_app_secret || process.env.FB_APP_SECRET || null;
      const savedAt = (c && all[`fb_creds_saved_at_${c}`]) || all.fb_creds_saved_at || null;
      return {
        course: course || null,
        page_id: pageId,
        page_token: pageToken,
        long_lived_user_token: ult,
        app_id: appId,
        app_secret: appSecret,
        ig_business_id: igId,
        saved_at: savedAt,
        per_course: c ? !!all[`fb_page_token_${c}`] : false,
      };
    },
    async save({ course, page_id, page_token, long_lived_user_token, ig_business_id, app_id, app_secret }) {
      const patch = {};
      const c = (course || '').toLowerCase();
      const suffix = c ? `_${c}` : '';
      if (page_id) patch[`fb_page_id${suffix}`] = page_id;
      if (page_token) patch[`fb_page_token${suffix}`] = page_token;
      if (ig_business_id) patch[`ig_business_id${suffix}`] = ig_business_id;
      if (long_lived_user_token) patch[`fb_long_lived_user_token${suffix}`] = long_lived_user_token;
      if (app_id) patch[`fb_app_id${suffix}`] = app_id;
      if (app_secret) patch[`fb_app_secret${suffix}`] = app_secret;
      patch[`fb_creds_saved_at${suffix}`] = new Date().toISOString();
      return await db.settings.set(patch);
    },
    async listAll() {
      const all = await db.settings.getAll();
      const courses = ['PFB', 'PHE', 'GURU'];
      const result = { default: null, per_course: {} };
      result.default = {
        page_id: all.fb_page_id || process.env.FB_PAGE_ID || null,
        page_token: all.fb_page_token ? '***SET***' : (process.env.FB_PAGE_TOKEN ? '***ENV***' : null),
        ig_business_id: all.ig_business_id || process.env.IG_BUSINESS_ID || null,
        saved_at: all.fb_creds_saved_at || null,
      };
      for (const co of courses) {
        const lc = co.toLowerCase();
        const has = !!(all[`fb_page_token_${lc}`] || all[`fb_page_id_${lc}`]);
        if (has) {
          result.per_course[co] = {
            page_id: all[`fb_page_id_${lc}`] || null,
            page_token: all[`fb_page_token_${lc}`] ? '***SET***' : null,
            ig_business_id: all[`ig_business_id_${lc}`] || null,
            saved_at: all[`fb_creds_saved_at_${lc}`] || null,
          };
        }
      }
      result.has_long_lived_user_token = !!all.fb_long_lived_user_token;
      return result;
    }
  },
  // 🎵 TikTok credentials (tenant-scoped ผ่าน db.settings)
  ttCreds: {
    async get(course = null) {
      const all = await db.settings.getAll();
      const c = (course || '').toLowerCase();
      return {
        course: course || null,
        client_key: process.env.TIKTOK_CLIENT_KEY || null,
        client_secret: process.env.TIKTOK_CLIENT_SECRET || null,
        redirect_uri: process.env.TIKTOK_REDIRECT_URI || null,
        access_token: (c && all[`tt_access_token_${c}`]) || all.tt_access_token || process.env.TIKTOK_ACCESS_TOKEN || null,
        refresh_token: (c && all[`tt_refresh_token_${c}`]) || all.tt_refresh_token || process.env.TIKTOK_REFRESH_TOKEN || null,
        open_id: (c && all[`tt_open_id_${c}`]) || all.tt_open_id || process.env.TIKTOK_OPEN_ID || null,
        expires_at: (c && all[`tt_expires_at_${c}`]) || all.tt_expires_at || null,
        saved_at: (c && all[`tt_saved_at_${c}`]) || all.tt_saved_at || null,
        per_course: c ? !!all[`tt_access_token_${c}`] : false,
      };
    },
    async save({ course, access_token, refresh_token, open_id, expires_at }) {
      const patch = {};
      const c = (course || '').toLowerCase();
      const suffix = c ? `_${c}` : '';
      if (access_token) patch[`tt_access_token${suffix}`] = access_token;
      if (refresh_token) patch[`tt_refresh_token${suffix}`] = refresh_token;
      if (open_id) patch[`tt_open_id${suffix}`] = open_id;
      if (expires_at) patch[`tt_expires_at${suffix}`] = String(expires_at);
      patch[`tt_saved_at${suffix}`] = new Date().toISOString();
      return await db.settings.set(patch);
    },
    async listAll() {
      const all = await db.settings.getAll();
      const courses = ['PFB', 'PHE', 'GURU'];
      const result = { default: null, per_course: {} };
      result.default = {
        access_token: all.tt_access_token ? '***DB***' : (process.env.TIKTOK_ACCESS_TOKEN ? '***ENV***' : null),
        open_id: all.tt_open_id || process.env.TIKTOK_OPEN_ID || null,
        expires_at: all.tt_expires_at || null,
        saved_at: all.tt_saved_at || null,
      };
      for (const co of courses) {
        const lc = co.toLowerCase();
        if (all[`tt_access_token_${lc}`]) {
          result.per_course[co] = {
            access_token: '***DB***',
            open_id: all[`tt_open_id_${lc}`] || null,
            expires_at: all[`tt_expires_at_${lc}`] || null,
            saved_at: all[`tt_saved_at_${lc}`] || null,
          };
        }
      }
      return result;
    }
  }
};

// Backward-compat aliases (สำหรับ ai.js + auth.js เวอร์ชันเก่า)
export const inMemoryDB = {
  contents: {
    insert: (row) => db.contents.insert(row),
    list: () => db.contents.list(),
    update: (id, patch) => db.contents.update(id, patch),
    due: () => db.contents.due(),
  },
  settings: { get: () => db.settings.get(), set: (p) => db.settings.set(p) }
};
