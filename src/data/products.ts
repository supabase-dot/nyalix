export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  price?: number;
  image: string;
  inStock: boolean;
  specifications: Record<string, string>;
  featured: boolean;
}

export const categories = [
  { en: "Diagnostic", ar: "تشخيصي" },
  { en: "Surgical", ar: "جراحي" },
  { en: "ICU Equipment", ar: "معدات العناية المركزة" },
  { en: "Laboratory", ar: "مختبري" },
  { en: "Imaging", ar: "التصوير" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Digital X-Ray System",
    nameAr: "نظام الأشعة السينية الرقمي",
    description: "High-resolution digital X-ray system with advanced imaging capabilities for precise diagnostics. Features automatic exposure control and low-dose technology.",
    descriptionAr: "نظام أشعة سينية رقمي عالي الدقة مع إمكانيات تصوير متقدمة للتشخيص الدقيق.",
    category: "Imaging",
    categoryAr: "التصوير",
    price: 45000,
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600",
    inStock: true,
    specifications: { "Resolution": "3000x3000 px", "Power": "50kW", "Weight": "250kg", "Warranty": "3 Years" },
    featured: true,
  },
  {
    id: "2",
    name: "Patient Monitor Pro",
    nameAr: "جهاز مراقبة المريض برو",
    description: "Multi-parameter patient monitor with 15-inch touchscreen display. Monitors ECG, SpO2, NIBP, temperature, and respiration rate.",
    descriptionAr: "جهاز مراقبة متعدد المعايير مع شاشة لمس 15 بوصة. يراقب تخطيط القلب والأكسجين وضغط الدم.",
    category: "ICU Equipment",
    categoryAr: "معدات العناية المركزة",
    price: 8500,
    image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600",
    inStock: true,
    specifications: { "Display": "15\" Touch", "Battery": "4 Hours", "Parameters": "7", "Warranty": "2 Years" },
    featured: true,
  },
  {
    id: "3",
    name: "Surgical LED Light",
    nameAr: "ضوء LED الجراحي",
    description: "High-intensity LED surgical light with adjustable color temperature and shadow-free illumination for optimal surgical visibility.",
    descriptionAr: "ضوء LED جراحي عالي الكثافة مع درجة حرارة لون قابلة للتعديل وإضاءة خالية من الظل.",
    category: "Surgical",
    categoryAr: "جراحي",
    price: 12000,
    image: "https://images.unsplash.com/photo-1551190822-a9ce113ac100?w=600",
    inStock: true,
    specifications: { "Illumination": "160,000 Lux", "Color Temp": "3500-5000K", "Lifespan": "50,000 hrs", "Warranty": "5 Years" },
    featured: true,
  },
  {
    id: "4",
    name: "Automated Blood Analyzer",
    nameAr: "محلل الدم الآلي",
    description: "Fully automated hematology analyzer capable of processing 60 samples per hour with 26 reportable parameters.",
    descriptionAr: "محلل أمراض الدم الآلي بالكامل قادر على معالجة 60 عينة في الساعة مع 26 معلمة قابلة للإبلاغ.",
    category: "Laboratory",
    categoryAr: "مختبري",
    price: 22000,
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600",
    inStock: true,
    specifications: { "Throughput": "60 samples/hr", "Parameters": "26", "Sample Volume": "20μL", "Warranty": "2 Years" },
    featured: true,
  },
  {
    id: "5",
    name: "Portable Ultrasound Scanner",
    nameAr: "جهاز الموجات فوق الصوتية المحمول",
    description: "Compact and lightweight portable ultrasound system with wireless probe connectivity and cloud-based image storage.",
    descriptionAr: "نظام الموجات فوق الصوتية المحمول والخفيف مع اتصال المسبار اللاسلكي.",
    category: "Diagnostic",
    categoryAr: "تشخيصي",
    price: 15000,
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600",
    inStock: false,
    specifications: { "Display": "10.1\" HD", "Battery": "6 Hours", "Weight": "1.2kg", "Modes": "B, M, Color Doppler" },
    featured: false,
  },
  {
    id: "6",
    name: "Electric Hospital Bed",
    nameAr: "سرير المستشفى الكهربائي",
    description: "Premium electric ICU bed with multiple positioning options, built-in weighing system, and CPR quick-release mechanism.",
    descriptionAr: "سرير العناية المركزة الكهربائي المتميز مع خيارات تحديد الموضع المتعددة.",
    category: "ICU Equipment",
    categoryAr: "معدات العناية المركزة",
    price: 6800,
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600",
    inStock: true,
    specifications: { "Load Capacity": "250kg", "Height Range": "40-80cm", "Functions": "5 Electric", "Warranty": "3 Years" },
    featured: false,
  },
  {
    id: "7",
    name: "Defibrillator AED Plus",
    nameAr: "جهاز إزالة الرجفان AED بلس",
    description: "Advanced automated external defibrillator with real-time CPR feedback, voice prompts, and pediatric capabilities.",
    descriptionAr: "جهاز إزالة الرجفان الخارجي الآلي المتقدم مع ردود فعل الإنعاش القلبي الرئوي في الوقت الفعلي.",
    category: "Diagnostic",
    categoryAr: "تشخيصي",
    price: 3500,
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600",
    inStock: true,
    specifications: { "Energy": "200J Biphasic", "Battery": "300 shocks", "Weight": "2.5kg", "Warranty": "7 Years" },
    featured: false,
  },
  {
    id: "8",
    name: "Centrifuge Machine",
    nameAr: "جهاز الطرد المركزي",
    description: "High-speed laboratory centrifuge with digital display, variable speed control, and automatic rotor recognition.",
    descriptionAr: "جهاز طرد مركزي مختبري عالي السرعة مع شاشة رقمية والتحكم في السرعة المتغيرة.",
    category: "Laboratory",
    categoryAr: "مختبري",
    price: 4200,
    image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600",
    inStock: true,
    specifications: { "Max Speed": "15,000 RPM", "Capacity": "24 tubes", "Timer": "1-99 min", "Warranty": "2 Years" },
    featured: false,
  },
];
