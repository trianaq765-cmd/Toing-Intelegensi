// ═══════════════════════════════════════════════════════════════════════════
// FILEPARSER.JS - Parser untuk berbagai format file
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { BOT_CONFIG } from './constants.js';
import { getFileExtension, formatFileSize } from './helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PARSER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class FileParser {
  constructor() {
    this.supportedFormats = ['.xlsx', '.xls', '.csv', '.json'];
  }

  /**
   * Parse file dari path atau buffer
   * @param {string|Buffer} input - File path atau buffer
   * @param {string} filename - Nama file (untuk deteksi format)
   * @returns {Object} Parsed data dengan metadata
   */
  async parse(input, filename = '') {
    const ext = getFileExtension(filename).toLowerCase();
    
    if (!this.supportedFormats.includes(`.${ext}`)) {
      throw new Error(`Format .${ext} tidak didukung. Format yang didukung: ${this.supportedFormats.join(', ')}`);
    }

    let buffer;
    let fileStats = null;

    // Handle input type
    if (Buffer.isBuffer(input)) {
      buffer = input;
    } else if (typeof input === 'string') {
      if (!fs.existsSync(input)) {
        throw new Error(`File tidak ditemukan: ${input}`);
      }
      fileStats = fs.statSync(input);
      
      if (fileStats.size > BOT_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`File terlalu besar. Maksimum: ${formatFileSize(BOT_CONFIG.MAX_FILE_SIZE)}`);
      }
      
      buffer = fs.readFileSync(input);
    } else {
      throw new Error('Input harus berupa file path atau Buffer');
    }

    // Parse based on extension
    let result;
    switch (ext) {
      case 'xlsx':
      case 'xls':
        result = this.parseExcel(buffer);
        break;
      case 'csv':
        result = this.parseCSV(buffer);
        break;
      case 'json':
        result = this.parseJSON(buffer);
        break;
      default:
        throw new Error(`Parser untuk .${ext} belum diimplementasi`);
    }

    // Add metadata
    return {
      ...result,
      metadata: {
        filename,
        extension: ext,
        fileSize: buffer.length,
        fileSizeFormatted: formatFileSize(buffer.length),
        parsedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Parse Excel file (xlsx/xls)
   */
  parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: true,
      cellNF: true,
      cellStyles: true
    });

    const sheets = {};
    const sheetNames = workbook.SheetNames;

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get range
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: true,
        raw: false
      });

      // Extract headers (first row)
      const headers = jsonData[0] || [];
      
      // Extract data rows
      const rows = jsonData.slice(1).map((row, index) => {
        const rowObj = { _rowIndex: index + 2 }; // Excel row number (1-indexed + header)
        headers.forEach((header, colIndex) => {
          rowObj[header || `Column${colIndex + 1}`] = row[colIndex] ?? '';
        });
        return rowObj;
      });

      // Get raw data for analysis
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: true
      });

      sheets[sheetName] = {
        name: sheetName,
        headers,
        rows,
        rawData,
        totalRows: rows.length,
        totalColumns: headers.length,
        range: {
          startRow: range.s.r + 1,
          endRow: range.e.r + 1,
          startCol: range.s.c + 1,
          endCol: range.e.c + 1
        }
      };
    }

    return {
      type: 'excel',
      sheetNames,
      sheets,
      activeSheet: sheetNames[0],
      totalSheets: sheetNames.length
    };
  }

  /**
   * Parse CSV file
   */
  parseCSV(buffer) {
    const content = buffer.toString('utf-8');
    
    // Detect delimiter
    const delimiter = this.detectCSVDelimiter(content);
    
    // Parse CSV
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File CSV kosong');
    }

    // Parse headers
    const headers = this.parseCSVLine(lines[0], delimiter);
    
    // Parse rows
    const rows = lines.slice(1).map((line, index) => {
      const values = this.parseCSVLine(line, delimiter);
      const rowObj = { _rowIndex: index + 2 };
      headers.forEach((header, colIndex) => {
        rowObj[header || `Column${colIndex + 1}`] = values[colIndex] ?? '';
      });
      return rowObj;
    });

    const rawData = [headers, ...lines.slice(1).map(line => this.parseCSVLine(line, delimiter))];

    const sheetName = 'Sheet1';
    return {
      type: 'csv',
      sheetNames: [sheetName],
      sheets: {
        [sheetName]: {
          name: sheetName,
          headers,
          rows,
          rawData,
          totalRows: rows.length,
          totalColumns: headers.length,
          delimiter
        }
      },
      activeSheet: sheetName,
      totalSheets: 1
    };
  }

  /**
   * Parse JSON file
   */
  parseJSON(buffer) {
    const content = buffer.toString('utf-8');
    let data;
    
    try {
      data = JSON.parse(content);
    } catch (e) {
      throw new Error('Format JSON tidak valid: ' + e.message);
    }

    // Handle different JSON structures
    let rows = [];
    let headers = [];

    if (Array.isArray(data)) {
      // Array of objects
      if (data.length > 0 && typeof data[0] === 'object') {
        headers = [...new Set(data.flatMap(obj => Object.keys(obj)))];
        rows = data.map((obj, index) => ({
          _rowIndex: index + 2,
          ...headers.reduce((acc, h) => ({ ...acc, [h]: obj[h] ?? '' }), {})
        }));
      }
    } else if (typeof data === 'object') {
      // Single object or nested structure
      if (data.data && Array.isArray(data.data)) {
        // { data: [...] } structure
        return this.parseJSON(Buffer.from(JSON.stringify(data.data)));
      } else {
        // Convert single object to single row
        headers = Object.keys(data);
        rows = [{ _rowIndex: 2, ...data }];
      }
    }

    const rawData = [headers, ...rows.map(r => headers.map(h => r[h]))];

    const sheetName = 'Sheet1';
    return {
      type: 'json',
      sheetNames: [sheetName],
      sheets: {
        [sheetName]: {
          name: sheetName,
          headers,
          rows,
          rawData,
          totalRows: rows.length,
          totalColumns: headers.length
        }
      },
      activeSheet: sheetName,
      totalSheets: 1
    };
  }

  /**
   * Detect CSV delimiter
   */
  detectCSVDelimiter(content) {
    const firstLine = content.split(/\r?\n/)[0] || '';
    const delimiters = [',', ';', '\t', '|'];
    
    let maxCount = 0;
    let detected = ',';
    
    for (const d of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detected = d;
      }
    }
    
    return detected;
  }

  /**
   * Parse single CSV line (handle quoted values)
   */
  parseCSVLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Get column data (semua nilai dalam satu kolom)
   */
  getColumnData(sheet, columnName) {
    return sheet.rows.map(row => row[columnName]);
  }

  /**
   * Get column by index
   */
  getColumnByIndex(sheet, index) {
    const header = sheet.headers[index];
    return header ? this.getColumnData(sheet, header) : [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert parsed data back to Excel buffer
 */
export function toExcelBuffer(parsedData, options = {}) {
  const workbook = XLSX.utils.book_new();
  
  for (const sheetName of parsedData.sheetNames) {
    const sheet = parsedData.sheets[sheetName];
    
    // Prepare data (remove _rowIndex)
    const data = [
      sheet.headers,
      ...sheet.rows.map(row => 
        sheet.headers.map(h => row[h] ?? '')
      )
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Apply column widths
    if (options.autoWidth !== false) {
      const colWidths = sheet.headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...sheet.rows.map(r => String(r[h] || '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet['!cols'] = colWidths;
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  
  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: options.bookType || 'xlsx'
  });
}

/**
 * Convert parsed data to CSV string
 */
export function toCSVString(parsedData, sheetName = null, delimiter = ',') {
  const sheet = parsedData.sheets[sheetName || parsedData.activeSheet];
  
  const escapeCSV = (val) => {
    const str = String(val ?? '');
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const lines = [
    sheet.headers.map(escapeCSV).join(delimiter),
    ...sheet.rows.map(row => 
      sheet.headers.map(h => escapeCSV(row[h])).join(delimiter)
    )
  ];
  
  return lines.join('\n');
}

/**
 * Convert parsed data to JSON
 */
export function toJSONString(parsedData, sheetName = null, pretty = true) {
  const sheet = parsedData.sheets[sheetName || parsedData.activeSheet];
  
  // Remove _rowIndex from output
  const cleanRows = sheet.rows.map(row => {
    const { _rowIndex, ...rest } = row;
    return rest;
  });
  
  return pretty ? JSON.stringify(cleanRows, null, 2) : JSON.stringify(cleanRows);
}

// Create singleton instance
export const fileParser = new FileParser();

export default {
  FileParser,
  fileParser,
  toExcelBuffer,
  toCSVString,
  toJSONString
};
