// ═══════════════════════════════════════════════════════════════════════════
// TEXTTOEXCEL.JS - Convert Text/Raw Data to Structured Excel
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { DATA_TYPES, NLP_KEYWORDS } from '../../utils/constants.js';
import { 
  normalizeString, 
  parseNumber, 
  parseDate,
  isEmpty,
  generateId 
} from '../../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEXT TO EXCEL CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class TextToExcel {
  constructor(options = {}) {
    this.options = {
      autoDetectFormat: options.autoDetectFormat ?? true,
      autoDetectHeaders: options.autoDetectHeaders ?? true,
      trimValues: options.trimValues ?? true,
      skipEmptyLines: options.skipEmptyLines ?? true,
      defaultDelimiter: options.defaultDelimiter || ',',
      ...options
    };
  }

  /**
   * 🔄 MAIN CONVERT METHOD
   * Mengubah berbagai format teks menjadi struktur data Excel
   */
  async convert(text, options = {}) {
    const opts = { ...this.options, ...options };
    
    if (!text || typeof text !== 'string') {
      throw new Error('Input harus berupa string teks');
    }

    const cleanText = text.trim();
    
    if (!cleanText) {
      throw new Error('Teks input kosong');
    }

    // Detect format
    const format = opts.format || this.detectFormat(cleanText);
    
    let result;
    switch (format) {
      case 'csv':
        result = this.parseCSVText(cleanText, opts);
        break;
      case 'tsv':
        result = this.parseTSVText(cleanText, opts);
        break;
      case 'json':
        result = this.parseJSONText(cleanText, opts);
        break;
      case 'keyvalue':
        result = this.parseKeyValueText(cleanText, opts);
        break;
      case 'table':
        result = this.parseTableText(cleanText, opts);
        break;
      case 'list':
        result = this.parseListText(cleanText, opts);
        break;
      case 'markdown':
        result = this.parseMarkdownTable(cleanText, opts);
        break;
      default:
        // Auto-detect and try multiple parsers
        result = this.smartParse(cleanText, opts);
    }

    return this.buildParsedData(result, opts);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FORMAT DETECTION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Detect text format automatically
   */
  detectFormat(text) {
    const lines = text.split('\n').filter(l => l.trim());
    
    // Check JSON
    if ((text.startsWith('[') && text.endsWith(']')) ||
        (text.startsWith('{') && text.endsWith('}'))) {
      try {
        JSON.parse(text);
        return 'json';
      } catch {}
    }
    
    // Check Markdown table
    if (lines.some(l => l.includes('|') && l.includes('---'))) {
      return 'markdown';
    }
    
    // Check if it's a table with | separator
    if (lines.every(l => l.includes('|'))) {
      return 'table';
    }
    
    // Check TSV (tab-separated)
    if (lines.length > 0 && lines[0].includes('\t')) {
      return 'tsv';
    }
    
    // Check CSV
    if (lines.length > 0) {
      const commaCount = (lines[0].match(/,/g) || []).length;
      const semicolonCount = (lines[0].match(/;/g) || []).length;
      
      if (commaCount >= 1 || semicolonCount >= 1) {
        return 'csv';
      }
    }
    
    // Check key-value pairs
    if (lines.some(l => l.includes(':') || l.includes('='))) {
      const kvLines = lines.filter(l => l.includes(':') || l.includes('='));
      if (kvLines.length >= lines.length * 0.5) {
        return 'keyvalue';
      }
    }
    
    // Check numbered/bulleted list
    if (lines.some(l => /^[\d\-\*\•]\s*\.?\s+/.test(l.trim()))) {
      return 'list';
    }
    
    return 'auto';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PARSERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Parse CSV text
   */
  parseCSVText(text, opts) {
    const lines = text.split('\n').filter(l => opts.skipEmptyLines ? l.trim() : true);
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Detect delimiter
    const delimiter = this.detectDelimiter(lines[0]);
    
    // Parse all lines
    const allRows = lines.map(line => this.parseCSVLine(line, delimiter));
    
    // Extract headers
    let headers;
    let dataRows;
    
    if (opts.autoDetectHeaders && this.looksLikeHeader(allRows[0], allRows.slice(1))) {
      headers = allRows[0].map((h, i) => normalizeString(h) || `Column${i + 1}`);
      dataRows = allRows.slice(1);
    } else {
      headers = allRows[0].map((_, i) => `Column${i + 1}`);
      dataRows = allRows;
    }

    // Convert to row objects
    const rows = dataRows.map((row, idx) => {
      const obj = { _rowIndex: idx + 2 };
      headers.forEach((h, i) => {
        obj[h] = opts.trimValues ? normalizeString(row[i]) : (row[i] ?? '');
      });
      return obj;
    });

    return { headers, rows };
  }

  /**
   * Parse TSV text (tab-separated)
   */
  parseTSVText(text, opts) {
    // Convert tabs to our delimiter and use CSV parser
    const csvText = text.replace(/\t/g, '|||TAB|||');
    const result = this.parseCSVText(csvText, { ...opts });
    
    // Restore any actual commas in data
    result.rows = result.rows.map(row => {
      const newRow = {};
      for (const [key, value] of Object.entries(row)) {
        newRow[key] = typeof value === 'string' 
          ? value.replace(/\|\|\|TAB\|\|\|/g, '\t') 
          : value;
      }
      return newRow;
    });
    
    return result;
  }

  /**
   * Parse JSON text
   */
  parseJSONText(text, opts) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Format JSON tidak valid: ' + e.message);
    }

    let rows = [];
    let headers = [];

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { headers: [], rows: [] };
      }
      
      // Get all unique keys as headers
      headers = [...new Set(data.flatMap(obj => 
        typeof obj === 'object' && obj !== null ? Object.keys(obj) : []
      ))];
      
      rows = data.map((item, idx) => {
        if (typeof item !== 'object' || item === null) {
          return { _rowIndex: idx + 2, Value: item };
        }
        return {
          _rowIndex: idx + 2,
          ...headers.reduce((acc, h) => ({ ...acc, [h]: item[h] ?? '' }), {})
        };
      });
      
      if (headers.length === 0) {
        headers = ['Value'];
      }
    } else if (typeof data === 'object' && data !== null) {
      // Single object - convert to single row
      headers = Object.keys(data);
      rows = [{ _rowIndex: 2, ...data }];
    } else {
      // Primitive value
      headers = ['Value'];
      rows = [{ _rowIndex: 2, Value: data }];
    }

    return { headers, rows };
  }

  /**
   * Parse Key-Value text
   * Format: key: value atau key = value
   */
  parseKeyValueText(text, opts) {
    const lines = text.split('\n').filter(l => l.trim());
    
    // Detect if it's multiple records or single record
    const separatorLines = lines.filter(l => /^[\-=]{3,}$/.test(l.trim()));
    
    if (separatorLines.length > 0) {
      // Multiple records separated by ---
      return this.parseMultipleKeyValueRecords(text, opts);
    }
    
    // Check if same keys repeat (multiple records inline)
    const allKeys = [];
    for (const line of lines) {
      const match = line.match(/^([^:=]+)[:=]\s*(.*)$/);
      if (match) {
        allKeys.push(normalizeString(match[1]));
      }
    }
    
    const uniqueKeys = [...new Set(allKeys)];
    if (allKeys.length > uniqueKeys.length) {
      // Keys repeat - multiple records
      return this.parseRepeatingKeyValueRecords(lines, uniqueKeys, opts);
    }
    
    // Single record - transpose to columns
    const headers = [];
    const values = [];
    
    for (const line of lines) {
      const match = line.match(/^([^:=]+)[:=]\s*(.*)$/);
      if (match) {
        headers.push(normalizeString(match[1]));
        values.push(opts.trimValues ? normalizeString(match[2]) : match[2]);
      }
    }
    
    if (headers.length === 0) {
      return { headers: ['Value'], rows: lines.map((l, i) => ({ _rowIndex: i + 2, Value: l })) };
    }
    
    const row = { _rowIndex: 2 };
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    
    return { headers, rows: [row] };
  }

  /**
   * Parse multiple key-value records separated by ---
   */
  parseMultipleKeyValueRecords(text, opts) {
    const records = text.split(/\n[\-=]{3,}\n/).filter(r => r.trim());
    const allKeys = new Set();
    const rows = [];
    
    for (const record of records) {
      const row = { _rowIndex: rows.length + 2 };
      const lines = record.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        const match = line.match(/^([^:=]+)[:=]\s*(.*)$/);
        if (match) {
          const key = normalizeString(match[1]);
          allKeys.add(key);
          row[key] = opts.trimValues ? normalizeString(match[2]) : match[2];
        }
      }
      
      if (Object.keys(row).length > 1) {
        rows.push(row);
      }
    }
    
    return { headers: [...allKeys], rows };
  }

  /**
   * Parse repeating key-value records
   */
  parseRepeatingKeyValueRecords(lines, uniqueKeys, opts) {
    const rows = [];
    let currentRow = { _rowIndex: 2 };
    let keysInCurrentRow = new Set();
    
    for (const line of lines) {
      const match = line.match(/^([^:=]+)[:=]\s*(.*)$/);
      if (match) {
        const key = normalizeString(match[1]);
        const value = opts.trimValues ? normalizeString(match[2]) : match[2];
        
        if (keysInCurrentRow.has(key)) {
          // Start new row
          rows.push(currentRow);
          currentRow = { _rowIndex: rows.length + 2 };
          keysInCurrentRow = new Set();
        }
        
        currentRow[key] = value;
        keysInCurrentRow.add(key);
      }
    }
    
    // Add last row
    if (Object.keys(currentRow).length > 1) {
      rows.push(currentRow);
    }
    
    return { headers: uniqueKeys, rows };
  }

  /**
   * Parse table text with | separator
   */
  parseTableText(text, opts) {
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.match(/^[\-\|]+$/));
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    
    const parseRow = (line) => {
      return line
        .split('|')
        .map(cell => cell.trim())
        .filter((_, i, arr) => i > 0 || arr[0] !== ''); // Handle leading |
    };
    
    const allRows = lines.map(parseRow);
    
    // First row is headers
    const headers = allRows[0].map((h, i) => normalizeString(h) || `Column${i + 1}`);
    
    const rows = allRows.slice(1).map((row, idx) => {
      const obj = { _rowIndex: idx + 2 };
      headers.forEach((h, i) => {
        obj[h] = opts.trimValues ? normalizeString(row[i]) : (row[i] ?? '');
      });
      return obj;
    });
    
    return { headers, rows };
  }

  /**
   * Parse Markdown table
   */
  parseMarkdownTable(text, opts) {
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.match(/^\|?[\s\-:]+\|?$/)); // Skip separator lines
    
    return this.parseTableText(lines.join('\n'), opts);
  }

  /**
   * Parse list text (numbered or bulleted)
   */
  parseListText(text, opts) {
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l);
    
    const items = lines.map(line => {
      // Remove bullet/number prefix
      return line.replace(/^[\d\-\*\•]+\.?\s*/, '').trim();
    });
    
    const rows = items.map((item, idx) => ({
      _rowIndex: idx + 2,
      No: idx + 1,
      Item: item
    }));
    
    return { headers: ['No', 'Item'], rows };
  }

  /**
   * Smart parse - try multiple formats
   */
  smartParse(text, opts) {
    const lines = text.split('\n').filter(l => l.trim());
    
    // Try to detect structure
    const firstLine = lines[0] || '';
    
    // Check for common patterns
    const hasCommas = firstLine.includes(',');
    const hasTabs = firstLine.includes('\t');
    const hasColons = lines.some(l => l.includes(':'));
    const hasPipes = firstLine.includes('|');
    
    if (hasPipes) {
      return this.parseTableText(text, opts);
    }
    
    if (hasTabs) {
      return this.parseTSVText(text, opts);
    }
    
    if (hasCommas) {
      return this.parseCSVText(text, opts);
    }
    
    if (hasColons) {
      return this.parseKeyValueText(text, opts);
    }
    
    // Fallback: treat as list
    return this.parseListText(text, opts);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Detect CSV delimiter
   */
  detectDelimiter(line) {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let detected = ',';
    
    for (const d of delimiters) {
      const count = (line.match(new RegExp(`\\${d}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detected = d;
      }
    }
    
    return detected;
  }

  /**
   * Parse CSV line handling quotes
   */
  parseCSVLine(line, delimiter) {
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
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Check if first row looks like headers
   */
  looksLikeHeader(firstRow, dataRows) {
    if (!firstRow || firstRow.length === 0) return false;
    if (dataRows.length === 0) return true;
    
    // Headers usually:
    // 1. Don't contain numbers (unless it's like "ID", "No")
    // 2. Are shorter than data
    // 3. Don't have same pattern as data
    
    const firstRowAllText = firstRow.every(cell => {
      const val = String(cell).trim();
      return val && isNaN(parseNumber(val));
    });
    
    const dataHasNumbers = dataRows.some(row => 
      row.some(cell => !isNaN(parseNumber(String(cell).trim())))
    );
    
    return firstRowAllText || (firstRowAllText && dataHasNumbers);
  }

  /**
   * Build final parsed data structure
   */
  buildParsedData(result, opts) {
    const sheetName = opts.sheetName || 'Sheet1';
    
    return {
      type: 'text',
      sheetNames: [sheetName],
      sheets: {
        [sheetName]: {
          name: sheetName,
          headers: result.headers,
          rows: result.rows,
          rawData: [result.headers, ...result.rows.map(r => result.headers.map(h => r[h]))],
          totalRows: result.rows.length,
          totalColumns: result.headers.length
        }
      },
      activeSheet: sheetName,
      totalSheets: 1,
      metadata: {
        source: 'text',
        convertedAt: new Date().toISOString()
      }
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK CONVERT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quick convert text to parsed data
 */
export async function textToExcel(text, options = {}) {
  const converter = new TextToExcel(options);
  return converter.convert(text, options);
}

/**
 * Convert clipboard/paste data
 */
export async function pasteToExcel(pastedText, options = {}) {
  return textToExcel(pastedText, {
    autoDetectFormat: true,
    autoDetectHeaders: true,
    ...options
  });
}

// Create singleton
export const textToExcelConverter = new TextToExcel();

export default {
  TextToExcel,
  textToExcel,
  pasteToExcel,
  textToExcelConverter
};
