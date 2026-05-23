"""
Generate POSTPOST_FEATURES.pdf — A4 feature summary doc with Thai support.
Uses Leelawadee UI (Windows built-in) for ภาษาไทย rendering.

Run:
    python scripts/build_features_pdf.py
Output:
    D:\\PostPost\\POSTPOST_FEATURES.pdf
"""
import os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily


# ── Register Thai fonts. Returns (regular_name, bold_name) — bold may equal regular
# if no bold variant is available on disk.
def register_thai_fonts():
    # Search: try Leelawadee Bold pair (best for Thai), then Tahoma Bold pair as fallback.
    # Note: 'LeelawUI' (UI variant) has NO bold .ttf in default Windows installs — must
    # pair with 'leelawdb.ttf' from the classic Leelawadee family.
    candidates = [
        ("Leelawadee", "C:/Windows/Fonts/leelawad.ttf",  "C:/Windows/Fonts/leelawdb.ttf"),
        ("LeelawadeeUI", "C:/Windows/Fonts/LeelawUI.ttf","C:/Windows/Fonts/leelawdb.ttf"),  # mix UI regular + classic bold
        ("Tahoma",     "C:/Windows/Fonts/tahoma.ttf",    "C:/Windows/Fonts/tahomabd.ttf"),
    ]
    for name, reg, bold in candidates:
        if not Path(reg).exists(): continue
        pdfmetrics.registerFont(TTFont(name, reg))
        bold_name = name + "-Bold"
        if Path(bold).exists():
            pdfmetrics.registerFont(TTFont(bold_name, bold))
        else:
            bold_name = name        # fallback: same font for bold (no visual difference)
        registerFontFamily(name, normal=name, bold=bold_name,
                           italic=name, boldItalic=bold_name)
        return name, bold_name
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_thai_fonts()
print(f"[fonts] registered: regular={FONT}, bold={FONT_BOLD}")

# ── Brand colors
ORANGE = HexColor("#FB923C")
ORANGE_DARK = HexColor("#9A3412")
PURPLE = HexColor("#7C3AED")
PURPLE_DARK = HexColor("#1E1B3A")
CREAM = HexColor("#FFF7ED")
GREEN = HexColor("#16A34A")
BLUE = HexColor("#2563EB")
GRAY = HexColor("#7C7393")
LIGHT_GRAY = HexColor("#E5E7EB")
PINK = HexColor("#FFE4E6")
PINK_FG = HexColor("#9F1239")


# ── Styles
styles = getSampleStyleSheet()

# NOTE: All styles use the BASE font name. Bold rendering is achieved by wrapping
# text with <b>...</b> — reportlab resolves to FONT_BOLD via registerFontFamily().
style_title = ParagraphStyle(
    "title", parent=styles["Title"], fontName=FONT,
    fontSize=28, leading=34, textColor=PURPLE_DARK, alignment=TA_LEFT, spaceAfter=4,
)
style_subtitle = ParagraphStyle(
    "subtitle", fontName=FONT, fontSize=14, leading=18,
    textColor=GRAY, alignment=TA_LEFT, spaceAfter=18,
)
style_h1 = ParagraphStyle(
    "h1", fontName=FONT, fontSize=18, leading=24,
    textColor=ORANGE_DARK, spaceBefore=18, spaceAfter=8,
)
style_h2 = ParagraphStyle(
    "h2", fontName=FONT, fontSize=14, leading=20,
    textColor=PURPLE_DARK, spaceBefore=10, spaceAfter=5,
)
style_body = ParagraphStyle(
    "body", fontName=FONT, fontSize=11, leading=16,
    textColor=PURPLE_DARK, spaceAfter=6,
)
style_micro = ParagraphStyle(
    "micro", fontName=FONT, fontSize=9.5, leading=14,
    textColor=GRAY, spaceAfter=4,
)
style_bullet = ParagraphStyle(
    "bullet", fontName=FONT, fontSize=11, leading=15.5,
    textColor=PURPLE_DARK, leftIndent=14, bulletIndent=4, spaceAfter=3,
)
style_eyebrow = ParagraphStyle(
    "eyebrow", fontName=FONT, fontSize=9.5, leading=12,
    textColor=ORANGE, spaceAfter=2,
)


def hr():
    return HRFlowable(width="100%", thickness=0.7, color=LIGHT_GRAY,
                      spaceBefore=8, spaceAfter=8)


