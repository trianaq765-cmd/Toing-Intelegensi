// ═══════════════════════════════════════════════════════════════════════════
// ANALYZER.JS - 🧠 OTAK UTAMA BOT - Intelligent Data Analysis Engine
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import {
  PATTERNS,
  DATA_TYPES,
  ISSUE_TYPES,
  INDONESIA_PROVINCE_CODES,
  TAX_RATES,
  QUALITY_THRESHOLDS,
  BOT_CONFIG
} from '../utils/constants.js';

import {
  parseNumber,
  parseDate,
  validateNIK,
  validateNPWP,
  validateEmail,
  validatePhoneID,
  normalizeString,
  isEmpty,
  calculateStats,
  detectOutliers,
  stringSimilarity,
  formatRupiah,
  formatPercentage
} from '../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ANALYZER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class DataAnalyzer {
  constructor(options = {}) {
    this.options = {
      deepAnalysis: options.deepAnalysis ?? true,
      detectOutliers: options.detectOutliers ?? true,
      checkCalculations: options.checkCalculations ?? true,
      ppnRate: options.ppnRate ?? TAX_RATES.PPN,
      outlierThreshold: options.outlierThreshold ?? 1.5,
      similarityThreshold: options.similarityThreshold ?? 0.85,
      maxRowsAnalyze: options.maxRowsAnalyze ?? 10000
    };
    
    this.analysisResult = null;
  }

  /**
   * 🚀 MAIN ANALYSIS METHOD
   * Melakukan analisis lengkap pada data
   */
  async analyze(parsedData, sheetName = null) {
    const startTime = Date.now();
    
    const sheet = parsedData.sheets[sheetName || parsedData.activeSheet];
    
    if (!sheet || sheet.rows.length === 0) {
      throw new Error('Sheet kosong atau tidak ditemukan');
    }

    // Limit rows for performance
    const rowsToAnalyze = sheet.rows.slice(0, this.options.maxRowsAnalyze);
    
    // 1️⃣ Analyze column types
    const columnAnalysis = this.analyzeColumns(sheet.headers, rowsToAnalyze);
    
    // 2️⃣ Detect issues
    const issues = await this.detectIssues(sheet.headers, rowsToAnalyze, columnAnalysis);
    
    // 3️⃣ Calculate quality score
    const qualityScore = this.calculateQualityScore(rowsToAnalyze, issues, columnAnalysis);
    
    // 4️⃣ Generate statistics
    const statistics = this.generateStatistics(sheet.headers, rowsToAnalyze, columnAnalysis);
    
    // 5️⃣ Generate suggestions
    const suggestions = this.generateSuggestions(issues, columnAnalysis, qualityScore);
    
    // 6️⃣ Deep analysis (if enabled)
    let deepInsights = null;
    if (this.options.deepAnalysis) {
      deepInsights = await this.performDeepAnalysis(sheet.headers, rowsToAnalyze, columnAnalysis);
    }

    const endTime = Date.now();

    this.analysisResult = {
      summary: {
        totalRows: sheet.rows.length,
        analyzedRows: rowsToAnalyze.length,
        totalColumns: sheet.headers.length,
        headers: sheet.headers,
        analysisTime: `${endTime - startTime}ms`
      },
      columnAnalysis,
      issues: {
        total: issues.length,
        byType: this.groupIssuesByType(issues),
        bySeverity: this.groupIssuesBySeverity(issues),
        details: issues.slice(0, 100) // Limit details untuk performance
      },
      qualityScore,
      statistics,
      suggestions,
      deepInsights,
      metadata: {
        analyzedAt: new Date().toISOString(),
        analyzerVersion: '2.0.0',
        options: this.options
      }
    };

    return this.analysisResult;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COLUMN ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Analyze each column's data type and characteristics
   */
  analyzeColumns(headers, rows) {
    const analysis = {};

    for (const header of headers) {
      const values = rows.map(row => row[header]);
      analysis[header] = this.analyzeColumn(header, values);
    }

    return analysis;
  }

  /**
   * Analyze single column
   */
  analyzeColumn(header, values) {
    const nonEmptyValues = values.filter(v => !isEmpty(v));
    
    // Detect primary data type
    const typeDetection = this.detectColumnType(header, nonEmptyValues);
    
    // Count unique values
    const uniqueValues = new Set(values.map(v => String(v).toLowerCase().trim()));
    
    // Sample values
    const sampleValues = nonEmptyValues.slice(0, 5);
    
    // Calculate fill rate
    const fillRate = (nonEmptyValues.length / values.length) * 100;

    return {
      header,
      detectedType: typeDetection.type,
      confidence: typeDetection.confidence,
      typeDetails: typeDetection.details,
      totalValues: values.length,
      nonEmptyCount: nonEmptyValues.length,
      emptyCount: values.length - nonEmptyValues.length,
      uniqueCount: uniqueValues.size,
      fillRate: Math.round(fillRate * 100) / 100,
      sampleValues,
      isNumeric: this.isNumericType(typeDetection.type),
      isDate: typeDetection.type === DATA_TYPES.DATE || typeDetection.type === DATA_TYPES.DATETIME,
      isIdentifier: this.isIdentifierType(typeDetection.type)
    };
  }

  /**
   * 🧠 INTELLIGENT TYPE DETECTION
   */
  detectColumnType(header, values) {
    if (values.length === 0) {
      return { type: DATA_TYPES.EMPTY, confidence: 100, details: {} };
    }

    const headerLower = header.toLowerCase();
    
    // Type counters
    const typeCounts = {};
    const typeDetails = {};
    
    for (const value of values) {
      const detectedType = this.detectValueType(value, headerLower);
      typeCounts[detectedType.type] = (typeCounts[detectedType.type] || 0) + 1;
      
      if (!typeDetails[detectedType.type]) {
        typeDetails[detectedType.type] = detectedType.details;
      }
    }

    // Find dominant type
    let dominantType = DATA_TYPES.STRING;
    let maxCount = 0;
    
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    }

    const confidence = Math.round((maxCount / values.length) * 100);
    
    // Check for mixed types
    if (Object.keys(typeCounts).length > 2 && confidence < 70) {
      dominantType = DATA_TYPES.MIXED;
    }

    return {
      type: dominantType,
      confidence,
      details: typeDetails[dominantType] || {},
      distribution: typeCounts
    };
  }

  /**
   * Detect type of single value
   */
  detectValueType(value, headerHint = '') {
    if (isEmpty(value)) {
      return { type: DATA_TYPES.EMPTY, details: {} };
    }

    const strValue = String(value).trim();
    
    // === INDONESIA SPECIFIC ===
    
    // NIK (16 digit)
    if (PATTERNS.NIK.test(strValue.replace(/\D/g, ''))) {
      const validation = validateNIK(strValue);
      if (validation.valid) {
        return { type: DATA_TYPES.NIK, details: validation.data };
      }
    }
    
    // NPWP
    if (PATTERNS.NPWP.test(strValue) || PATTERNS.NPWP_NEW.test(strValue.replace(/\D/g, ''))) {
      return { type: DATA_TYPES.NPWP, details: {} };
    }
    
    // Phone Indonesia
    if (PATTERNS.PHONE_ID.test(strValue.replace(/[\s\-()]/g, ''))) {
      return { type: DATA_TYPES.PHONE, details: { format: 'ID' } };
    }
    
    // === CURRENCY ===
    
    // Rupiah
    if (PATTERNS.CURRENCY_IDR.test(strValue) || 
        (headerHint.match(/(harga|total|gaji|nominal|rupiah|idr|bayar|biaya|tarif)/i) && 
         parseNumber(strValue) !== null)) {
      return { type: DATA_TYPES.CURRENCY, details: { currency: 'IDR' } };
    }
    
    // USD
    if (PATTERNS.CURRENCY_USD.test(strValue)) {
      return { type: DATA_TYPES.CURRENCY, details: { currency: 'USD' } };
    }
    
    // === EMAIL ===
    if (PATTERNS.EMAIL.test(strValue)) {
      return { type: DATA_TYPES.EMAIL, details: {} };
    }
    
    // === URL ===
    if (PATTERNS.URL.test(strValue)) {
      return { type: DATA_TYPES.URL, details: {} };
    }
    
    // === PERCENTAGE ===
    if (PATTERNS.PERCENTAGE.test(strValue)) {
      return { type: DATA_TYPES.PERCENTAGE, details: {} };
    }
    
    // === DATE ===
    if (PATTERNS.DATE_DMY.test(strValue) || 
        PATTERNS.DATE_YMD.test(strValue) ||
        PATTERNS.DATE_INDONESIA.test(strValue) ||
        headerHint.match(/(tanggal|date|tgl|created|updated)/i)) {
      const parsed = parseDate(strValue);
      if (parsed) {
        return { type: DATA_TYPES.DATE, details: { parsed } };
      }
    }
    
    // === DATETIME ===
    if (PATTERNS.DATETIME.test(strValue)) {
      return { type: DATA_TYPES.DATETIME, details: {} };
    }
    
    // === BOOLEAN ===
    if (/^(true|false|yes|no|ya|tidak|1|0|aktif|nonaktif)$/i.test(strValue)) {
      return { type: DATA_TYPES.BOOLEAN, details: {} };
    }
    
    // === NUMBER ===
    const numValue = parseNumber(strValue);
    if (numValue !== null && strValue.match(/^[\d.,\-+\s]+$/)) {
      if (Number.isInteger(numValue)) {
        return { type: DATA_TYPES.INTEGER, details: { value: numValue } };
      }
      return { type: DATA_TYPES.FLOAT, details: { value: numValue } };
    }
    
    // === DEFAULT: STRING ===
    return { type: DATA_TYPES.STRING, details: {} };
  }

  isNumericType(type) {
    return [DATA_TYPES.NUMBER, DATA_TYPES.INTEGER, DATA_TYPES.FLOAT, 
            DATA_TYPES.CURRENCY, DATA_TYPES.PERCENTAGE].includes(type);
  }

  isIdentifierType(type) {
    return [DATA_TYPES.NIK, DATA_TYPES.NPWP, DATA_TYPES.EMAIL, DATA_TYPES.PHONE].includes(type);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ISSUE DETECTION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 🔍 Detect all issues in data
   */
  async detectIssues(headers, rows, columnAnalysis) {
    const issues = [];

    // 1. Check for duplicates
    issues.push(...this.detectDuplicates(rows, headers));
    
    // 2. Check for empty rows
    issues.push(...this.detectEmptyRows(rows, headers));
    
    // 3. Check each column for specific issues
    for (const header of headers) {
      const values = rows.map((row, idx) => ({ value: row[header], rowIndex: idx + 2 }));
      const colAnalysis = columnAnalysis[header];
      
      // Format consistency
      issues.push(...this.detectFormatInconsistency(header, values, colAnalysis));
      
      // Validation based on type
      issues.push(...this.detectValidationErrors(header, values, colAnalysis));
      
      // Whitespace issues
      issues.push(...this.detectWhitespaceIssues(header, values));
      
      // Outliers (for numeric columns)
      if (colAnalysis.isNumeric && this.options.detectOutliers) {
        issues.push(...this.detectOutlierIssues(header, values));
      }
    }
    
    // 4. Check calculations (PPN, Total, etc)
    if (this.options.checkCalculations) {
      issues.push(...this.detectCalculationErrors(rows, headers, columnAnalysis));
    }
    
    // 5. Detect potential typos
    issues.push(...this.detectTypos(rows, headers, columnAnalysis));

    return issues;
  }

  /**
   * Detect duplicate rows
   */
  detectDuplicates(rows, headers) {
    const issues = [];
    const seen = new Map();
    
    for (let i = 0; i < rows.length; i++) {
      // Create row signature (exclude _rowIndex)
      const signature = headers.map(h => String(rows[i][h] || '').trim().toLowerCase()).join('|');
      
      if (seen.has(signature)) {
        issues.push({
          type: ISSUE_TYPES.DUPLICATE.code,
          severity: ISSUE_TYPES.DUPLICATE.severity,
          row: i + 2,
          column: null,
          message: `Baris duplikat dari baris ${seen.get(signature) + 2}`,
          originalRow: seen.get(signature) + 2,
          autoFixable: true,
          fix: 'Hapus salah satu baris'
        });
      } else {
        seen.set(signature, i);
      }
    }
    
    return issues;
  }

  /**
   * Detect empty rows
   */
  detectEmptyRows(rows, headers) {
    const issues = [];
    
    for (let i = 0; i < rows.length; i++) {
      const isEmpty = headers.every(h => {
        const val = rows[i][h];
        return val === null || val === undefined || String(val).trim() === '';
      });
      
      if (isEmpty) {
        issues.push({
          type: ISSUE_TYPES.EMPTY_ROW.code,
          severity: ISSUE_TYPES.EMPTY_ROW.severity,
          row: i + 2,
          column: null,
          message: 'Baris kosong',
          autoFixable: true,
          fix: 'Hapus baris ini'
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect format inconsistency in column
   */
  detectFormatInconsistency(header, values, colAnalysis) {
    const issues = [];
    
    if (colAnalysis.detectedType === DATA_TYPES.MIXED) {
      // Get samples of different formats
      const formats = {};
      values.forEach(({ value, rowIndex }) => {
        const type = this.detectValueType(value, header).type;
        if (!formats[type]) formats[type] = [];
        if (formats[type].length < 3) {
          formats[type].push({ value, rowIndex });
        }
      });
      
      // Report the inconsistency
      issues.push({
        type: ISSUE_TYPES.FORMAT_INCONSISTENT.code,
        severity: ISSUE_TYPES.FORMAT_INCONSISTENT.severity,
        row: null,
        column: header,
        message: `Kolom "${header}" memiliki format tidak konsisten: ${Object.keys(formats).join(', ')}`,
        details: formats,
        autoFixable: false,
        fix: 'Seragamkan format data dalam kolom ini'
      });
    }
    
    return issues;
  }

  /**
   * Detect validation errors based on detected type
   */
  detectValidationErrors(header, values, colAnalysis) {
    const issues = [];
    const type = colAnalysis.detectedType;
    
    for (const { value, rowIndex } of values) {
      if (isEmpty(value)) continue;
      
      let validation = null;
      
      switch (type) {
        case DATA_TYPES.NIK:
          validation = validateNIK(value);
          if (!validation.valid) {
            issues.push({
              type: ISSUE_TYPES.INVALID_NIK.code,
              severity: ISSUE_TYPES.INVALID_NIK.severity,
              row: rowIndex,
              column: header,
              value,
              message: `NIK tidak valid: ${validation.error}`,
              autoFixable: false,
              fix: 'Perbaiki NIK sesuai format yang benar'
            });
          }
          break;
          
        case DATA_TYPES.NPWP:
          validation = validateNPWP(value);
          if (!validation.valid) {
            issues.push({
              type: ISSUE_TYPES.INVALID_NPWP.code,
              severity: ISSUE_TYPES.INVALID_NPWP.severity,
              row: rowIndex,
              column: header,
              value,
              message: `NPWP tidak valid: ${validation.error}`,
              autoFixable: false,
              fix: 'Perbaiki NPWP sesuai format yang benar'
            });
          }
          break;
          
        case DATA_TYPES.EMAIL:
          validation = validateEmail(value);
          if (!validation.valid) {
            issues.push({
              type: ISSUE_TYPES.INVALID_EMAIL.code,
              severity: ISSUE_TYPES.INVALID_EMAIL.severity,
              row: rowIndex,
              column: header,
              value,
              message: `Email tidak valid`,
              autoFixable: false,
              fix: 'Perbaiki format email'
            });
          }
          break;
          
        case DATA_TYPES.PHONE:
          validation = validatePhoneID(value);
          if (!validation.valid) {
            issues.push({
              type: ISSUE_TYPES.INVALID_PHONE.code,
              severity: ISSUE_TYPES.INVALID_PHONE.severity,
              row: rowIndex,
              column: header,
              value,
              message: `Nomor telepon tidak valid`,
              autoFixable: true,
              fix: 'Format ke +62 atau 08xx'
            });
          }
          break;
      }
    }
    
    return issues;
  }

  /**
   * Detect whitespace issues
   */
  detectWhitespaceIssues(header, values) {
    const issues = [];
    
    for (const { value, rowIndex } of values) {
      if (isEmpty(value)) continue;
      
      const strValue = String(value);
      
      // Leading/trailing whitespace
      if (strValue !== strValue.trim()) {
        issues.push({
          type: ISSUE_TYPES.WHITESPACE.code,
          severity: ISSUE_TYPES.WHITESPACE.severity,
          row: rowIndex,
          column: header,
          value: strValue,
          message: 'Spasi di awal/akhir teks',
          autoFixable: true,
          fix: 'Trim whitespace'
        });
      }
      
      // Multiple spaces
      if (/\s{2,}/.test(strValue)) {
        issues.push({
          type: ISSUE_TYPES.WHITESPACE.code,
          severity: ISSUE_TYPES.WHITESPACE.severity,
          row: rowIndex,
          column: header,
          value: strValue,
          message: 'Spasi berlebih dalam teks',
          autoFixable: true,
          fix: 'Normalize spasi'
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect outlier values
   */
  detectOutlierIssues(header, values) {
    const issues = [];
    
    const numericValues = values
      .map(v => parseNumber(v.value))
      .filter(v => v !== null);
    
    if (numericValues.length < 10) return issues; // Need enough data
    
    const outliers = detectOutliers(
      values.map(v => v.value), 
      this.options.outlierThreshold
    );
    
    for (const outlier of outliers) {
      const originalItem = values[outlier.index];
      issues.push({
        type: ISSUE_TYPES.OUTLIER.code,
        severity: ISSUE_TYPES.OUTLIER.severity,
        row: originalItem.rowIndex,
        column: header,
        value: originalItem.value,
        message: `Nilai tidak wajar: ${outlier.reason}`,
        autoFixable: false,
        fix: 'Periksa apakah nilai ini benar'
      });
    }
    
    return issues;
  }

  /**
   * 🔢 Detect calculation errors (PPN, Total, dll)
   */
  detectCalculationErrors(rows, headers, columnAnalysis) {
    const issues = [];
    
    // Find related columns
    const qtyColumn = headers.find(h => h.toLowerCase().match(/(qty|jumlah|kuantitas|quantity)/));
    const priceColumn = headers.find(h => h.toLowerCase().match(/(harga|price|unit.?price)/));
    const subtotalColumn = headers.find(h => h.toLowerCase().match(/(subtotal|sub.?total)/));
    const ppnColumn = headers.find(h => h.toLowerCase().match(/(ppn|pajak|tax|vat)/));
    const totalColumn = headers.find(h => h.toLowerCase().match(/^total$/i) || 
                                           h.toLowerCase().match(/(grand.?total|total.?harga)/));
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      
      // Check Qty × Price = Subtotal
      if (qtyColumn && priceColumn && subtotalColumn) {
        const qty = parseNumber(row[qtyColumn]);
        const price = parseNumber(row[priceColumn]);
        const subtotal = parseNumber(row[subtotalColumn]);
        
        if (qty !== null && price !== null && subtotal !== null) {
          const expectedSubtotal = qty * price;
          if (Math.abs(expectedSubtotal - subtotal) > 1) {
            issues.push({
              type: ISSUE_TYPES.CALCULATION_ERROR.code,
              severity: ISSUE_TYPES.CALCULATION_ERROR.severity,
              row: rowNum,
              column: subtotalColumn,
              message: `Subtotal seharusnya ${formatRupiah(expectedSubtotal)} (${qtyColumn} × ${priceColumn})`,
              expected: expectedSubtotal,
              actual: subtotal,
              autoFixable: true,
              fix: `Ubah ke ${formatRupiah(expectedSubtotal)}`
            });
          }
        }
      }
      
      // Check PPN calculation (11%)
      if (ppnColumn && (subtotalColumn || totalColumn)) {
        const base = parseNumber(row[subtotalColumn] || row[priceColumn]);
        const ppn = parseNumber(row[ppnColumn]);
        
        if (base !== null && ppn !== null && ppn > 0) {
          const expectedPPN = Math.round(base * this.options.ppnRate);
          const tolerance = Math.max(expectedPPN * 0.01, 100); // 1% tolerance or Rp 100
          
          if (Math.abs(expectedPPN - ppn) > tolerance) {
            issues.push({
              type: ISSUE_TYPES.PPN_ERROR.code,
              severity: ISSUE_TYPES.PPN_ERROR.severity,
              row: rowNum,
              column: ppnColumn,
              message: `PPN seharusnya ${formatRupiah(expectedPPN)} (${this.options.ppnRate * 100}% dari ${formatRupiah(base)})`,
              expected: expectedPPN,
              actual: ppn,
              autoFixable: true,
              fix: `Ubah ke ${formatRupiah(expectedPPN)}`
            });
          }
        }
      }
    }
    
    return issues;
  }

  /**
   * Detect potential typos in categorical data
   */
  detectTypos(rows, headers, columnAnalysis) {
    const issues = [];
    
    for (const header of headers) {
      const analysis = columnAnalysis[header];
      
      // Only check string columns with reasonable unique values
      if (analysis.detectedType !== DATA_TYPES.STRING) continue;
      if (analysis.uniqueCount < 3 || analysis.uniqueCount > analysis.totalValues * 0.5) continue;
      
      // Get all unique values
      const values = rows.map(r => String(r[header] || '').trim()).filter(v => v);
      const uniqueValues = [...new Set(values)];
      
      // Check for similar values (potential typos)
      for (let i = 0; i < uniqueValues.length; i++) {
        for (let j = i + 1; j < uniqueValues.length; j++) {
          const similarity = stringSimilarity(uniqueValues[i], uniqueValues[j]);
          
          if (similarity >= this.options.similarityThreshold && similarity < 1) {
            // Find which one is more common
            const count1 = values.filter(v => v === uniqueValues[i]).length;
            const count2 = values.filter(v => v === uniqueValues[j]).length;
            
            const [typo, correct] = count1 < count2 
              ? [uniqueValues[i], uniqueValues[j]]
              : [uniqueValues[j], uniqueValues[i]];
            
            // Find rows with the typo
            rows.forEach((row, idx) => {
              if (String(row[header]).trim() === typo) {
                issues.push({
                  type: ISSUE_TYPES.TYPO.code,
                  severity: ISSUE_TYPES.TYPO.severity,
                  row: idx + 2,
                  column: header,
                  value: typo,
                  message: `Kemungkinan typo: "${typo}" → "${correct}"`,
                  suggestion: correct,
                  similarity: Math.round(similarity * 100),
                  autoFixable: true,
                  fix: `Ubah ke "${correct}"`
                });
              }
            });
            
            break; // Only report first match per value
          }
        }
      }
    }
    
    return issues;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // QUALITY SCORING
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(rows, issues, columnAnalysis) {
    const totalCells = rows.length * Object.keys(columnAnalysis).length;
    
    // === COMPLETENESS (30%) ===
    // Persentase sel yang terisi
    let filledCells = 0;
    for (const col of Object.values(columnAnalysis)) {
      filledCells += col.nonEmptyCount;
    }
    const completeness = (filledCells / totalCells) * 100;
    
    // === CONSISTENCY (25%) ===
    // Berdasarkan format consistency
    let consistentColumns = 0;
    for (const col of Object.values(columnAnalysis)) {
      if (col.detectedType !== DATA_TYPES.MIXED) {
        consistentColumns++;
      }
    }
    const consistency = (consistentColumns / Object.keys(columnAnalysis).length) * 100;
    
    // === VALIDITY (25%) ===
    // Berdasarkan jumlah error
    const errorCount = issues.filter(i => 
      [ISSUE_TYPES.INVALID_NIK.code, ISSUE_TYPES.INVALID_NPWP.code, 
       ISSUE_TYPES.INVALID_EMAIL.code, ISSUE_TYPES.CALCULATION_ERROR.code,
       ISSUE_TYPES.PPN_ERROR.code].includes(i.type)
    ).length;
    const validity = Math.max(0, 100 - (errorCount / rows.length) * 100);
    
    // === UNIQUENESS (20%) ===
    // Berdasarkan duplikat
    const duplicateCount = issues.filter(i => i.type === ISSUE_TYPES.DUPLICATE.code).length;
    const uniqueness = ((rows.length - duplicateCount) / rows.length) * 100;
    
    // === OVERALL SCORE ===
    const overall = (completeness * 0.30) + (consistency * 0.25) + 
                   (validity * 0.25) + (uniqueness * 0.20);
    
    // Determine grade
    let grade, gradeLabel;
    if (overall >= QUALITY_THRESHOLDS.EXCELLENT) {
      grade = 'A';
      gradeLabel = 'Excellent';
    } else if (overall >= QUALITY_THRESHOLDS.GOOD) {
      grade = 'B';
      gradeLabel = 'Good';
    } else if (overall >= QUALITY_THRESHOLDS.FAIR) {
      grade = 'C';
      gradeLabel = 'Fair';
    } else if (overall >= QUALITY_THRESHOLDS.POOR) {
      grade = 'D';
      gradeLabel = 'Poor';
    } else {
      grade = 'F';
      gradeLabel = 'Very Poor';
    }

    return {
      overall: Math.round(overall * 100) / 100,
      grade,
      gradeLabel,
      breakdown: {
        completeness: Math.round(completeness * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        validity: Math.round(validity * 100) / 100,
        uniqueness: Math.round(uniqueness * 100) / 100
      },
      thresholds: QUALITY_THRESHOLDS
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate statistics for numeric columns
   */
  generateStatistics(headers, rows, columnAnalysis) {
    const stats = {};
    
    for (const header of headers) {
      const analysis = columnAnalysis[header];
      
      if (analysis.isNumeric) {
        const values = rows.map(r => r[header]);
        stats[header] = {
          ...calculateStats(values),
          type: analysis.detectedType
        };
      }
    }
    
    return stats;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUGGESTION GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate actionable suggestions
   */
  generateSuggestions(issues, columnAnalysis, qualityScore) {
    const suggestions = [];
    
    // Group issues by type
    const issueGroups = this.groupIssuesByType(issues);
    
    // Priority suggestions based on issues
    if (issueGroups[ISSUE_TYPES.DUPLICATE.code]?.length > 0) {
      suggestions.push({
        priority: 'high',
        action: 'remove_duplicates',
        message: `Hapus ${issueGroups[ISSUE_TYPES.DUPLICATE.code].length} baris duplikat`,
        impact: 'Meningkatkan akurasi data',
        autoFixable: true
      });
    }
    
    if (issueGroups[ISSUE_TYPES.EMPTY_ROW.code]?.length > 0) {
      suggestions.push({
        priority: 'medium',
        action: 'remove_empty_rows',
        message: `Hapus ${issueGroups[ISSUE_TYPES.EMPTY_ROW.code].length} baris kosong`,
        impact: 'Membersihkan data',
        autoFixable: true
      });
    }
    
    if (issueGroups[ISSUE_TYPES.WHITESPACE.code]?.length > 0) {
      suggestions.push({
        priority: 'low',
        action: 'trim_whitespace',
        message: `Perbaiki ${issueGroups[ISSUE_TYPES.WHITESPACE.code].length} masalah spasi`,
        impact: 'Standarisasi format',
        autoFixable: true
      });
    }
    
    if (issueGroups[ISSUE_TYPES.PPN_ERROR.code]?.length > 0) {
      suggestions.push({
        priority: 'high',
        action: 'fix_ppn',
        message: `Perbaiki ${issueGroups[ISSUE_TYPES.PPN_ERROR.code].length} perhitungan PPN`,
        impact: 'Akurasi perhitungan pajak',
        autoFixable: true
      });
    }
    
    if (issueGroups[ISSUE_TYPES.CALCULATION_ERROR.code]?.length > 0) {
      suggestions.push({
        priority: 'high',
        action: 'fix_calculations',
        message: `Perbaiki ${issueGroups[ISSUE_TYPES.CALCULATION_ERROR.code].length} error perhitungan`,
        impact: 'Akurasi data finansial',
        autoFixable: true
      });
    }
    
    if (issueGroups[ISSUE_TYPES.FORMAT_INCONSISTENT.code]?.length > 0) {
      suggestions.push({
        priority: 'medium',
        action: 'standardize_format',
        message: `Seragamkan format di ${issueGroups[ISSUE_TYPES.FORMAT_INCONSISTENT.code].length} kolom`,
        impact: 'Konsistensi data',
        autoFixable: false
      });
    }
    
    // Quality score based suggestions
    if (qualityScore.breakdown.completeness < 80) {
      suggestions.push({
        priority: 'medium',
        action: 'fill_missing',
        message: 'Lengkapi data yang kosong',
        impact: `Meningkatkan completeness dari ${qualityScore.breakdown.completeness}%`,
        autoFixable: false
      });
    }
    
    return suggestions.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DEEP ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Perform deep analysis for additional insights
   */
  async performDeepAnalysis(headers, rows, columnAnalysis) {
    const insights = {
      patterns: [],
      correlations: [],
      anomalies: [],
      recommendations: []
    };
    
    // Detect date patterns
    const dateColumns = Object.entries(columnAnalysis)
      .filter(([, v]) => v.isDate)
      .map(([k]) => k);
    
    if (dateColumns.length > 0) {
      insights.patterns.push({
        type: 'date_column',
        message: `Ditemukan ${dateColumns.length} kolom tanggal: ${dateColumns.join(', ')}`,
        suggestion: 'Dapat digunakan untuk analisis trend/time series'
      });
    }
    
    // Detect currency columns
    const currencyColumns = Object.entries(columnAnalysis)
      .filter(([, v]) => v.detectedType === DATA_TYPES.CURRENCY)
      .map(([k]) => k);
    
    if (currencyColumns.length > 0) {
      const totals = {};
      for (const col of currencyColumns) {
        const values = rows.map(r => parseNumber(r[col])).filter(v => v !== null);
        const sum = values.reduce((a, b) => a + b, 0);
        totals[col] = sum;
      }
      
      insights.patterns.push({
        type: 'financial_data',
        message: 'Data mengandung informasi finansial',
        columns: currencyColumns,
        totals,
        suggestion: 'Pertimbangkan untuk menambahkan sheet ringkasan keuangan'
      });
    }
    
    // Detect identifier columns
    const idColumns = Object.entries(columnAnalysis)
      .filter(([, v]) => v.isIdentifier)
      .map(([k, v]) => ({ column: k, type: v.detectedType }));
    
    if (idColumns.length > 0) {
      insights.patterns.push({
        type: 'identifier_columns',
        message: 'Ditemukan kolom identifikasi Indonesia',
        columns: idColumns
      });
    }
    
    // Generate final recommendations
    if (insights.patterns.length > 0) {
      insights.recommendations.push({
        title: 'Optimasi Struktur Data',
        details: 'Pertimbangkan untuk memisahkan data ke dalam sheet terpisah berdasarkan kategori'
      });
    }
    
    return insights;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  groupIssuesByType(issues) {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {});
  }

  groupIssuesBySeverity(issues) {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});
  }

  /**
   * Get analysis result
   */
  getResult() {
    return this.analysisResult;
  }
}

// Create singleton
export const dataAnalyzer = new DataAnalyzer();

export default {
  DataAnalyzer,
  dataAnalyzer
};
