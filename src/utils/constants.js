// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS.JS - Semua konstanta, regex patterns, dan konfigurasi
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// REGEX PATTERNS - Untuk deteksi otomatis tipe data Indonesia
// ─────────────────────────────────────────────────────────────────────────────

export const PATTERNS = {
  // === INDONESIA SPECIFIC ===
  NIK: /^[1-9]\d{15}$/,
  NIK_WITH_FORMAT: /^\d{2}\.\d{2}\.\d{2}\.\d{6}\.\d{4}$/,
  NPWP: /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/,
  NPWP_NEW: /^\d{16}$/, // Format NPWP baru 2024
  PHONE_ID: /^(\+62|62|0)8[1-9][0-9]{7,11}$/,
  POSTAL_CODE_ID: /^[1-9]\d{4}$/,
  PLATE_NUMBER: /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/,
  
  // === UNIVERSAL ===
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  IP_ADDRESS: /^(\d{1,3}\.){3}\d{1,3}$/,
  
  // === NUMBERS & CURRENCY ===
  CURRENCY_IDR: /^Rp\.?\s?[\d.,]+$/i,
  CURRENCY_USD: /^\$[\d.,]+$/,
  CURRENCY_GENERIC: /^[A-Z]{3}\s?[\d.,]+$/,
  PERCENTAGE: /^-?\d+([.,]\d+)?%$/,
  NUMBER_WITH_SEPARATOR: /^-?[\d.,]+$/,
  
  // === DATE FORMATS ===
  DATE_DMY: /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-](\d{4}|\d{2})$/,
  DATE_YMD: /^(\d{4}|\d{2})[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/,
  DATE_MDY: /^(0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4}|\d{2})$/,
  DATE_INDONESIA: /^\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}$/i,
  TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?/,
  
  // === DOCUMENTS ===
  INVOICE_NO: /^(INV|FAK|FKT)[\/\-]?\d{4,}/i,
  PO_NUMBER: /^(PO|SPK)[\/\-]?\d{4,}/i,
  SKU: /^[A-Z]{2,4}[\-]?\d{4,}/,
  
  // === SOCIAL ===
  INSTAGRAM: /^@[a-zA-Z0-9_.]+$/,
  TWITTER: /^@[a-zA-Z0-9_]+$/
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  FLOAT: 'float',
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage',
  DATE: 'date',
  DATETIME: 'datetime',
  TIME: 'time',
  EMAIL: 'email',
  PHONE: 'phone',
  URL: 'url',
  NIK: 'nik',
  NPWP: 'npwp',
  BOOLEAN: 'boolean',
  EMPTY: 'empty',
  MIXED: 'mixed',
  UNKNOWN: 'unknown'
};

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE TYPES & SEVERITY
// ─────────────────────────────────────────────────────────────────────────────

