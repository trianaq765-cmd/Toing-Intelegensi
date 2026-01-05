// ═══════════════════════════════════════════════════════════════════════════
// CLEANER.JS - Data Cleaning Engine
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import {
  ISSUE_TYPES,
  DATA_TYPES,
  TAX_RATES
} from '../utils/constants.js';

import {
  normalizeString,
  toTitleCase,
  parseNumber,
  parseDate,
  formatDate,
  formatRupiah,
  normalizePhoneID,
  isEmpty,
  deepClone,
  calculatePPN
} from '../utils/helpers.js';

import { DataAnalyzer } from './analyzer.js';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLEANER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class DataCleaner {
  constructor(options = {}) {
    this.options = {
      removeDuplicates: options.removeDuplicates ?? true,
      removeEmptyRows: options.removeEmptyRows ?? true,
      trimWhitespace: options.trimWhitespace ?? true,
      normalizeCase: options.normalizeCase ?? false,
      caseType: options.caseType ?? 'title', // 'upper', 'lower', 'title'
      standardizeDates: options.standardizeDates ?? true,
      dateFormat: options.dateFormat ?? 'dd/MM/yyyy',
      standardizePhones: options.standardizePhones ?? true,
      phoneFormat: options.phoneFormat ?? '+62',
      fixCalculations: options.fixCalculations ?? true,
      ppnRate: options.ppnRate ?? TAX_RATES.PPN,
      fixTypos: options.fixTypos ?? false, // Opt-in karena bisa salah
      ...options
    };
    
    this.cleaningLog = [];
    this.analyzer = new DataAnalyzer();
  }

  /**
   * 🧹 MAIN CLEANING METHOD
   */
  async clean(parsedData, sheetName = null, customOptions = {}) {
    const options = { ...this.options, ...customOptions };
    const startTime = Date.now();
    this.cleaningLog = [];

    // Get the sheet to clean
    const targetSheet = sheetName || parsedData.activeSheet;
    const sheet = parsedData.sheets[targetSheet];
    
    if (!sheet || sheet.rows.length === 0) {
      throw new Error('Sheet kosong atau tidak ditemukan');
    }

    // Clone data untuk cleaning
    let cleanedRows = deepClone(sheet.rows);
    const originalCount = cleanedRows.length;
    
    // First, analyze the data
    const analysis = await this.analyzer.analyze(parsedData, targetSheet);
    const columnAnalysis = analysis.columnAnalysis;

    // 1️⃣ Remove empty rows
    if (options.removeEmptyRows) {
      cleanedRows = this.removeEmptyRows(cleanedRows, sheet.headers);
    }

    // 2️⃣ Remove duplicates
    if (options.removeDuplicates) {
      cleanedRows = this.removeDuplicates(cleanedRows, sheet.headers);
    }

    // 3️⃣ Trim whitespace
    if (options.trimWhitespace) {
      cleanedRows = this.trimWhitespace(cleanedRows, sheet.headers);
    }

    // 4️⃣ Normalize case
    if (options.normalizeCase) {
      cleanedRows = this.normalizeCase(cleanedRows, sheet.headers, columnAnalysis, options.caseType);
    }

    // 5️⃣ Standardize dates
    if (options.standardizeDates) {
      cleanedRows = this.standardizeDates(cleanedRows, sheet.headers, columnAnalysis, options.dateFormat);
    }

    // 6️⃣ Standardize phone numbers
    if (options.standardizePhones) {
      cleanedRows = this.standardizePhones(cleanedRows, sheet.headers, columnAnalysis);
    }

    // 7️⃣ Fix calculations
    if (options.fixCalculations) {
      cleanedRows = this.fixCalculations(cleanedRows, sheet.headers, columnAnalysis);
    }

    // 8️⃣ Fix typos (if enabled)
    if (options.fixTypos) {
      cleanedRows = this.fixTypos(cleanedRows, analysis.issues);
    }

    const endTime = Date.now();
    const finalCount = cleanedRows.length;

    // Update sheet with cleaned data
    const cleanedSheet = {
      ...sheet,
      rows: cleanedRows,
      totalRows: cleanedRows.length
    };

    // Create cleaned parsed data
    const cleanedData = {
      ...parsedData,
      sheets: {
        ...parsedData.sheets,
        [targetSheet]: cleanedSheet
      }
    };

    return {
      data: cleanedData,
      summary: {
        originalRows: originalCount,
        cleanedRows: finalCount,
        rowsRemoved: originalCount - finalCount,
        cleaningTime: `${endTime - startTime}ms`,
        operationsPerformed: this.cleaningLog.length
      },
      log: this.cleaningLog,
      metadata: {
        cleanedAt: new Date().toISOString(),
        options: options
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLEANING OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Remove empty rows
   */
  removeEmptyRows(rows, headers) {
    const initialCount = rows.length;
    
    const filtered = rows.filter(row => {
      return headers.some(h => {
        const val = row[h];
        return val !== null && val !== undefined && String(val).trim() !== '';
      });
    });
    
    const removedCount = initialCount - filtered.length;
    if (removedCount > 0) {
      this.log('remove_empty_rows', `Menghapus ${removedCount} baris kosong`, removedCount);
    }
    
    return filtered;
  }

  /**
   * Remove duplicate rows
   */
  removeDuplicates(rows, headers) {
    const initialCount = rows.length;
    const seen = new Set();
    
    const filtered = rows.filter(row => {
      const signature = headers
        .map(h => String(row[h] || '').trim().toLowerCase())
        .join('|');
      
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
    
    const removedCount = initialCount - filtered.length;
    if (removedCount > 0) {
      this.log('remove_duplicates', `Menghapus ${removedCount} baris duplikat`, removedCount);
    }
    
    return filtered;
  }

  /**
   * Trim whitespace from all cells
   */
  trimWhitespace(rows, headers) {
    let fixCount = 0;
    
    const cleaned = rows.map(row => {
      const newRow = { ...row };
      
      for (const header of headers) {
        if (typeof newRow[header] === 'string') {
          const original = newRow[header];
          const trimmed = normalizeString(original);
          
          if (original !== trimmed) {
            newRow[header] = trimmed;
            fixCount++;
          }
        }
      }
      
      return newRow;
    });
    
    if (fixCount > 0) {
      this.log('trim_whitespace', `Memperbaiki ${fixCount} sel dengan spasi berlebih`, fixCount);
    }
    
    return cleaned;
  }

  /**
   * Normalize text case
   */
  normalizeCase(rows, headers, columnAnalysis, caseType = 'title') {
    let fixCount = 0;
    
    // Only apply to string columns
    const stringColumns = Object.entries(columnAnalysis)
      .filter(([, v]) => v.detectedType === DATA_TYPES.STRING)
      .map(([k]) => k);
    
    const cleaned = rows.map(row => {
      const newRow = { ...row };
      
      for (const header of stringColumns) {
        if (typeof newRow[header] === 'string' && newRow[header].trim()) {
          const original = newRow[header];
          let converted;
          
          switch (caseType) {
            case 'upper':
              converted = original.toUpperCase();
              break;
            case 'lower':
              converted = original.toLowerCase();
              break;
            case 'title':
            default:
              converted = toTitleCase(original);
              break;
          }
          
          if (original !== converted) {
            newRow[header] = converted;
            fixCount++;
          }
        }
      }
      
      return newRow;
    });
    
    if (fixCount > 0) {
      this.log('normalize_case', `Mengubah ${fixCount} sel ke format ${caseType} case`, fixCount);
    }
    
    return cleaned;
  }

  /**
   * Standardize date formats
   */
  standardizeDates(rows, headers, columnAnalysis, dateFormat = 'dd/MM/yyyy') {
    let fixCount = 0;
    
    // Find date columns
    const dateColumns = Object.entries(columnAnalysis)
      .filter(([, v]) => v.detectedType === DATA_TYPES.DATE || v.detectedType === DATA_TYPES.DATETIME)
      .map(([k]) => k);
    
    if (dateColumns.length === 0) return rows;
    
    const cleaned = rows.map(row => {
      const newRow = { ...row };
      
      for (const header of dateColumns) {
        const value = newRow[header];
        if (!isEmpty(value)) {
          const parsed = parseDate(value);
          if (parsed) {
            const formatted = formatDate(parsed, dateFormat);
            if (String(value) !== formatted) {
              newRow[header] = formatted;
              fixCount++;
            }
          }
        }
      }
      
      return newRow;
    });
    
    if (fixCount > 0) {
      this.log('standardize_dates', `Menyeragamkan ${fixCount} format tanggal`, fixCount);
    }
    
    return cleaned;
  }

  /**
   * Standardize phone numbers to +62 format
   */
  standardizePhones(rows, headers, columnAnalysis) {
    let fixCount = 0;
    
    // Find phone columns
    const phoneColumns = Object.entries(columnAnalysis)
      .filter(([, v]) => v.detectedType === DATA_TYPES.PHONE)
      .map(([k]) => k);
    
    if (phoneColumns.length === 0) return rows;
    
    const cleaned = rows.map(row => {
      const newRow = { ...row };
      
      for (const header of phoneColumns) {
        const value = newRow[header];
        if (!isEmpty(value)) {
          const normalized = normalizePhoneID(value);
          if (normalized && normalized !== String(value)) {
            newRow[header] = normalized;
            fixCount++;
          }
        }
      }
      
      return newRow;
    });
    
    if (fixCount > 0) {
      this.log('standardize_phones', `Menyeragamkan ${fixCount} nomor telepon ke format +62`, fixCount);
    }
    
    return cleaned;
  }

  /**
   * Fix calculation errors (subtotal, PPN, total)
   */
  fixCalculations(rows, headers, columnAnalysis) {
    let fixCount = 0;
    
    // Find related columns
    const qtyColumn = headers.find(h => h.toLowerCase().match(/(qty|jumlah|kuantitas|quantity)/));
    const priceColumn = headers.find(h => h.toLowerCase().match(/(harga|price|unit.?price)/));
    const subtotalColumn = headers.find(h => h.toLowerCase().match(/(subtotal|sub.?total)/));
    const ppnColumn = headers.find(h => h.toLowerCase().match(/(ppn|pajak|tax|vat)/));
    const totalColumn = headers.find(h => h.toLowerCase().match(/^total$/i) || 
                                           h.toLowerCase().match(/(grand.?total|total.?harga|total.?bayar)/));
    
    const cleaned = rows.map(row => {
      const newRow = { ...row };
      
      // Fix subtotal = qty × price
      if (qtyColumn && priceColumn && subtotalColumn) {
        const qty = parseNumber(newRow[qtyColumn]);
        const price = parseNumber(newRow[priceColumn]);
        const currentSubtotal = parseNumber(newRow[subtotalColumn]);
        
        if (qty !== null && price !== null) {
          const expectedSubtotal = qty * price;
          if (currentSubtotal === null || Math.abs(expectedSubtotal - currentSubtotal) > 1) {
            newRow[subtotalColumn] = expectedSubtotal;
            fixCount++;
          }
        }
      }
      
      // Fix PPN = base × 11%
      if (ppnColumn) {
        const base = parseNumber(newRow[subtotalColumn] || newRow[priceColumn]);
        const currentPPN = parseNumber(newRow[ppnColumn]);
        
        if (base !== null && base > 0) {
          const expectedPPN = calculatePPN(base, this.options.ppnRate);
          if (currentPPN === null || Math.abs(expectedPPN - currentPPN) > 100) {
            newRow[ppnColumn] = expectedPPN;
            fixCount++;
          }
        }
      }
      
      // Fix total = subtotal + ppn
      if (totalColumn && (subtotalColumn || priceColumn)) {
        const subtotal = parseNumber(newRow[subtotalColumn] || newRow[priceColumn]);
        const ppn = ppnColumn ? parseNumber(newRow[ppnColumn]) : 0;
        const currentTotal = parseNumber(newRow[totalColumn]);
        
        if (subtotal !== null) {
          const expectedTotal = subtotal + (ppn || 0);
          if (currentTotal === null || Math.abs(expectedTotal - currentTotal) > 1) {
            newRow[totalColumn] = expectedTotal;
            fixCount++;
          }
        }
      }
      
      return newRow;
    });
    
    if (fixCount > 0) {
      this.log('fix_calculations', `Memperbaiki ${fixCount} perhitungan (subtotal/PPN/total)`, fixCount);
    }
    
    return cleaned;
  }

  /**
   * Fix detected typos
   */
  fixTypos(rows, issues) {
    const typoIssues = issues.filter(i => i.type === ISSUE_TYPES.TYPO.code && i.suggestion);
    
    if (typoIssues.length === 0) return rows;
    
    let fixCount = 0;
    
    // Create a map of fixes
    const fixMap = new Map();
    for (const issue of typoIssues) {
      const key = `${issue.row}:${issue.column}`;
      if (!fixMap.has(key)) {
        fixMap.set(key, issue.suggestion);
      }
    }
    
    const cleaned = rows.map((row, idx) => {
      const rowNum = idx + 2;
      const newRow = { ...row };
      
      for (const [key, suggestion] of fixMap) {
        const [issueRow, column] = key.split(':');
        if (parseInt(issueRow) === rowNum) {
          newRow[column] = suggestion;
          fixCount++;
        }
      }
      
      return newRow;
    });
    
    if (fixCount > 0) {
      this.log('fix_typos', `Memperbaiki ${fixCount} kemungkinan typo`, fixCount);
    }
    
    return cleaned;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIALIZED CLEANING METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Clean specific column
   */
  cleanColumn(rows, columnName, cleaningFunction) {
    return rows.map(row => ({
      ...row,
      [columnName]: cleaningFunction(row[columnName])
    }));
  }

  /**
   * Remove specific columns
   */
  removeColumns(rows, columnsToRemove) {
    return rows.map(row => {
      const newRow = { ...row };
      for (const col of columnsToRemove) {
        delete newRow[col];
      }
      return newRow;
    });
  }

  /**
   * Rename columns
   */
  renameColumns(rows, renameMap) {
    return rows.map(row => {
      const newRow = {};
      for (const [key, value] of Object.entries(row)) {
        const newKey = renameMap[key] || key;
        newRow[newKey] = value;
      }
      return newRow;
    });
  }

  /**
   * Filter rows based on condition
   */
  filterRows(rows, filterFunction) {
    return rows.filter(filterFunction);
  }

  /**
   * Sort rows
   */
  sortRows(rows, sortColumn, ascending = true) {
    return [...rows].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      
      // Handle numeric
      const numA = parseNumber(valA);
      const numB = parseNumber(valB);
      
      if (numA !== null && numB !== null) {
        return ascending ? numA - numB : numB - numA;
      }
      
      // Handle string
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      
      if (ascending) {
        return strA.localeCompare(strB);
      }
      return strB.localeCompare(strA);
    });
  }

  /**
   * Fill empty cells with default value
   */
  fillEmpty(rows, columnName, defaultValue) {
    return rows.map(row => ({
      ...row,
      [columnName]: isEmpty(row[columnName]) ? defaultValue : row[columnName]
    }));
  }

  /**
   * Replace values in column
   */
  replaceValues(rows, columnName, searchValue, replaceValue) {
    return rows.map(row => ({
      ...row,
      [columnName]: row[columnName] === searchValue ? replaceValue : row[columnName]
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // QUICK CLEAN PRESETS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Quick clean with minimal options
   */
  static async quickClean(parsedData, sheetName = null) {
    const cleaner = new DataCleaner({
      removeDuplicates: true,
      removeEmptyRows: true,
      trimWhitespace: true,
      normalizeCase: false,
      standardizeDates: false,
      standardizePhones: false,
      fixCalculations: false,
      fixTypos: false
    });
    
    return cleaner.clean(parsedData, sheetName);
  }

  /**
   * Full clean with all options
   */
  static async fullClean(parsedData, sheetName = null) {
    const cleaner = new DataCleaner({
      removeDuplicates: true,
      removeEmptyRows: true,
      trimWhitespace: true,
      normalizeCase: true,
      caseType: 'title',
      standardizeDates: true,
      standardizePhones: true,
      fixCalculations: true,
      fixTypos: true
    });
    
    return cleaner.clean(parsedData, sheetName);
  }

  /**
   * Financial clean (untuk data keuangan)
   */
  static async financialClean(parsedData, sheetName = null) {
    const cleaner = new DataCleaner({
      removeDuplicates: true,
      removeEmptyRows: true,
      trimWhitespace: true,
      normalizeCase: false,
      standardizeDates: true,
      dateFormat: 'dd/MM/yyyy',
      standardizePhones: false,
      fixCalculations: true,
      ppnRate: TAX_RATES.PPN,
      fixTypos: false
    });
    
    return cleaner.clean(parsedData, sheetName);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGGING
  // ─────────────────────────────────────────────────────────────────────────────

  log(operation, message, affectedCount) {
    this.cleaningLog.push({
      operation,
      message,
      affectedCount,
      timestamp: new Date().toISOString()
    });
  }

  getLog() {
    return this.cleaningLog;
  }

  clearLog() {
    this.cleaningLog = [];
  }
}

// Create singleton
export const dataCleaner = new DataCleaner();

export default {
  DataCleaner,
  dataCleaner
};
