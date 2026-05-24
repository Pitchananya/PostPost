// public/js/data/business-types.js
//
// Catalog of Thai SME business categories shown in onboarding + brand-edit
// dropdowns. Each entry: { th, en } — matched on the Thai label across most
// of the legacy code (string comparison against the picked option text), so
// don't reorder/rename without grepping for the Thai labels first.

export const BUSINESS_TYPES = [
  { th: 'ความงาม & สกินแคร์', en: 'Beauty & Skincare' },
  { th: 'อาหารเสริม & สุขภาพ', en: 'Supplements & Health' },
  { th: 'แฟชั่น & เสื้อผ้า', en: 'Fashion & Apparel' },
  { th: 'อาหาร & เครื่องดื่ม', en: 'Food & Beverage' },
  { th: 'คาเฟ่ & ร้านอาหาร', en: 'Café & Restaurant' },
  { th: 'เครื่องประดับ & แอคเซสซอรี่', en: 'Jewelry & Accessories' },
  { th: 'ของแต่งบ้าน & ไลฟ์สไตล์', en: 'Home & Lifestyle' },
  { th: 'แม่และเด็ก', en: 'Mom & Baby' },
  { th: 'สัตว์เลี้ยง', en: 'Pet Products' },
  { th: 'อิเล็กทรอนิกส์ & แกดเจ็ต', en: 'Electronics & Gadgets' },
  { th: 'กีฬา & ฟิตเนส', en: 'Sports & Fitness' },
  { th: 'ท่องเที่ยว & ที่พัก', en: 'Travel & Hospitality' },
  { th: 'การศึกษา & คอร์สเรียน', en: 'Education & Courses' },
  { th: 'บริการ & ที่ปรึกษา', en: 'Services & Consulting' },
  { th: 'การเงิน & ลงทุน', en: 'Finance & Investment' },
  { th: 'สายมู & ดูดวง', en: 'Spiritual & Fortune' },
  { th: 'งานฝีมือ & DIY', en: 'Handmade & Crafts' },
  { th: 'รถยนต์ & ยานยนต์', en: 'Automotive' },
  { th: 'อสังหาริมทรัพย์', en: 'Real Estate' },
  { th: 'เกม & บันเทิง', en: 'Gaming & Entertainment' },
  { th: 'การเกษตร & ออร์แกนิค', en: 'Agriculture & Organic' },
  { th: 'อื่น ๆ', en: 'Other' },
];
