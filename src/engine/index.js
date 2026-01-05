// ═══════════════════════════════════════════════════════════════════════════
// ENGINE INDEX - Export all engine modules
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

// Core Engines
export { DataAnalyzer, dataAnalyzer } from './analyzer.js';
export { DataCleaner, dataCleaner } from './cleaner.js';
export { ExcelFormatter, excelFormatter, STYLE_PRESETS, NUMBER_FORMATS } from './formatter.js';
export { DataConverter, dataConverter } from './converter.js';
export { ReportGenerator, reportGenerator } from './reporter.js';

// Re-export for convenience
import { DataAnalyzer, dataAnalyzer } from './analyzer.js';
import { DataCleaner, dataCleaner } from './cleaner.js';
import { ExcelFormatter, excelFormatter } from './formatter.js';
import { DataConverter, dataConverter } from './converter.js';
import { ReportGenerator, reportGenerator } from './reporter.js';

/**
 * 🚀 Quick Analysis - One-liner untuk analisis cepat
 */
export async function quickAnalyze(parsedData, options = {}) {
  const analyzer = new DataAnalyzer(options);
  return analyzer.analyze(parsedData);
}

/**
 * 🧹 Quick Clean - One-liner untuk pembersihan cepat
 */
export async function quickClean(parsedData, options = {}) {
  return DataCleaner.quickClean(parsedData);
}

/**
 * 🎨 Quick Format - One-liner untuk formatting cepat
 */
export async function quickFormat(parsedData, columnAnalysis = null, stylePreset = 'professional') {
  const formatter = new ExcelFormatter({ stylePreset });
  return formatter.format(parsedData, columnAnalysis);
}

/**
 * 🔄 Quick Convert - One-liner untuk konversi cepat
 */
export async function quickConvert(parsedData, targetFormat, sheetName = null) {
  return DataConverter.quickConvert(parsedData, targetFormat, sheetName);
}

/**
 * 📊 Full Pipeline - Analisis + Clean + Format dalam satu fungsi
 */
export async function fullPipeline(parsedData, options = {}) {
  const {
    clean = true,
    format = true,
    stylePreset = 'professional',
    generateReport = true
  } = options;

  // 1. Analyze
  const analyzer = new DataAnalyzer();
  const analysis = await analyzer.analyze(parsedData);
  
  let processedData = parsedData;
  
  // 2. Clean (if enabled)
  if (clean) {
    const cleaner = new DataCleaner();
    const cleanResult = await cleaner.clean(processedData);
    processedData = cleanResult.data;
  }
  
  // 3. Format (if enabled)
  let formattedBuffer = null;
  if (format) {
    const formatter = new ExcelFormatter({ stylePreset });
    formattedBuffer = await formatter.format(processedData, analysis.columnAnalysis);
  }
  
  // 4. Generate Report (if enabled)
  let reportBuffer = null;
  if (generateReport) {
    const reporter = new ReportGenerator();
    reportBuffer = await reporter.generateAnalysisReport(analysis, processedData);
  }
  
  return {
    analysis,
    processedData,
    formattedBuffer,
    reportBuffer
  };
}

export default {
  // Classes
  DataAnalyzer,
  DataCleaner,
  ExcelFormatter,
  DataConverter,
  ReportGenerator,
  
  // Singletons
  dataAnalyzer,
  dataCleaner,
  excelFormatter,
  dataConverter,
  reportGenerator,
  
  // Quick functions
  quickAnalyze,
  quickClean,
  quickFormat,
  quickConvert,
  fullPipeline
};