export const ISSUE_TYPES = {
  DUPLICATE: {
    code: 'DUPLICATE',
    name: 'Data Duplikat',
    severity: 'warning',
    autoFixable: true
  },
  EMPTY_ROW: {
    code: 'EMPTY_ROW',
    name: 'Baris Kosong',
    severity: 'info',
    autoFixable: true
  },
  EMPTY_CELL: {
    code: 'EMPTY_CELL',
    name: 'Sel Kosong',
    severity: 'warning',
    autoFixable: false
  },
  FORMAT_INCONSISTENT: {
    code: 'FORMAT_INCONSISTENT',
    name: 'Format Tidak Konsisten',
    severity: 'warning',
    autoFixable: true
  },
  INVALID_NIK: {
    code: 'INVALID_NIK',
    name: 'NIK Tidak Valid',
    severity: 'error',
    autoFixable: false
  },
  INVALID_NPWP: {
    code: 'INVALID_NPWP',
    name: 'NPWP Tidak Valid',
    severity: 'error',
    autoFixable: false
  },
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    name: 'Email Tidak Valid',
    severity: 'error',
    autoFixable: false
  },
  INVALID_PHONE: {
    code: 'INVALID_PHONE',
    name: 'Nomor Telepon Tidak Valid',
    severity: 'warning',
    autoFixable: true
  },
  OUTLIER: {
    code: 'OUTLIER',
    name: 'Nilai Tidak Wajar (Outlier)',
    severity: 'warning',
    autoFixable: false
  },
  CALCULATION_ERROR: {
    code: 'CALCULATION_ERROR',
    name: 'Error Perhitungan',
    severity: 'error',
    autoFixable: true
  },
  PPN_ERROR: {
    code: 'PPN_ERROR',
    name: 'Perhitungan PPN Salah (Seharusnya 11%)',
    severity: 'error',
    autoFixable: true
  },
  TYPO: {
    code: 'TYPO',
    name: 'Kemungkinan Typo',
    severity: 'info',
    autoFixable: true
  },
  WHITESPACE: {
    code: 'WHITESPACE',
    name: 'Spasi Berlebih',
    severity: 'info',
    autoFixable: true
  },
  SPECIAL_CHAR: {
    code: 'SPECIAL_CHAR',
    name: 'Karakter Tidak Dikenal',
    severity: 'warning',
    autoFixable: true
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INDONESIA WILAYAH CODES (untuk validasi NIK)
// ─────────────────────────────────────────────────────────────────────────────

export const INDONESIA_PROVINCE_CODES = {
  '11': 'Aceh',
  '12': 'Sumatera Utara',
  '13': 'Sumatera Barat',
  '14': 'Riau',
  '15': 'Jambi',
  '16': 'Sumatera Selatan',
  '17': 'Bengkulu',
  '18': 'Lampung',
  '19': 'Kepulauan Bangka Belitung',
  '21': 'Kepulauan Riau',
  '31': 'DKI Jakarta',
  '32': 'Jawa Barat',
  '33': 'Jawa Tengah',
  '34': 'DI Yogyakarta',
  '35': 'Jawa Timur',
  '36': 'Banten',
  '51': 'Bali',
  '52': 'Nusa Tenggara Barat',
  '53': 'Nusa Tenggara Timur',
  '61': 'Kalimantan Barat',
  '62': 'Kalimantan Tengah',
  '63': 'Kalimantan Selatan',
  '64': 'Kalimantan Timur',
  '65': 'Kalimantan Utara',
  '71': 'Sulawesi Utara',
  '72': 'Sulawesi Tengah',
  '73': 'Sulawesi Selatan',
  '74': 'Sulawesi Tenggara',
  '75': 'Gorontalo',
  '76': 'Sulawesi Barat',
  '81': 'Maluku',
  '82': 'Maluku Utara',
  '91': 'Papua',
  '92': 'Papua Barat',
  '93': 'Papua Selatan',
  '94': 'Papua Tengah',
  '95': 'Papua Pegunungan',
  '96': 'Papua Barat Daya'
};

// ─────────────────────────────────────────────────────────────────────────────
// INDONESIAN MONTHS
// ─────────────────────────────────────────────────────────────────────────────

export const INDONESIAN_MONTHS = {
  'januari': 1, 'jan': 1,
  'februari': 2, 'feb': 2,
  'maret': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'mei': 5,
  'juni': 6, 'jun': 6,
  'juli': 7, 'jul': 7,
  'agustus': 8, 'agu': 8, 'ags': 8,
  'september': 9, 'sep': 9, 'sept': 9,
  'oktober': 10, 'okt': 10,
  'november': 11, 'nov': 11,
  'desember': 12, 'des': 12
};

// ─────────────────────────────────────────────────────────────────────────────
// PPN/TAX RATES INDONESIA (Updated 2024-2025)
// ─────────────────────────────────────────────────────────────────────────────

export const TAX_RATES = {
  PPN: 0.11, // 11% sejak April 2022
  PPN_2025: 0.12, // Rencana 12% di 2025 (opsional)
  PPH21_LAYER1: 0.05, // s/d 60 juta
  PPH21_LAYER2: 0.15, // 60-250 juta
  PPH21_LAYER3: 0.25, // 250-500 juta
  PPH21_LAYER4: 0.30, // 500 juta - 5 M
  PPH21_LAYER5: 0.35, // > 5 M
  PPH23: 0.02, // 2% untuk jasa
  PPH_FINAL_UMKM: 0.005 // 0.5% untuk UMKM
};

// ─────────────────────────────────────────────────────────────────────────────
// BOT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export const BOT_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_EXTENSIONS: ['.xlsx', '.xls', '.csv', '.json'],
  MAX_ROWS_PREVIEW: 10,
  MAX_ROWS_PROCESS: 50000,
  TEMP_FILE_LIFETIME: 30 * 60 * 1000, // 30 minutes
  
  COLORS: {
    PRIMARY: 0x5865F2,    // Discord Blurple
    SUCCESS: 0x57F287,    // Green
    WARNING: 0xFEE75C,    // Yellow
    ERROR: 0xED4245,      // Red
    INFO: 0x5865F2,       // Blue
    NEUTRAL: 0x99AAB5     // Gray
  },
  
  EMOJIS: {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    LOADING: '⏳',
    EXCEL: '📊',
    ANALYZE: '🔍',
    CLEAN: '🧹',
    CONVERT: '🔄',
    CREATE: '✨',
    TEMPLATE: '📋',
    STATS: '📈',
    HELP: '❓',
    ROCKET: '🚀',
    BRAIN: '🧠',
    FIRE: '🔥',
    STAR: '⭐',
    CHECK: '☑️',
    CROSS: '☒'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY SCORE THRESHOLDS
// ─────────────────────────────────────────────────────────────────────────────

export const QUALITY_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 50,
  POOR: 25
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATE_TYPES = {
  INVOICE: 'invoice',
  PAYROLL: 'payroll',
  INVENTORY: 'inventory',
  SALES_REPORT: 'sales_report',
  BUDGET: 'budget',
  ATTENDANCE: 'attendance',
  EXPENSE: 'expense',
  PURCHASE_ORDER: 'purchase_order',
  QUOTATION: 'quotation',
  CASHFLOW: 'cashflow'
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT FORMAT OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const EXPORT_FORMATS = {
  XLSX: { ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  XLS: { ext: '.xls', mime: 'application/vnd.ms-excel' },
  CSV: { ext: '.csv', mime: 'text/csv' },
  JSON: { ext: '.json', mime: 'application/json' },
  HTML: { ext: '.html', mime: 'text/html' },
  MD: { ext: '.md', mime: 'text/markdown' },
  SQL: { ext: '.sql', mime: 'text/plain' },
  XML: { ext: '.xml', mime: 'application/xml' },
  PDF: { ext: '.pdf', mime: 'application/pdf' }
};

// ─────────────────────────────────────────────────────────────────────────────
// NLP KEYWORDS (Untuk parsing instruksi bahasa natural Indonesia)
// ─────────────────────────────────────────────────────────────────────────────

export const NLP_KEYWORDS = {
  CREATE: ['buat', 'buatkan', 'create', 'generate', 'bikin', 'tambah'],
  COLUMN: ['kolom', 'column', 'field', 'dengan kolom', 'berisi'],
  TABLE: ['tabel', 'table', 'sheet', 'data', 'list', 'daftar'],
  FORMAT: ['format', 'formatkan', 'styling', 'style'],
  CLEAN: ['bersihkan', 'clean', 'hapus', 'remove', 'delete'],
  ANALYZE: ['analisis', 'analyze', 'cek', 'check', 'periksa'],
  CONVERT: ['convert', 'ubah', 'konversi', 'jadikan', 'export'],
  
  DATA_HINTS: {
    'nama': { type: 'string', sample: 'Budi Santoso' },
    'tanggal': { type: 'date', sample: '2025-01-15' },
    'gaji': { type: 'currency', sample: 5000000 },
    'harga': { type: 'currency', sample: 150000 },
    'jumlah': { type: 'number', sample: 10 },
    'qty': { type: 'number', sample: 5 },
    'total': { type: 'currency', sample: 1500000 },
    'email': { type: 'email', sample: 'contoh@email.com' },
    'telepon': { type: 'phone', sample: '08123456789' },
    'hp': { type: 'phone', sample: '08123456789' },
    'alamat': { type: 'string', sample: 'Jl. Contoh No. 123' },
    'nik': { type: 'nik', sample: '3201012345678901' },
    'npwp': { type: 'npwp', sample: '12.345.678.9-012.000' }
  }
};

export default {
  PATTERNS,
  DATA_TYPES,
  ISSUE_TYPES,
  INDONESIA_PROVINCE_CODES,
  INDONESIAN_MONTHS,
  TAX_RATES,
  BOT_CONFIG,
  QUALITY_THRESHOLDS,
  TEMPLATE_TYPES,
  EXPORT_FORMATS,
  NLP_KEYWORDS
};
