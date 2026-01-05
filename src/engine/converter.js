// ═══════════════════════════════════════════════════════════════════════════
// CONVERTER.JS - Multi-Format Conversion Engine
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import { EXPORT_FORMATS } from '../utils/constants.js';
import { 
  isEmpty, 
  formatRupiah, 
  formatDate, 
  parseNumber,
  parseDate 
} from '../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONVERTER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class DataConverter {
  constructor(options = {}) {
    this.options = {
      includeHeaders: options.includeHeaders ?? true,
      prettyPrint: options.prettyPrint ?? true,
      encoding: options.encoding || 'utf-8',
      csvDelimiter: options.csvDelimiter || ',',
      sqlTableName: options.sqlTableName || 'data_table',
      sqlDialect: options.sqlDialect || 'mysql', // mysql, postgresql, sqlite
      htmlStyles: options.htmlStyles ?? true,
      xmlRootName: options.xmlRootName || 'data',
      xmlRowName: options.xmlRowName || 'row',
      ...options
    };
  }

  /**
   * 🔄 MAIN CONVERT METHOD
   */
  async convert(parsedData, targetFormat, sheetName = null) {
    const format = targetFormat.toLowerCase().replace('.', '');
    const sheet = parsedData.sheets[sheetName || parsedData.activeSheet];
    
    if (!sheet) {
      throw new Error('Sheet tidak ditemukan');
    }

    switch (format) {
      case 'csv':
        return this.toCSV(sheet);
      case 'json':
        return this.toJSON(sheet);
      case 'html':
        return this.toHTML(sheet, parsedData.metadata?.filename);
      case 'md':
      case 'markdown':
        return this.toMarkdown(sheet);
      case 'sql':
        return this.toSQL(sheet);
      case 'xml':
        return this.toXML(sheet);
      case 'xlsx':
      case 'excel':
        return this.toExcel(parsedData, sheetName);
      case 'txt':
        return this.toText(sheet);
      default:
        throw new Error(`Format "${format}" tidak didukung. Format tersedia: csv, json, html, md, sql, xml, xlsx, txt`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CSV CONVERSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to CSV
   */
  toCSV(sheet) {
    const delimiter = this.options.csvDelimiter;
    const lines = [];
    
    // Escape CSV value
    const escapeCSV = (val) => {
      if (isEmpty(val)) return '';
      const str = String(val);
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Add headers
    if (this.options.includeHeaders) {
      lines.push(sheet.headers.map(escapeCSV).join(delimiter));
    }
    
    // Add rows
    for (const row of sheet.rows) {
      const values = sheet.headers.map(h => escapeCSV(row[h]));
      lines.push(values.join(delimiter));
    }
    
    const content = lines.join('\n');
    
    return {
      content,
      mimeType: EXPORT_FORMATS.CSV.mime,
      extension: '.csv',
      encoding: this.options.encoding
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // JSON CONVERSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to JSON
   */
  toJSON(sheet) {
    // Remove internal properties
    const cleanRows = sheet.rows.map(row => {
      const { _rowIndex, ...rest } = row;
      return rest;
    });
    
    const content = this.options.prettyPrint
      ? JSON.stringify(cleanRows, null, 2)
      : JSON.stringify(cleanRows);
    
    return {
      content,
      mimeType: EXPORT_FORMATS.JSON.mime,
      extension: '.json',
      encoding: this.options.encoding
    };
  }

  /**
   * Convert to JSON with metadata
   */
  toJSONWithMeta(sheet, metadata = {}) {
    const cleanRows = sheet.rows.map(row => {
      const { _rowIndex, ...rest } = row;
      return rest;
    });
    
    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generator: 'Excel Intelligence Bot',
        totalRows: cleanRows.length,
        columns: sheet.headers,
        ...metadata
      },
      data: cleanRows
    };
    
    const content = this.options.prettyPrint
      ? JSON.stringify(output, null, 2)
      : JSON.stringify(output);
    
    return {
      content,
      mimeType: EXPORT_FORMATS.JSON.mime,
      extension: '.json',
      encoding: this.options.encoding
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HTML CONVERSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to HTML table
   */
  toHTML(sheet, title = 'Data Export') {
    const escapeHTML = (str) => {
      if (isEmpty(str)) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    let html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>`;

    if (this.options.htmlStyles) {
      html += `
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    h1 {
      color: #2F5496;
      border-bottom: 2px solid #2F5496;
      padding-bottom: 10px;
    }
    .meta {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .table-container {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 600px;
    }
    th {
      background: #2F5496;
      color: white;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    td {
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
    }
    tr:nth-child(even) { background: #f8f9fa; }
    tr:hover { background: #e8f4f8; }
    .number { text-align: right; font-family: 'Consolas', monospace; }
    .currency { text-align: right; color: #28a745; }
    .date { text-align: center; }
    .empty { color: #999; font-style: italic; }
    footer {
      margin-top: 20px;
      text-align: center;
      color: #666;
      font-size: 0.8em;
    }
  </style>`;
    }

    html += `
</head>
<body>
  <h1>${escapeHTML(title)}</h1>
  <div class="meta">
    <strong>Total Data:</strong> ${sheet.rows.length} baris | 
    <strong>Kolom:</strong> ${sheet.headers.length} | 
    <strong>Diekspor:</strong> ${new Date().toLocaleString('id-ID')}
  </div>
  <div class="table-container">
    <table>
      <thead>
        <tr>`;

    // Headers
    for (const header of sheet.headers) {
      html += `\n          <th>${escapeHTML(header)}</th>`;
    }

    html += `
        </tr>
      </thead>
      <tbody>`;

    // Rows
    for (const row of sheet.rows) {
      html += `\n        <tr>`;
      for (const header of sheet.headers) {
        const value = row[header];
        let cellClass = '';
        let displayValue = escapeHTML(value);
        
        if (isEmpty(value)) {
          cellClass = 'empty';
          displayValue = '-';
        } else if (!isNaN(parseNumber(value))) {
          cellClass = 'number';
        }
        
        html += `\n          <td class="${cellClass}">${displayValue}</td>`;
      }
      html += `\n        </tr>`;
    }

    html += `
      </tbody>
    </table>
  </div>
  <footer>
    Generated by Excel Intelligence Bot | ${new Date().getFullYear()}
  </footer>
</body>
</html>`;

    return {
      content: html,
      mimeType: EXPORT_FORMATS.HTML.mime,
      extension: '.html',
      encoding: this.options.encoding
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MARKDOWN CONVERSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to Markdown table
   */
  toMarkdown(sheet) {
    const lines = [];
    
    // Title
    lines.push(`# Data Export\n`);
    lines.push(`> Generated: ${new Date().toLocaleString('id-ID')}`);
    lines.push(`> Total: ${sheet.rows.length} rows\n`);
    
    // Calculate column widths for alignment
    const colWidths = sheet.headers.map((h, i) => {
      let maxWidth = h.length;
      for (const row of sheet.rows.slice(0, 50)) {
        const val = String(row[h] || '');
        if (val.length > maxWidth) maxWidth = val.length;
      }
      return Math.min(maxWidth, 30);
    });
    
    // Header row
    const headerRow = '| ' + sheet.headers.map((h, i) => 
      h.padEnd(colWidths[i])
    ).join(' | ') + ' |';
    lines.push(headerRow);
    
    // Separator
    const separator = '| ' + colWidths.map(w => 
      '-'.repeat(w)
    ).join(' | ') + ' |';
    lines.push(separator);
    
    // Data rows
    for (const row of sheet.rows) {
      const values = sheet.headers.map((h, i) => {
        let val = String(row[h] ?? '');
        if (val.length > colWidths[i]) {
          val = val.substring(0, colWidths[i] - 3) + '...';
        }
        return val.padEnd(colWidths[i]);
      });
      lines.push('| ' + values.join(' | ') + ' |');
    }
    
    lines.push('\n---');
    lines.push('*Exported by Excel Intelligence Bot*');
    
    return {
      content: lines.join('\n'),
      mimeType: EXPORT_FORMATS.MD.mime,
      extension: '.md',
      encoding: this.options.encoding
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SQL CONVERSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to SQL INSERT statements
   */
  toSQL(sheet) {
    const tableName = this.sanitizeTableName(this.options.sqlTableName);
    const dialect = this.options.sqlDialect;
    const lines = [];
    
    // Header comment
    lines.push('-- ═══════════════════════════════════════════════════════════════');
    lines.push('-- SQL Export - Generated by Excel Intelligence Bot');
    lines.push(`-- Date: ${new Date().toISOString()}`);
    lines.push(`-- Dialect: ${dialect.toUpperCase()}`);
    lines.push(`-- Total Rows: ${sheet.rows.length}`);
    lines.push('-- ═══════════════════════════════════════════════════════════════\n');
    
    // CREATE TABLE statement
    lines.push(this.generateCreateTable(sheet, tableName, dialect));
    lines.push('');
    
    // INSERT statements
    lines.push(`-- INSERT DATA`);
    lines.push(`-- ───────────────────────────────────────────────────────────────\n`);
    
    const columns = sheet.headers.map(h => this.sanitizeColumnName(h));
    const columnList = columns.join(', ');
    
    // Batch insert for better performance
    const batchSize = 100;
    for (let i = 0; i < sheet.rows.length; i += batchSize) {
      const batch = sheet.rows.slice(i, i + batchSize);
      
      if (dialect === 'mysql' || dialect === 'postgresql') {
        // Multi-row INSERT
        lines.push(`INSERT INTO ${tableName} (${columnList}) VALUES`);
        const values = batch.map((row, idx) => {
          const rowValues = sheet.headers.map(h => this.formatSQLValue(row[h], dialect));
          const isLast = idx === batch.length - 1;
          return `  (${rowValues.join(', ')})${isLast ? ';' : ','}`;
        });
        lines.push(...values);
        lines.push('');
      } else {
        // SQLite - individual INSERTs
        for (const row of batch) {
          const rowValues = sheet.headers.map(h => this.formatSQLValue(row[h], dialect));
          lines.push(`INSERT INTO ${tableName} (${columnList}) VALUES (${rowValues.join(', ')});`);
        }
      }
    }
    
    return {
      content: lines.join('\n'),
      mimeType: EXPORT_FORMATS.SQL.mime,
      extension: '.sql',
      encoding: this.options.encoding
    };
  }

  /**
   * Generate CREATE TABLE statement
   */
  generateCreateTable(sheet, tableName, dialect) {
    const lines = [];
    lines.push(`-- CREATE TABLE`);
    lines.push(`DROP TABLE IF EXISTS ${tableName};`);
    lines.push(`CREATE TABLE ${tableName} (`);
    
    const columnDefs = sheet.headers.map((h, i) => {
      const colName = this.sanitizeColumnName(h);
      const dataType = this.inferSQLType(sheet.rows, h, dialect);
      const isLast = i === sheet.headers.length - 1;
      return `  ${colName} ${dataType}${isLast ? '' : ','}`;
    });
    
    lines.push(...columnDefs);
    lines.push(');');
    
    return lines.join('\n');
  }

  /**
   * Infer SQL data type from values
   */
  inferSQLType(rows, header, dialect) {
    const sample = rows.slice(0, 100);
    let hasNumber = false;
    let hasFloat = false;
    let hasDate = false;
    let maxLength = 0;
    
    for (const row of sample) {
      const val = row[header];
      if (isEmpty(val)) continue;
      
      const strVal = String(val);
      maxLength = Math.max(maxLength, strVal.length);
      
      const numVal = parseNumber(val);
      if (numVal !== null) {
        hasNumber = true;
        if (!Number.isInteger(numVal)) hasFloat = true;
      }
      
      if (parseDate(val)) hasDate = true;
    }
    
    if (hasDate && !hasNumber) {
      return dialect === 'postgresql' ? 'TIMESTAMP' : 'DATETIME';
    }
    
    if (hasNumber && !hasFloat) {
      return dialect === 'postgresql' ? 'INTEGER' : 'INT';
    }
    
    if (hasFloat) {
      return dialect === 'postgresql' ? 'DECIMAL(15,2)' : 'DECIMAL(15,2)';
    }
    
    // String - determine length
    const varcharLength = Math.max(50, Math.min(maxLength * 2, 500));
    return `VARCHAR(${varcharLength})`;
  }

  /**
   * Format value for SQL
   */
  formatSQLValue(value, dialect) {
    if (isEmpty(value)) return 'NULL';
    
    const numVal = parseNumber(value);
    if (numVal !== null && String(value).match(/^[\d.,\-+\s]+$/)) {
      return numVal;
    }
    
    // Escape string
    const escaped = String(value)
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\');
    
    return `'${escaped}'`;
  }

  /**
   * Sanitize table name
   */
  sanitizeTableName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 64) || 'data_table';
  }

  /**
   * Sanitize column name
   */
  sanitizeColumnName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/^(\d)/, '_$1')
      .substring(0, 64) || 'column';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // XML CONVERSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to XML
   */
  toXML(sheet) {
    const rootName = this.options.xmlRootName;
    const rowName = this.options.xmlRowName;
    
    const escapeXML = (str) => {
      if (isEmpty(str)) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    const sanitizeTag = (name) => {
      return name
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^(\d)/, '_$1')
        .substring(0, 64) || 'field';
    };
    
    let xml = `<?xml version="1.0" encoding="${this.options.encoding}"?>\n`;
    xml += `<!-- Generated by Excel Intelligence Bot - ${new Date().toISOString()} -->\n`;
    xml += `<${rootName} totalRows="${sheet.rows.length}" generatedAt="${new Date().toISOString()}">\n`;
    
    for (let i = 0; i < sheet.rows.length; i++) {
      const row = sheet.rows[i];
      xml += `  <${rowName} index="${i + 1}">\n`;
      
      for (const header of sheet.headers) {
        const tag = sanitizeTag(header);
        const value = escapeXML(row[header]);
        xml += `    <${tag}>${value}</${tag}>\n`;
      }
      
      xml += `  </${rowName}>\n`;
    }
    
    xml += `</${rootName}>`;
    
    return {
      content: xml,
      mimeType: EXPORT_FORMATS.XML.mime,
      extension: '.xml',
      encoding: this.options.encoding
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXCEL CONVERSION (re-export)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert back to Excel buffer
   */
  toExcel(parsedData, sheetName = null) {
    const workbook = XLSX.utils.book_new();
    
    const sheetsToExport = sheetName 
      ? [sheetName] 
      : parsedData.sheetNames;
    
    for (const sName of sheetsToExport) {
      const sheet = parsedData.sheets[sName];
      if (!sheet) continue;
      
      const data = [
        sheet.headers,
        ...sheet.rows.map(row => 
          sheet.headers.map(h => row[h] ?? '')
        )
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      // Auto column width
      const colWidths = sheet.headers.map((h, i) => {
        let maxLen = h.length;
        for (const row of sheet.rows.slice(0, 100)) {
          const val = String(row[h] || '');
          if (val.length > maxLen) maxLen = val.length;
        }
        return { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sName);
    }
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      content: buffer,
      mimeType: EXPORT_FORMATS.XLSX.mime,
      extension: '.xlsx',
      encoding: 'binary'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAIN TEXT CONVERSION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to plain text (tab-separated)
   */
  toText(sheet) {
    const lines = [];
    
    // Headers
    lines.push(sheet.headers.join('\t'));
    
    // Data
    for (const row of sheet.rows) {
      const values = sheet.headers.map(h => String(row[h] ?? ''));
      lines.push(values.join('\t'));
    }
    
    return {
      content: lines.join('\n'),
      mimeType: 'text/plain',
      extension: '.txt',
      encoding: this.options.encoding
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATIC METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get supported formats
   */
  static getSupportedFormats() {
    return Object.keys(EXPORT_FORMATS).map(key => ({
      id: key.toLowerCase(),
      name: key,
      extension: EXPORT_FORMATS[key].ext,
      mimeType: EXPORT_FORMATS[key].mime
    }));
  }

  /**
   * Quick convert
   */
  static async quickConvert(parsedData, targetFormat, sheetName = null) {
    const converter = new DataConverter();
    return converter.convert(parsedData, targetFormat, sheetName);
  }
}

// Create singleton
export const dataConverter = new DataConverter();

export default {
  DataConverter,
  dataConverter
};
