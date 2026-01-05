// ═══════════════════════════════════════════════════════════════════════════
// FORMATTER.JS - Excel Styling & Formatting Engine
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import ExcelJS from 'exceljs';
import { DATA_TYPES, BOT_CONFIG } from '../utils/constants.js';
import { parseNumber, parseDate, isEmpty } from '../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// STYLE PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const STYLE_PRESETS = {
  professional: {
    name: 'Professional',
    header: {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'FF1F4E79' } },
        bottom: { style: 'thin', color: { argb: 'FF1F4E79' } },
        left: { style: 'thin', color: { argb: 'FF1F4E79' } },
        right: { style: 'thin', color: { argb: 'FF1F4E79' } }
      }
    },
    evenRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6DCE5' } }
    },
    oddRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    },
    border: {
      top: { style: 'thin', color: { argb: 'FFB4C6E7' } },
      bottom: { style: 'thin', color: { argb: 'FFB4C6E7' } },
      left: { style: 'thin', color: { argb: 'FFB4C6E7' } },
      right: { style: 'thin', color: { argb: 'FFB4C6E7' } }
    }
  },
  
  modern: {
    name: 'Modern',
    header: {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        bottom: { style: 'medium', color: { argb: 'FF0D6EFD' } }
      }
    },
    evenRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    },
    oddRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    },
    border: {
      bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }
    }
  },
  
  minimal: {
    name: 'Minimal',
    header: {
      font: { bold: true, color: { argb: 'FF212529' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
      alignment: { horizontal: 'left', vertical: 'middle' },
      border: {
        bottom: { style: 'medium', color: { argb: 'FF212529' } }
      }
    },
    evenRow: {},
    oddRow: {},
    border: {
      bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } }
    }
  },
  
  colorful: {
    name: 'Colorful',
    header: {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6F42C1' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FF6F42C1' } },
        bottom: { style: 'thin', color: { argb: 'FF6F42C1' } },
        left: { style: 'thin', color: { argb: 'FF6F42C1' } },
        right: { style: 'thin', color: { argb: 'FF6F42C1' } }
      }
    },
    evenRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } }
    },
    oddRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    },
    border: {
      top: { style: 'thin', color: { argb: 'FFE1BEE7' } },
      bottom: { style: 'thin', color: { argb: 'FFE1BEE7' } },
      left: { style: 'thin', color: { argb: 'FFE1BEE7' } },
      right: { style: 'thin', color: { argb: 'FFE1BEE7' } }
    }
  },
  
  dark: {
    name: 'Dark',
    header: {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF212529' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FF495057' } },
        bottom: { style: 'thin', color: { argb: 'FF495057' } },
        left: { style: 'thin', color: { argb: 'FF495057' } },
        right: { style: 'thin', color: { argb: 'FF495057' } }
      }
    },
    evenRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF343A40' } },
      font: { color: { argb: 'FFFFFFFF' } }
    },
    oddRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF495057' } },
      font: { color: { argb: 'FFFFFFFF' } }
    },
    border: {
      top: { style: 'thin', color: { argb: 'FF6C757D' } },
      bottom: { style: 'thin', color: { argb: 'FF6C757D' } },
      left: { style: 'thin', color: { argb: 'FF6C757D' } },
      right: { style: 'thin', color: { argb: 'FF6C757D' } }
    }
  },
  
  indonesia: {
    name: 'Indonesia',
    header: {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC3545' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'FFDC3545' } },
        bottom: { style: 'thin', color: { argb: 'FFDC3545' } },
        left: { style: 'thin', color: { argb: 'FFDC3545' } },
        right: { style: 'thin', color: { argb: 'FFDC3545' } }
      }
    },
    evenRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } }
    },
    oddRow: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    },
    border: {
      top: { style: 'thin', color: { argb: 'FFFFC107' } },
      bottom: { style: 'thin', color: { argb: 'FFFFC107' } },
      left: { style: 'thin', color: { argb: 'FFFFC107' } },
      right: { style: 'thin', color: { argb: 'FFFFC107' } }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER FORMATS
// ─────────────────────────────────────────────────────────────────────────────

export const NUMBER_FORMATS = {
  // Indonesia formats
  RUPIAH: '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-',
  RUPIAH_DECIMAL: '_-"Rp"* #,##0.00_-;-"Rp"* #,##0.00_-;_-"Rp"* "-"??_-;_-@_-',
  NUMBER_ID: '#.##0',
  NUMBER_ID_DECIMAL: '#.##0,00',
  
  // International formats
  USD: '_-"$"* #,##0.00_-;-"$"* #,##0.00_-;_-"$"* "-"??_-;_-@_-',
  EUR: '_-"€"* #,##0.00_-;-"€"* #,##0.00_-;_-"€"* "-"??_-;_-@_-',
  NUMBER: '#,##0',
  NUMBER_DECIMAL: '#,##0.00',
  
  // Percentage
  PERCENTAGE: '0%',
  PERCENTAGE_DECIMAL: '0.00%',
  
  // Date formats
  DATE_DMY: 'DD/MM/YYYY',
  DATE_YMD: 'YYYY-MM-DD',
  DATE_FULL: 'DD MMMM YYYY',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm:ss'
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FORMATTER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class ExcelFormatter {
  constructor(options = {}) {
    this.options = {
      stylePreset: options.stylePreset || 'professional',
      autoWidth: options.autoWidth ?? true,
      minColumnWidth: options.minColumnWidth || 10,
      maxColumnWidth: options.maxColumnWidth || 50,
      headerHeight: options.headerHeight || 25,
      rowHeight: options.rowHeight || 20,
      freezeHeader: options.freezeHeader ?? true,
      autoFilter: options.autoFilter ?? true,
      zebraStripes: options.zebraStripes ?? true,
      formatNumbers: options.formatNumbers ?? true,
      formatDates: options.formatDates ?? true,
      formatCurrency: options.formatCurrency ?? true,
      currencyFormat: options.currencyFormat || 'RUPIAH',
      dateFormat: options.dateFormat || 'DATE_DMY',
      addFormulas: options.addFormulas ?? false,
      ...options
    };
  }

  /**
   * 🎨 MAIN FORMAT METHOD
   * Format parsed data menjadi Excel buffer dengan styling
   */
  async format(parsedData, columnAnalysis = null, sheetName = null) {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Excel Intelligence Bot';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const targetSheets = sheetName 
      ? [sheetName] 
      : parsedData.sheetNames;
    
    for (const sName of targetSheets) {
      const sheet = parsedData.sheets[sName];
      if (!sheet) continue;
      
      await this.formatSheet(workbook, sheet, columnAnalysis);
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Format single sheet
   */
  async formatSheet(workbook, sheet, columnAnalysis) {
    const worksheet = workbook.addWorksheet(sheet.name, {
      properties: { tabColor: { argb: 'FF2F5496' } }
    });
    
    const style = STYLE_PRESETS[this.options.stylePreset] || STYLE_PRESETS.professional;
    const headers = sheet.headers;
    const rows = sheet.rows;
    
    // 1️⃣ Add headers
    const headerRow = worksheet.addRow(headers);
    headerRow.height = this.options.headerHeight;
    
    // Style header
    headerRow.eachCell((cell, colNumber) => {
      cell.font = style.header.font;
      cell.fill = style.header.fill;
      cell.alignment = style.header.alignment;
      cell.border = style.header.border;
    });
    
    // 2️⃣ Add data rows
    rows.forEach((row, rowIndex) => {
      const dataRow = worksheet.addRow(
        headers.map(h => row[h] ?? '')
      );
      dataRow.height = this.options.rowHeight;
      
      // Apply zebra stripes
      if (this.options.zebraStripes) {
        const rowStyle = rowIndex % 2 === 0 ? style.evenRow : style.oddRow;
        dataRow.eachCell((cell, colNumber) => {
          if (rowStyle.fill) cell.fill = rowStyle.fill;
          if (rowStyle.font) cell.font = rowStyle.font;
          cell.border = style.border;
        });
      } else {
        dataRow.eachCell((cell) => {
          cell.border = style.border;
        });
      }
    });
    
    // 3️⃣ Apply column formatting
    headers.forEach((header, index) => {
      const colNumber = index + 1;
      const column = worksheet.getColumn(colNumber);
      
      // Auto width
      if (this.options.autoWidth) {
        const maxLength = this.calculateColumnWidth(header, rows, header);
        column.width = Math.min(
          Math.max(maxLength, this.options.minColumnWidth),
          this.options.maxColumnWidth
        );
      }
      
      // Apply number formats based on column analysis
      if (columnAnalysis && columnAnalysis[header]) {
        this.applyColumnFormat(worksheet, colNumber, columnAnalysis[header], rows.length);
      }
    });
    
    // 4️⃣ Freeze header row
    if (this.options.freezeHeader) {
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
      ];
    }
    
    // 5️⃣ Add auto filter
    if (this.options.autoFilter && headers.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length }
      };
    }
    
    // 6️⃣ Add formulas if enabled
    if (this.options.addFormulas) {
      this.addFormulas(worksheet, headers, rows.length, columnAnalysis);
    }
    
    return worksheet;
  }

  /**
   * Calculate optimal column width
   */
  calculateColumnWidth(header, rows, columnName) {
    let maxLength = header.length;
    
    for (const row of rows.slice(0, 100)) { // Sample first 100 rows
      const value = row[columnName];
      if (value !== null && value !== undefined) {
        const length = String(value).length;
        if (length > maxLength) {
          maxLength = length;
        }
      }
    }
    
    return maxLength + 2; // Add padding
  }

  /**
   * Apply number/date format to column
   */
  applyColumnFormat(worksheet, colNumber, colAnalysis, rowCount) {
    const type = colAnalysis.detectedType;
    
    let numFmt = null;
    let alignment = { vertical: 'middle' };
    
    switch (type) {
      case DATA_TYPES.CURRENCY:
        if (this.options.formatCurrency) {
          const currency = colAnalysis.typeDetails?.currency || 'IDR';
          numFmt = currency === 'USD' 
            ? NUMBER_FORMATS.USD 
            : NUMBER_FORMATS[this.options.currencyFormat];
          alignment.horizontal = 'right';
        }
        break;
        
      case DATA_TYPES.INTEGER:
      case DATA_TYPES.FLOAT:
      case DATA_TYPES.NUMBER:
        if (this.options.formatNumbers) {
          numFmt = type === DATA_TYPES.FLOAT 
            ? NUMBER_FORMATS.NUMBER_DECIMAL 
            : NUMBER_FORMATS.NUMBER;
          alignment.horizontal = 'right';
        }
        break;
        
      case DATA_TYPES.PERCENTAGE:
        numFmt = NUMBER_FORMATS.PERCENTAGE_DECIMAL;
        alignment.horizontal = 'right';
        break;
        
      case DATA_TYPES.DATE:
        if (this.options.formatDates) {
          numFmt = NUMBER_FORMATS[this.options.dateFormat];
          alignment.horizontal = 'center';
        }
        break;
        
      case DATA_TYPES.DATETIME:
        if (this.options.formatDates) {
          numFmt = NUMBER_FORMATS.DATETIME;
          alignment.horizontal = 'center';
        }
        break;
        
      case DATA_TYPES.EMAIL:
      case DATA_TYPES.URL:
        alignment.horizontal = 'left';
        break;
        
      case DATA_TYPES.NIK:
      case DATA_TYPES.NPWP:
      case DATA_TYPES.PHONE:
        // Keep as text, center align
        numFmt = '@'; // Text format
        alignment.horizontal = 'center';
        break;
    }
    
    // Apply format to all cells in column (skip header)
    if (numFmt || alignment) {
      for (let row = 2; row <= rowCount + 1; row++) {
        const cell = worksheet.getCell(row, colNumber);
        if (numFmt) cell.numFmt = numFmt;
        cell.alignment = { ...cell.alignment, ...alignment };
      }
    }
  }

  /**
   * Add summary formulas at the bottom
   */
  addFormulas(worksheet, headers, dataRowCount, columnAnalysis) {
    if (!columnAnalysis) return;
    
    const formulaRow = dataRowCount + 3; // Skip one row after data
    let hasFormulas = false;
    
    // Add "Total" label
    worksheet.getCell(formulaRow, 1).value = 'TOTAL';
    worksheet.getCell(formulaRow, 1).font = { bold: true };
    
    headers.forEach((header, index) => {
      const colNumber = index + 1;
      const colAnalysis = columnAnalysis[header];
      
      if (colAnalysis && colAnalysis.isNumeric) {
        const colLetter = this.getColumnLetter(colNumber);
        const startRow = 2;
        const endRow = dataRowCount + 1;
        
        // Add SUM formula
        const cell = worksheet.getCell(formulaRow, colNumber);
        cell.value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` };
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'double', color: { argb: 'FF000000' } }
        };
        
        // Apply same format as column
        if (colAnalysis.detectedType === DATA_TYPES.CURRENCY) {
          cell.numFmt = NUMBER_FORMATS[this.options.currencyFormat];
        }
        
        hasFormulas = true;
      }
    });
    
    return hasFormulas;
  }

  /**
   * Get Excel column letter from number (1 = A, 27 = AA)
   */
  getColumnLetter(colNumber) {
    let letter = '';
    while (colNumber > 0) {
      const remainder = (colNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      colNumber = Math.floor((colNumber - 1) / 26);
    }
    return letter;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONDITIONAL FORMATTING
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Add conditional formatting to worksheet
   */
  addConditionalFormatting(worksheet, rules) {
    for (const rule of rules) {
      worksheet.addConditionalFormatting({
        ref: rule.range,
        rules: [rule.condition]
      });
    }
  }

  /**
   * Highlight duplicates in a column
   */
  highlightDuplicates(worksheet, colLetter, startRow, endRow) {
    worksheet.addConditionalFormatting({
      ref: `${colLetter}${startRow}:${colLetter}${endRow}`,
      rules: [
        {
          type: 'duplicateValues',
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFFCCCC' }
            }
          }
        }
      ]
    });
  }

  /**
   * Color scale for numeric columns (low to high)
   */
  addColorScale(worksheet, colLetter, startRow, endRow) {
    worksheet.addConditionalFormatting({
      ref: `${colLetter}${startRow}:${colLetter}${endRow}`,
      rules: [
        {
          type: 'colorScale',
          cfvo: [
            { type: 'min' },
            { type: 'percentile', value: 50 },
            { type: 'max' }
          ],
          color: [
            { argb: 'FFF8696B' }, // Red
            { argb: 'FFFFEB84' }, // Yellow
            { argb: 'FF63BE7B' }  // Green
          ]
        }
      ]
    });
  }

  /**
   * Data bars for numeric columns
   */
  addDataBars(worksheet, colLetter, startRow, endRow) {
    worksheet.addConditionalFormatting({
      ref: `${colLetter}${startRow}:${colLetter}${endRow}`,
      rules: [
        {
          type: 'dataBar',
          minLength: 0,
          maxLength: 100,
          gradient: true,
          color: { argb: 'FF638EC6' }
        }
      ]
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATIC QUICK METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Quick format with professional style
   */
  static async quickFormat(parsedData, columnAnalysis = null) {
    const formatter = new ExcelFormatter({
      stylePreset: 'professional',
      addFormulas: true
    });
    return formatter.format(parsedData, columnAnalysis);
  }

  /**
   * Format for printing
   */
  static async printFormat(parsedData, columnAnalysis = null) {
    const formatter = new ExcelFormatter({
      stylePreset: 'minimal',
      zebraStripes: false,
      autoFilter: false,
      addFormulas: true
    });
    return formatter.format(parsedData, columnAnalysis);
  }

  /**
   * Get available style presets
   */
  static getStylePresets() {
    return Object.keys(STYLE_PRESETS).map(key => ({
      id: key,
      name: STYLE_PRESETS[key].name
    }));
  }
}

// Create singleton
export const excelFormatter = new ExcelFormatter();

export default {
  ExcelFormatter,
  excelFormatter,
  STYLE_PRESETS,
  NUMBER_FORMATS
};
