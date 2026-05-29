// public/js/data/brand-normalize.js
//
// Coerce arbitrary brand-shaped input into the canonical shape. Loaded from
// brands.js (mutation entry-point) and reused by the brand-edit pages.
// Kept separate so brand-normalize stays a pure function with no circular
// edges back to BRANDS.
//
// Canonical shape:
//   { id, name, mark, color, sub_th, sub_en, ch, logo, bizType, desc,
//     voice, products, shopStats, shopUrl, channelInfo, archetype, topics,
//     aiInstruction, voiceNotes }

export function normalizeBrand(b) {
  return {
    id: b.id || ('b' + Math.random().toString(36).slice(2, 7)),
    name: b.name || b.name_th || b.name_en || 'แบรนด์',
    mark: b.mark || String(b.name || b.name_th || 'B').replace(/\s+/g, '').slice(0, 2).toUpperCase(),
    color: b.color || 'linear-gradient(135deg,#FB923C,#F97316)',
    sub_th: b.sub_th || b.type || (b.sub && b.sub.th) || 'แบรนด์',
    sub_en: b.sub_en || b.type || (b.sub && b.sub.en) || 'Brand',
    ch: Array.isArray(b.ch) ? b.ch : [],
    logo: b.logo || '',
    bizType: b.bizType || '',
    desc: b.desc || '',
    voice: Array.isArray(b.voice) ? b.voice : [],
    products: Array.isArray(b.products) ? b.products : null,
    shopStats: b.shopStats || null,
    shopUrl: b.shopUrl || '',
    channelInfo: (b.channelInfo && typeof b.channelInfo === 'object') ? b.channelInfo : {},
    archetype: b.archetype || '',
    topics: Array.isArray(b.topics) ? b.topics : null,
    // Free-form "system prompt" — pasted by power users for custom AI behavior.
    // Backend (/content-brand, /topics-brand) prepends this to the system prompt
    // BEFORE the standard brand profile block, so it overrides default tone but
    // still gets the structured brand data (voice/archetype/products) appended.
    aiInstruction: typeof b.aiInstruction === 'string' ? b.aiInstruction : '',
    // Free-form Brand Voice notes (the "คำอธิบายเสียงเพิ่มเติม" textarea).
    voiceNotes: typeof b.voiceNotes === 'string' ? b.voiceNotes : '',
    // AI Instruction builder selections — { sectionKey: string[] }. Compiled
    // into aiInstruction; kept so the picker can re-highlight chosen options.
    aiInsChoices: (b.aiInsChoices && typeof b.aiInsChoices === 'object' && !Array.isArray(b.aiInsChoices)) ? b.aiInsChoices : {},
  };
}
