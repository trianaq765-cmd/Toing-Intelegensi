// ═══════════════════════════════════════════════════════════════════════════
// HELPERS.JS - Fungsi-fungsi pembantu umum
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { format, parse, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { 
  PATTERNS, 
  INDONESIA_PROVINCE_CODES, 
  INDONESIAN_MONTHS,
  TAX_RATES 
} from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// STRING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trim dan normalize whitespace
 */
export function normalizeString(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

/**
 * Convert ke Title Case (Huruf Pertama Kapital)
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

/**
 * Remove special characters kecuali yang umum
 */
export function cleanSpecialChars(str) {
  if (!str) return '';
  return str.replace(/[^\w\s\-.,@#()\/]/gi, '');
}

/**
 * Generate unique ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Generate UUID v4
 */
export function generateUUID() {
  return uuidv4();
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER & CURRENCY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse number dari string (handle Indonesia format: 1.234.567,89)
 */
export function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  
  let str = String(value).trim();
  
  // Remove currency symbols
  str = str.replace(/^(Rp\.?|IDR|\$|USD|EUR|€)\s*/i, '');
  
  // Detect format: Indonesia (1.234,56) vs US (1,234.56)
  const hasIndonesiaFormat = /^\d{1,3}(\.\d{3})*(,\d+)?$/.test(str);
  const hasUSFormat = /^\d{1,3}(,\d{3})*(\.\d+)?$/.test(str);
  
  if (hasIndonesiaFormat) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (hasUSFormat) {
    str = str.replace(/,/g, '');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Format number ke Indonesia format
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : parseNumber(value);
  if (num === null) return '-';
  
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format ke Rupiah
 */
export function formatRupiah(value, withSymbol = true) {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : parseNumber(value);
  if (num === null) return '-';
  
  const formatted = num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return withSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Format ke Dollar
 */
export function formatDollar(value) {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : parseNumber(value);
  if (num === null) return '-';
  
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'number' ? value : parseNumber(value);
  if (num === null) return '-';
  
  return `${formatNumber(num, decimals)}%`;
}

/**
 * Hitung PPN (11%)
 */
export function calculatePPN(value, rate = TAX_RATES.PPN) {
  const num = parseNumber(value);
  if (num === null) return null;
  return Math.round(num * rate);
}

/**
 * Hitung Total dengan PPN
 */
export function calculateWithPPN(value, rate = TAX_RATES.PPN) {
  const num = parseNumber(value);
  if (num === null) return null;
  return Math.round(num * (1 + rate));
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse date dari berbagai format
 */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  
  const str = String(value).trim();
  
  // Coba berbagai format
  const formats = [
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'dd-MM-yyyy',
    'MM/dd/yyyy',
    'yyyy/MM/dd',
    'd MMMM yyyy',
    'dd MMMM yyyy'
  ];
  
  for (const fmt of formats) {
    try {
      const parsed = parse(str, fmt, new Date(), { locale: id });
      if (isValid(parsed)) return parsed;
    } catch {
      continue;
    }
  }
  
  // Handle format Indonesia: "15 Januari 2025"
  const indoMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i);
  if (indoMatch) {
    const [, day, month, year] = indoMatch;
    const monthNum = INDONESIAN_MONTHS[month.toLowerCase()];
    if (monthNum) {
      return new Date(parseInt(year), monthNum - 1, parseInt(day));
    }
  }
  
  // Fallback ke Date constructor
  const fallback = new Date(str);
  return isValid(fallback) ? fallback : null;
}

/**
 * Format date ke string
 */
export function formatDate(value, formatStr = 'dd/MM/yyyy') {
  const date = parseDate(value);
  if (!date) return '-';
  return format(date, formatStr, { locale: id });
}

/**
 * Format date ke Indonesia format (15 Januari 2025)
 */
export function formatDateIndonesia(value) {
  const date = parseDate(value);
  if (!date) return '-';
  return format(date, 'd MMMM yyyy', { locale: id });
}

/**
 * Format datetime
 */
export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return '-';
  return format(date, 'dd/MM/yyyy HH:mm', { locale: id });
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validasi NIK Indonesia
 */
export function validateNIK(nik) {
  if (!nik) return { valid: false, error: 'NIK kosong' };
  
  const nikStr = String(nik).replace(/\D/g, '');
  
  if (nikStr.length !== 16) {
    return { valid: false, error: 'NIK harus 16 digit' };
  }
  
  const provinceCode = nikStr.substring(0, 2);
  if (!INDONESIA_PROVINCE_CODES[provinceCode]) {
    return { valid: false, error: `Kode provinsi ${provinceCode} tidak valid` };
  }
  
  // Validasi tanggal lahir (digit 7-12)
  let day = parseInt(nikStr.substring(6, 8));
  const month = parseInt(nikStr.substring(8, 10));
  const year = parseInt(nikStr.substring(10, 12));
  
  // Wanita: tanggal + 40
  if (day > 40) day -= 40;
  
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return { valid: false, error: 'Tanggal lahir dalam NIK tidak valid' };
  }
  
  return {
    valid: true,
    data: {
      province: INDONESIA_PROVINCE_CODES[provinceCode],
      provinceCode,
      birthDate: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/19${year}`,
      gender: parseInt(nikStr.substring(6, 8)) > 40 ? 'Perempuan' : 'Laki-laki'
    }
  };
}

/**
 * Validasi NPWP
 */
export function validateNPWP(npwp) {
  if (!npwp) return { valid: false, error: 'NPWP kosong' };
  
  const npwpStr = String(npwp).replace(/\D/g, '');
  
  // Format lama: 15 digit, format baru (2024): 16 digit
  if (npwpStr.length !== 15 && npwpStr.length !== 16) {
    return { valid: false, error: 'NPWP harus 15 atau 16 digit' };
  }
  
  // Validasi sederhana: digit pertama harus 0-9
  if (!/^[0-9]/.test(npwpStr)) {
    return { valid: false, error: 'Format NPWP tidak valid' };
  }
  
  return { valid: true };
}

/**
 * Validasi Email
 */
export function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email kosong' };
  return {
    valid: PATTERNS.EMAIL.test(String(email).trim()),
    error: PATTERNS.EMAIL.test(String(email).trim()) ? null : 'Format email tidak valid'
  };
}

/**
 * Validasi Phone Indonesia
 */
export function validatePhoneID(phone) {
  if (!phone) return { valid: false, error: 'Nomor telepon kosong' };
  
  const phoneStr = String(phone).replace(/[\s\-()]/g, '');
  
  return {
    valid: PATTERNS.PHONE_ID.test(phoneStr),
    error: PATTERNS.PHONE_ID.test(phoneStr) ? null : 'Format nomor telepon tidak valid'
  };
}

/**
 * Normalize phone number ke format +62
 */
export function normalizePhoneID(phone) {
  if (!phone) return null;
  
  let phoneStr = String(phone).replace(/[\s\-()]/g, '');
  
  if (phoneStr.startsWith('08')) {
    phoneStr = '+62' + phoneStr.substring(1);
  } else if (phoneStr.startsWith('62')) {
    phoneStr = '+' + phoneStr;
  } else if (!phoneStr.startsWith('+62')) {
    return null; // Invalid format
  }
  
  return phoneStr;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICS HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hitung statistics dari array numbers
 */
export function calculateStats(values) {
  const numbers = values
    .map(v => parseNumber(v))
    .filter(v => v !== null && !isNaN(v));
  
  if (numbers.length === 0) {
    return { count: 0, sum: 0, mean: 0, min: 0, max: 0, median: 0, stdDev: 0 };
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / numbers.length;
  
  // Median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
  
  // Standard Deviation
  const squaredDiffs = numbers.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return {
    count: numbers.length,
    sum: Math.round(sum * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100
  };
}

/**
 * Detect outliers menggunakan IQR method
 */
export function detectOutliers(values, threshold = 1.5) {
  const numbers = values
    .map((v, i) => ({ value: parseNumber(v), index: i }))
    .filter(v => v.value !== null);
  
  if (numbers.length < 4) return [];
  
  const sorted = [...numbers].sort((a, b) => a.value - b.value);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index].value;
  const q3 = sorted[q3Index].value;
  const iqr = q3 - q1;
  
  const lowerBound = q1 - (threshold * iqr);
  const upperBound = q3 + (threshold * iqr);
  
  return numbers
    .filter(v => v.value < lowerBound || v.value > upperBound)
    .map(v => ({
      index: v.index,
      value: v.value,
      reason: v.value < lowerBound ? 'Terlalu kecil' : 'Terlalu besar'
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if value is empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep/delay function
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Similarity score antara 2 string (untuk typo detection)
 */
export function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export default {
  // String
  normalizeString,
  toTitleCase,
  cleanSpecialChars,
  generateId,
  generateUUID,
  
  // Number & Currency
  parseNumber,
  formatNumber,
  formatRupiah,
  formatDollar,
  formatPercentage,
  calculatePPN,
  calculateWithPPN,
  
  // Date
  parseDate,
  formatDate,
  formatDateIndonesia,
  formatDateTime,
  
  // Validation
  validateNIK,
  validateNPWP,
  validateEmail,
  validatePhoneID,
  normalizePhoneID,
  
  // Statistics
  calculateStats,
  detectOutliers,
  
  // Utility
  isEmpty,
  deepClone,
  sleep,
  chunkArray,
  getFileExtension,
  formatFileSize,
  stringSimilarity
};