def chip(text, bg=CREAM, fg=ORANGE_DARK):
    """Small pill chip rendered as a 1-cell table"""
    t = Table([[Paragraph(f'<b>{text}</b>', style_micro)]],
              colWidths=[None], rowHeights=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("TEXTCOLOR", (0, 0), (-1, -1), fg),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BOX", (0, 0), (-1, -1), 0.5, bg),
    ]))
    return t


def feature_table(rows, col_widths=None, header_bg=ORANGE, header_fg=white):
    """Standardized table with header row + body rows"""
    if not col_widths:
        col_widths = [4.5 * cm] + [None] * (len(rows[0]) - 1)
    table = Table(rows, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ("FONTNAME", (0, 1), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), header_fg),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("ALIGN", (0, 1), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, CREAM]),
        ("LINEBELOW", (0, 0), (-1, 0), 1, ORANGE_DARK),
        ("BOX", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
    ]))
    return table


# ── Build the document
def build():
    OUTPUT = Path(__file__).resolve().parent.parent / "POSTPOST_FEATURES.pdf"
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=1.8 * cm, rightMargin=1.8 * cm,
        topMargin=1.6 * cm, bottomMargin=1.6 * cm,
        title="PostPost — Features Summary",
        author="PostPost",
    )

    story = []

    # ═══════════════════ COVER ═══════════════════
    story.append(Paragraph('<font color="#FB923C">●</font>  <b>PostPost</b>', style_title))
    story.append(Paragraph("AI Content Command Center — สรุปฟีเจอร์ครบทุกความสามารถ",
                           style_subtitle))

    # Tagline box
    tagline = Table(
        [[Paragraph(
            '<font size="14"><b>ให้ AI ปั้นคอนเทนต์ครบจบในที่เดียว</b></font><br/>'
            '<font size="10" color="#7C7393">ตั้งแต่ดึงสินค้า → คิดหัวข้อ → เขียน → สร้างรูป → ทำวิดีโอ → โพสต์อัตโนมัติ</font>',
            ParagraphStyle("tagline", fontName=FONT, alignment=TA_LEFT, leading=20))]],
        colWidths=[16.5 * cm],
    )
    tagline.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ORANGE),
    ]))
    story.append(tagline)

    story.append(Spacer(1, 0.4 * cm))

    # Quick stats grid
    stats = Table([[
        Paragraph('<font color="#FB923C" size="20"><b>12</b></font><br/>'
                  '<font size="9" color="#7C7393">หน้าหลัก</font>',
                  ParagraphStyle("c", fontName=FONT, alignment=TA_CENTER, leading=14)),
        Paragraph('<font color="#FB923C" size="20"><b>9</b></font><br/>'
                  '<font size="9" color="#7C7393">โมเดล Video AI</font>',
                  ParagraphStyle("c", fontName=FONT, alignment=TA_CENTER, leading=14)),
        Paragraph('<font color="#FB923C" size="20"><b>5</b></font><br/>'
                  '<font size="9" color="#7C7393">โมเดล Lip-sync</font>',
                  ParagraphStyle("c", fontName=FONT, alignment=TA_CENTER, leading=14)),
        Paragraph('<font color="#FB923C" size="20"><b>5</b></font><br/>'
                  '<font size="9" color="#7C7393">เสียงไทย TTS</font>',
                  ParagraphStyle("c", fontName=FONT, alignment=TA_CENTER, leading=14)),
        Paragraph('<font color="#FB923C" size="20"><b>$12</b></font><br/>'
                  '<font size="9" color="#7C7393">ต่อ user/เดือน</font>',
                  ParagraphStyle("c", fontName=FONT, alignment=TA_CENTER, leading=14)),
    ]], colWidths=[3.3 * cm] * 5)
    stats.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), white),
        ("BOX", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ("LINEAFTER", (0, 0), (-2, -1), 0.5, LIGHT_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(stats)

    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("URL · <font color='#2563EB'>https://post-post-seven.vercel.app</font>",
                           style_micro))

    # ═══════════════════ 1. PROFILE & BRAND ═══════════════════
    story.append(Paragraph("WORKSPACE", style_eyebrow))
    story.append(Paragraph("<b>1.  Profile — แบรนด์ · สินค้า · ช่องทาง</b>", style_h1))

    story.append(Paragraph("Multi-brand workspace", style_h2))
    story.append(Paragraph(
        "รองรับ 5 แบรนด์ในบัญชีเดียว · แต่ละแบรนด์มี logo, ชื่อ, ประเภทธุรกิจ, "
        "Brand Voice, Archetype, สินค้า, channels ของตัวเอง · สลับแบรนด์ → "
        "AI โหลด context ใหม่ทันที", style_body))

    story.append(Paragraph("Brand Voice · เลือก 3 จาก 11", style_h2))
    voices = ["อบอุ่น", "เป็นมิตร", "เป็นกันเอง", "ขี้เล่น", "มืออาชีพ", "เชี่ยวชาญ",
              "สร้างแรงบันดาลใจ", "ขรึม", "หรูหรา", "เห็นใจ", "กล้า"]
    story.append(Paragraph(" · ".join(voices), style_body))

    story.append(Paragraph("Brand Archetype · 12 ตัวเลือก", style_h2))
    arcs = ["Hero", "Sage", "Caregiver", "Magician", "Rebel", "Lover",
            "Jester", "Innocent", "Explorer", "Creator", "Ruler", "Everyman"]
    story.append(Paragraph(" · ".join(arcs), style_body))

    story.append(Paragraph("AI Brand Description Writer", style_h2))
    story.append(Paragraph(
        "กดเดียว AI เขียน 3 แบบให้เลือก: ละเอียดครบถ้วน / สั้นกระชับ / สไตล์เล่าเรื่อง "
        "· ใช้ businessType เป็น ground truth ห้ามหลุดประเภทธุรกิจ", style_body))

    story.append(Paragraph("Shopee Auto-Sync · ดึง 8-180 สินค้าใน 14 วินาที", style_h2))
    story.append(Paragraph(
        "วาง URL ร้าน Shopee → AI ดึง ชื่อ · ราคา · ราคาก่อนลด · จำนวนขาย · เรตติ้ง · "
        "รูป 1-6 ใบ/สินค้า · description 3000 ตัว · 2 modes: Local Python (~14s) หรือ "
        "Cloud Render worker (~60-180s) · 'Use my machine' toggle ทำให้ Vercel "
        "เรียก localhost:3000 ตรง ๆ ได้", style_body))

    story.append(Paragraph("Social OAuth — Facebook + Instagram + TikTok", style_h2))
    story.append(Paragraph(
        "เชื่อม FB + IG พร้อมกันใน OAuth ครั้งเดียว · TikTok แยก OAuth · เก็บ token, "
        "page_id, IG business id ต่อแบรนด์ · ไม่ต้อง paste token ด้วยมือ", style_body))

    story.append(PageBreak())

    # ═══════════════════ 2. CONTENT CREATION ═══════════════════
    story.append(Paragraph("CONTENT CREATION", style_eyebrow))
    story.append(Paragraph("2.  Topic Bank — AI วางแผน 30 หัวข้อ/เดือน", style_h1))
    story.append(Paragraph(
        "AI วิเคราะห์ Brand Voice + สินค้า + กลุ่มลูกค้า → ปั้น 30 หัวข้อคอนเทนต์ครบ 1 เดือน "
        "· แบ่งตามจุดประสงค์: Educate / Sell / Story / Trend / Tip / ถาม-ตอบ · "
        "Framework: F1 PFB · F2 PHE · F3 GURU · กดเดียวลัดไปสร้าง Caption", style_body))

    story.append(Paragraph("3.  สร้าง Caption — AI 4-in-1", style_h1))
    story.append(Paragraph(
        "กดปุ่ม 'สร้างทั้งหมด' ครั้งเดียว AI สร้างพร้อมกัน 4 อย่าง:", style_body))
    story.append(Paragraph("• <b>Hook 3 มุม</b> — แต่ละ angle ต่างกัน (curiosity / urgency / social-proof)", style_bullet))
    story.append(Paragraph("• <b>Caption เต็มโพสต์</b> — ภาษาไทยลื่นไหล + emoji เหมาะ ใช้ Brand Voice", style_bullet))
    story.append(Paragraph("• <b>Hashtag 10-14 ตัว</b> — mix general + niche + branded", style_bullet))
    story.append(Paragraph("• <b>บทความ 250 คำ</b> — สำหรับ Facebook ยาว / blog", style_bullet))
    story.append(Paragraph("• <b>Image Prompts 1-10</b> — สำหรับสร้างรูปต่อใน Creative page", style_bullet))

    story.append(Paragraph("4.  สร้าง Creative — AI Image Generation", style_h1))
    story.append(feature_table([
        ["รายการ", "รายละเอียด"],
        ["Format", "รูปเดี่ยว (1 ภาพ) / อัลบั้ม (1-10 สไลด์)"],
        ["AI Models", "Gemini (ฟรี · Thai text สวย) / GPT-5.4 Image ($0.98/รูป premium)"],
        ["Image Count", "1-10 รูป — AI สร้างให้ครบเป๊ะ ๆ มี safety net retry"],
        ["Numbered topics", "AI ใส่เลขข้อชัด '5 สัญญาณ' → 6 สไลด์ (cover + 5 ข้อ)"],
        ["Post Preview", "carousel เลื่อนได้ · aspect 1:1/4:5/9:16 toggle"],
        ["PNG Export", "ดาวน์โหลด 1080×1080 / 1080×1350 / 1080×1920"],
    ], col_widths=[3.5 * cm, 12.5 * cm]))

    story.append(PageBreak())

    # ═══════════════════ 3. VIDEO ═══════════════════
    story.append(Paragraph("VIDEO PRODUCTION", style_eyebrow))
    story.append(Paragraph("5.  Talking Avatar — AI Presenter พูดได้", style_h1))

    story.append(Paragraph("เลือก Presenter (4 default + custom)", style_h2))
    story.append(Paragraph(
        "มินตรา (หญิงไทย 28) · ภูมิ (ชายไทย 35) · น้องโรส (หญิง 22) · อาจารย์วุฒิ (อาวุโส 55) "
        "+ AI gen คนใหม่จาก description + Upload รูปคนเองได้ (เก็บถาวรใน localStorage)",
        style_body))

    story.append(Paragraph("Voice — Azure Speech Thai (5 voices)", style_h2))
    story.append(feature_table([
        ["Voice", "เพศ", "โทน", "เหมาะกับ"],
        ["Premwadee", "หญิง", "อบอุ่น",       "สกินแคร์ · ความงาม"],
        ["Achara",    "หญิง", "เป็นมิตร",     "lifestyle · แม่และเด็ก"],
        ["Niwat",     "ชาย",  "มืออาชีพ",     "ธุรกิจ · การเงิน"],
        ["อาจารย์เทพ", "ชาย",  "ขรึม น่าเชื่อถือ", "สายมู · ดูดวง"],
        ["พี่ตี้",     "ชาย",  "เป็นกันเอง",    "casual · บันเทิง"],
    ], col_widths=[3 * cm, 2 * cm, 3.5 * cm, 5 * cm]))

    story.append(Paragraph("Lip-Sync Models (fal.ai) — 5 ตัวเลือก", style_h2))
    story.append(feature_table([
        ["Model", "ราคา/30s", "คุณภาพ", "เหมาะกับ"],
        ["fal-ai/sadtalker",                   "$0.10", "ปากขยับชัด",    "ทดสอบ ราคาถูก"],
        ["fal-ai/infinitalk ⭐ BEST",          "$0.20", "สมูทธรรมชาติ",   "ใช้งานจริง คุ้มสุด"],
        ["veed/fabric-1.0",                    "$0.30", "คุณภาพดี ลื่น",   "Content เน้นภาพ"],
        ["fal-ai/bytedance/omnihuman",         "$0.50", "Premium",        "งาน premium"],
        ["fal-ai/.../omnihuman/v1.5 🏆 TOP",   "$0.50", "เหมือนจริงสุด",   "Trust-critical"],
    ], col_widths=[6.5 * cm, 2 * cm, 3 * cm, 4.5 * cm]))

    story.append(Paragraph("Speaking Background (Pexels + bundled)", style_h2))
    story.append(Paragraph(
        "9 scene presets: อัตโนมัติ · สตูดิโอ · คาเฟ่ · ทะเล · บิวตี้ · "
        "<b>สายมู</b> (local file) · <b>แท่นบูชา</b> (local file) · ปิด BG · อัปโหลด · "
        "Pexels API หรือ bundled local mp4 (800KB) — universal fallback ทุกแบรนด์",
        style_body))

    story.append(Paragraph("6.  Text-to-Video — 9 โมเดล AI", style_h1))
    story.append(feature_table([
        ["Model", "Provider", "ราคา", "จุดเด่น"],
        ["Wan 2.2 ⭐ BEST DEAL", "fal.ai", "$0.30", "ถูกสุด · เร็ว ลื่น (default)"],
        ["Veo 2",                "Google", "FREE",  "ฟรี 2-5 คลิป/วัน"],
        ["Luma Dream Machine",   "fal.ai", "$0.40", "Character consistency"],
        ["Wan 2.5 (preview)",    "fal.ai", "$0.40", "รุ่นใหม่ ดีกว่า 2.2"],
        ["Hailuo 02",            "fal.ai", "$0.45", "Cinematic 6 วินาที"],
        ["Kling 2.5 Turbo Pro",  "fal.ai", "$0.70", "Premium cinematic"],
        ["Veo 3 Fast",           "Google", "$0.80", "ลื่น คมชัด"],
        ["Veo 3 Pro",            "Google", "$3.20", "คุณภาพสูงสุด"],
        ["Veo 3.1 Pro (preview)","Google", "$3.20+","ใหม่สุด"],
    ], col_widths=[5.5 * cm, 2.5 * cm, 2 * cm, 6 * cm]))

    story.append(Paragraph("Visual Styles (5)", style_h2))
    story.append(Paragraph(
        "Creator/UGC (คนถือสินค้า · default) · Cinematic (filmic) · Lifestyle (ใช้จริง) · "
        "Product (เน้นสินค้า) · Anime/3D",
        style_body))

    story.append(PageBreak())

    # ═══════════════════ 4. OPERATIONS ═══════════════════
    story.append(Paragraph("OPERATIONS", style_eyebrow))
    story.append(Paragraph("7.  ปฏิทินคอนเทนต์ — Schedule + Drag Drafts", style_h1))
    story.append(Paragraph(
        "Month grid view (28-31 days) · Day detail panel แสดง posts ตามสถานะ "
        "(published/scheduled/failed) · Drafts panel — กดปุ่ม 'ตั้งวันที่เลือก' "
        "หรือ 'พรุ่งนี้' เพื่อ schedule · ปุ่ม 'เพิ่มโพสต์' เปิด modal เลือก draft + วันที่",
        style_body))

    story.append(Paragraph("8.  คลังคอนเทนต์ — Library", style_h1))
    story.append(Paragraph(
        "5 type filters: ทั้งหมด · รูปภาพ · อัลบั้ม · วิดีโอ · แคปชั่น (auto-classify ตาม imageCount) · "
        "Status filters: เผยแพร่แล้ว · รอเวลา · Draft · "
        "Storage: metadata + thumbnail ใน localStorage · ภาพ/วิดีโอเต็มขนาดใน IndexedDB · "
        "คลิก card → restore state กลับไปแก้ไข",
        style_body))

    story.append(Paragraph("9.  Automation — Auto-post Engine", style_h1))
    story.append(Paragraph(
        "Cron worker รัน scheduled posts ทุก 5 นาที · "
        "Facebook + Instagram (ผ่าน Graph API · multi-image carousel) · "
        "TikTok Content Posting API (Init → Upload → Publish) · "
        "Auto-refresh token ก่อนหมดอายุ · Retry 3 ครั้ง backoff ถ้า fail",
        style_body))

    story.append(Paragraph("10. Analytics", style_h1))
    story.append(Paragraph(
        "Per-channel performance (Reach, engagement, clicks) · "
        "Group by brand / channel / topic-kind / week · "
        "AI Recommend ช่วงเวลาโพสต์ที่ engagement สูงสุด (e.g. 19:00-21:00)",
        style_body))

    story.append(PageBreak())

    # ═══════════════════ 5. STACK & COST ═══════════════════
    story.append(Paragraph("INFRASTRUCTURE", style_eyebrow))
    story.append(Paragraph("11. Tech Stack", style_h1))

    story.append(feature_table([
        ["Component", "Tech"],
        ["Frontend",     "Vanilla JS (no framework) · 1 file public/index.html ~5000 บรรทัด"],
        ["Backend",      "Node 20 · Express · ESM · multi-tenant (tenant_id RLS)"],
        ["Database",     "Supabase Postgres + Storage"],
        ["Text AI",      "OpenRouter → Claude Sonnet 4.5 (default)"],
        ["Image AI",     "OpenRouter → Gemini 3.1 Flash / GPT-5.4 Image"],
        ["Video AI",     "Google Veo 2/3/3.1 · fal.ai (Wan/Kling/Hailuo/Luma)"],
        ["Voice TTS",    "Azure Speech Service (th-TH Neural)"],
        ["Lip-sync",     "fal.ai (Infinitalk/SadTalker/OmniHuman/Fabric)"],
        ["Stock video",  "Pexels API (200/h, 20K/mo free)"],
        ["Deployment",   "Vercel (frontend + API) · Render (Shopee scraper)"],
    ], col_widths=[3.5 * cm, 12.5 * cm]))

    story.append(Paragraph("12. ค่าใช้จ่ายต่อ Active User (~30 โพสต์/เดือน)", style_h1))
    cost = feature_table([
        ["บริการ", "ค่าใช้จ่าย/เดือน"],
        ["Vercel Hobby",                       "$0 (ฟรี)"],
        ["Supabase Free tier",                 "$0 (ฟรี)"],
        ["OpenRouter (text · Claude Sonnet)",  "~$2"],
        ["Gemini Image / Veo 2",               "$0 (free tier)"],
        ["Wan 2.2 (30 videos × $0.30)",        "~$9"],
        ["Azure Speech TTS",                   "$0 (F0 free: 500K chars/mo)"],
        ["fal.ai Infinitalk (5 talking videos)", "~$1"],
        ["Pexels API",                         "$0 (free)"],
        ["รวมทั้งหมด",                          "~$12/user/เดือน"],
    ], col_widths=[8 * cm, 8 * cm])
    cost.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ("FONTNAME", (0, 1), (-1, -1), FONT),
        ("FONTNAME", (0, -1), (-1, -1), FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, -1), (-1, -1), CREAM),
        ("TEXTCOLOR", (0, -1), (-1, -1), ORANGE_DARK),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, CREAM]),
        ("BOX", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ("LINEABOVE", (0, -1), (-1, -1), 1, ORANGE_DARK),
    ]))
    story.append(cost)

    story.append(Spacer(1, 0.5 * cm))

    # ═══════════════════ 13. DIFFERENTIATORS ═══════════════════
    story.append(Paragraph("13. Key Differentiators", style_h1))
    diffs = [
        ("🎯 Brand-aware AI",      "AI รู้จัก voice + archetype + สินค้า + กลุ่มลูกค้าของทุกแบรนด์"),
        ("🔁 End-to-end",          "ดึงสินค้า → ปั้นคอนเทนต์ → โพสต์ในแอปเดียว"),
        ("🎨 Multi-modal AI",      "Text + Image + Video + Voice ในระบบเดียว"),
        ("🇹🇭 Thai-first",         "Voice ไทย · font Prompt · prompt engineering สำหรับไทย"),
        ("🏢 Per-brand isolation", "5 แบรนด์ → แต่ละแบรนด์มีระบบของตัวเอง 100%"),
        ("⚡ Real-time generation", "ทุกอย่างสร้างทันที ไม่ต้องรอ batch"),
        ("🔗 OAuth publishing",    "เชื่อม Facebook/IG/TikTok ครั้งเดียว"),
        ("💰 Cost-efficient",      "ใช้ open AI models (Wan, Veo 2) → ต้นทุนต่ำกว่าคู่แข่ง"),
    ]
    for title, desc in diffs:
        story.append(Paragraph(
            f'<b>{title}</b>  · <font color="#7C7393">{desc}</font>',
            style_body))

    story.append(Spacer(1, 0.7 * cm))

    # ═══════════════════ FOOTER ═══════════════════
    story.append(hr())
    story.append(Paragraph(
        '<font color="#7C7393" size="9">'
        'PostPost · AI Content Command Center · 2026 · '
        '<font color="#2563EB">post-post-seven.vercel.app</font>'
        '</font>',
        ParagraphStyle("footer", fontName=FONT, alignment=TA_CENTER)))

    # ── Render
    doc.build(story)
    return OUTPUT


if __name__ == "__main__":
    out = build()
    print(f"[OK] PDF saved: {out}")
    print(f"     Size: {out.stat().st_size / 1024:.1f} KB")
