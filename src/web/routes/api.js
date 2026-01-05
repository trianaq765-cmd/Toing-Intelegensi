// ═══════════════════════════════════════════════════════════════════════════
// API.JS - REST API Endpoints
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Engine imports
import { fileParser } from '../../utils/fileParser.js';
import { DataAnalyzer } from '../../engine/analyzer.js';
import { DataCleaner } from '../../engine/cleaner.js';
import { DataConverter } from '../../engine/converter.js';
import { ExcelFormatter } from '../../engine/formatter.js';
import { ReportGenerator } from '../../engine/reporter.js';
import { TemplateEngine, getTemplateList } from '../../engine/generators/templateEngine.js';
import { smartCreate } from '../../engine/generators/index.js';
import { BOT_CONFIG } from '../../utils/constants.js';
import { formatFileSize, generateId } from '../../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// MULTER CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const TEMP_DIR = path.join(__dirname, '../../../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${generateId('upload')}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file tidak didukung. Gunakan: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: BOT_CONFIG.MAX_FILE_SIZE
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    service: 'Excel Intelligence Bot API'
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ANALYZE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/analyze', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const { deepAnalysis = 'true' } = req.body;
    
    // Parse file
    const parsedData = await fileParser.parse(req.file.path, req.file.originalname);
    
    // Analyze
    const analyzer = new DataAnalyzer({ deepAnalysis: deepAnalysis === 'true' });
    const result = await analyzer.analyze(parsedData);

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      filename: req.file.originalname,
      fileSize: formatFileSize(req.file.size),
      processingTime: `${Date.now() - startTime}ms`,
      analysis: result
    });

  } catch (error) {
    // Cleanup on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('API Analyze Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CLEAN ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/clean', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const {
      mode = 'standard',
      removeDuplicates = 'true',
      removeEmptyRows = 'true',
      trimWhitespace = 'true',
      fixCalculations = 'true',
      formatOutput = 'false'
    } = req.body;

    // Parse file
    const parsedData = await fileParser.parse(req.file.path, req.file.originalname);

    // Configure cleaner
    let cleanerOptions;
    switch (mode) {
      case 'quick':
        cleanerOptions = { removeDuplicates: true, removeEmptyRows: true, trimWhitespace: true };
        break;
      case 'financial':
        cleanerOptions = { removeDuplicates: true, removeEmptyRows: true, trimWhitespace: true, standardizeDates: true, fixCalculations: true };
        break;
      case 'full':
        cleanerOptions = { removeDuplicates: true, removeEmptyRows: true, trimWhitespace: true, normalizeCase: true, standardizeDates: true, standardizePhones: true, fixCalculations: true, fixTypos: true };
        break;
      default:
        cleanerOptions = {
          removeDuplicates: removeDuplicates === 'true',
          removeEmptyRows: removeEmptyRows === 'true',
          trimWhitespace: trimWhitespace === 'true',
          fixCalculations: fixCalculations === 'true'
        };
    }

    // Clean
    const cleaner = new DataCleaner(cleanerOptions);
    const cleanResult = await cleaner.clean(parsedData);

    // Generate output
    let outputBuffer;
    if (formatOutput === 'true') {
      const formatter = new ExcelFormatter({ stylePreset: 'professional' });
      outputBuffer = await formatter.format(cleanResult.data);
    } else {
      const converter = new DataConverter();
      const result = await converter.convert(cleanResult.data, 'xlsx');
      outputBuffer = result.content;
    }

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    // Send file
    const outputFilename = req.file.originalname.replace(/(\.[^/.]+)$/, '_cleaned$1');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('X-Processing-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-Rows-Removed', cleanResult.summary.rowsRemoved);
    res.send(outputBuffer);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('API Clean Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CONVERT ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/convert', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const { 
      format = 'csv',
      sqlTable = 'data_table',
      sqlDialect = 'mysql'
    } = req.body;

    // Parse file
    const parsedData = await fileParser.parse(req.file.path, req.file.originalname);

    // Convert
    const converter = new DataConverter({
      sqlTableName: sqlTable,
      sqlDialect,
      prettyPrint: true,
      htmlStyles: true
    });
    
    const result = await converter.convert(parsedData, format);

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    // Prepare output
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const outputFilename = `${baseName}${result.extension}`;

    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('X-Processing-Time', `${Date.now() - startTime}ms`);

    if (typeof result.content === 'string') {
      res.send(result.content);
    } else {
      res.send(result.content);
    }

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('API Convert Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/create', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      input,
      type = 'instruction', // 'instruction' or 'text'
      rowCount = 5,
      stylePreset = 'professional'
    } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input diperlukan' });
    }

    // Smart create
    const result = await smartCreate(input, {
      generateSampleData: true,
      sampleRowCount: parseInt(rowCount)
    });

    if (!result.parsedData) {
      return res.status(400).json({ error: 'Gagal menginterpretasi input' });
    }

    // Format output
    const formatter = new ExcelFormatter({ stylePreset });
    const buffer = await formatter.format(result.parsedData);

    const filename = `created_${Date.now()}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('X-Processing-Time', `${Date.now() - startTime}ms`);
    res.send(buffer);

  } catch (error) {
    console.error('API Create Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/templates', (req, res) => {
  const templates = getTemplateList();
  res.json({
    success: true,
    count: templates.length,
    templates
  });
});

router.get('/templates/:type', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { type } = req.params;
    const { 
      company,
      withSample = 'true'
    } = req.query;

    const options = {
      includeSampleData: withSample === 'true',
      includeFormulas: true
    };

    if (company) {
      options.companyName = company;
    }

    const engine = new TemplateEngine(options);
    const result = await engine.generate(type, options);

    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('X-Processing-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-Template-Type', type);
    res.send(result.buffer);

  } catch (error) {
    console.error('API Template Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/format', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const { 
      style = 'professional',
      addFormulas = 'true'
    } = req.body;

    // Parse file
    const parsedData = await fileParser.parse(req.file.path, req.file.originalname);

    // Analyze for column types
    const analyzer = new DataAnalyzer({ deepAnalysis: false });
    const analysis = await analyzer.analyze(parsedData);

    // Format
    const formatter = new ExcelFormatter({
      stylePreset: style,
      addFormulas: addFormulas === 'true'
    });
    const buffer = await formatter.format(parsedData, analysis.columnAnalysis);

    // Cleanup
    fs.unlinkSync(req.file.path);

    const outputFilename = req.file.originalname.replace(/(\.[^/.]+)$/, '_formatted$1');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('X-Processing-Time', `${Date.now() - startTime}ms`);
    res.send(buffer);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('API Format Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORT ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/report', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const { 
      company = '',
      language = 'id'
    } = req.body;

    // Parse file
    const parsedData = await fileParser.parse(req.file.path, req.file.originalname);

    // Analyze
    const analyzer = new DataAnalyzer({ deepAnalysis: true });
    const analysis = await analyzer.analyze(parsedData);

    // Generate report
    const reporter = new ReportGenerator({
      companyName: company,
      language,
      includeRawData: true
    });
    const buffer = await reporter.generateAnalysisReport(analysis, parsedData);

    // Cleanup
    fs.unlinkSync(req.file.path);

    const outputFilename = req.file.originalname.replace(/(\.[^/.]+)$/, '_report$1');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('X-Processing-Time', `${Date.now() - startTime}ms`);
    res.send(buffer);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('API Report Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLE PRESETS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

router.get('/styles', (req, res) => {
  const { STYLE_PRESETS } = require('../../engine/formatter.js');
  
  const styles = Object.entries(STYLE_PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name
  }));

  res.json({
    success: true,
    styles
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────

router.use((error, req, res, next) => {
  console.error('API Error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: `File terlalu besar. Maksimum: ${formatFileSize(BOT_CONFIG.MAX_FILE_SIZE)}` 
      });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: error.message || 'Internal server error' });
});

export default router;
