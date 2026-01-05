// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTIONPARSER.JS - 🧠 Natural Language Instruction Parser
// Excel Intelligence Bot - 2025 Edition
// Mengubah instruksi bahasa natural menjadi struktur data Excel
// ═══════════════════════════════════════════════════════════════════════════

import { NLP_KEYWORDS, DATA_TYPES } from '../../utils/constants.js';
import { normalizeString, generateId } from '../../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// INDONESIAN NLP PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

const PATTERNS = {
  // Column extraction patterns
  COLUMN_PATTERNS: [
    /(?:kolom|column|field|dengan)\s*:?\s*([^.!?\n]+)/gi,
    /(?:berisi|berupa|mengandung|terdiri dari)\s*:?\s*([^.!?\n]+)/gi,
    /(?:yaitu|adalah|antara lain)\s*:?\s*([^.!?\n]+)/gi
  ],
  
  // Row count patterns
  ROW_COUNT_PATTERNS: [
    /(\d+)\s*(?:baris|row|data|record|item|entri)/gi,
    /(?:baris|row|data|record|item|entri)\s*(?:sebanyak)?\s*(\d+)/gi
  ],
  
  // Table/Template type patterns
  TABLE_TYPE_PATTERNS: [
    /(?:tabel|table|template|format)\s+(\w+)/gi,
    /(\w+)\s+(?:tabel|table|template)/gi
  ],
  
  // Separator patterns
  SEPARATORS: /[,;،、]|\s+dan\s+|\s+and\s+|\s+serta\s+|\s+dengan\s+/gi,
  
  // Number format patterns
  FORMAT_PATTERNS: {
    currency: /(?:rupiah|idr|uang|currency|mata\s*uang|harga|gaji|nominal)/gi,
    percentage: /(?:persen|persentase|percentage|%)/gi,
    date: /(?:tanggal|date|tgl|waktu)/gi,
    phone: /(?:telepon|telp|hp|phone|handphone|nomor\s*hp)/gi,
    email: /(?:email|e-mail|surel)/gi,
    number: /(?:angka|number|jumlah|qty|quantity|kuantitas)/gi
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN DEFINITIONS DATABASE
// ─────────────────────────────────────────────────────────────────────────────

const COLUMN_DATABASE = {
  // Person/Employee
  'nama': { type: 'string', width: 25, sample: 'Budi Santoso' },
  'name': { type: 'string', width: 25, sample: 'John Doe' },
  'nama lengkap': { type: 'string', width: 30, sample: 'Budi Santoso Wijaya' },
  'nama karyawan': { type: 'string', width: 25, sample: 'Dewi Lestari' },
  'nama pegawai': { type: 'string', width: 25, sample: 'Ahmad Hidayat' },
  
  // ID/Identifier
  'nik': { type: 'nik', width: 20, sample: '3201012345678901' },
  'npwp': { type: 'npwp', width: 20, sample: '12.345.678.9-012.000' },
  'no ktp': { type: 'nik', width: 20, sample: '3201012345678901' },
  'id': { type: 'string', width: 10, sample: 'EMP001' },
  'nip': { type: 'string', width: 20, sample: '199001012020011001' },
  'no': { type: 'number', width: 5, sample: 1 },
  'nomor': { type: 'number', width: 5, sample: 1 },
  
  // Contact
  'email': { type: 'email', width: 30, sample: 'email@example.com' },
  'telepon': { type: 'phone', width: 15, sample: '08123456789' },
  'telp': { type: 'phone', width: 15, sample: '08123456789' },
  'hp': { type: 'phone', width: 15, sample: '08123456789' },
  'phone': { type: 'phone', width: 15, sample: '+6281234567890' },
  'whatsapp': { type: 'phone', width: 15, sample: '08123456789' },
  'alamat': { type: 'string', width: 40, sample: 'Jl. Contoh No. 123, Jakarta' },
  'address': { type: 'string', width: 40, sample: 'Jl. Sample Street No. 456' },
  
  // Financial
  'gaji': { type: 'currency', width: 15, sample: 5000000 },
  'gaji pokok': { type: 'currency', width: 15, sample: 5000000 },
  'salary': { type: 'currency', width: 15, sample: 5000000 },
  'harga': { type: 'currency', width: 15, sample: 150000 },
  'price': { type: 'currency', width: 15, sample: 150000 },
  'harga satuan': { type: 'currency', width: 15, sample: 150000 },
  'unit price': { type: 'currency', width: 15, sample: 150000 },
  'subtotal': { type: 'currency', width: 15, sample: 1500000, formula: 'qty*price' },
  'total': { type: 'currency', width: 15, sample: 1650000 },
  'grand total': { type: 'currency', width: 15, sample: 1650000 },
  'ppn': { type: 'currency', width: 12, sample: 165000 },
  'pajak': { type: 'currency', width: 12, sample: 165000 },
  'tax': { type: 'currency', width: 12, sample: 165000 },
  'diskon': { type: 'currency', width: 12, sample: 50000 },
  'discount': { type: 'currency', width: 12, sample: 50000 },
  'tunjangan': { type: 'currency', width: 15, sample: 500000 },
  'bonus': { type: 'currency', width: 15, sample: 1000000 },
  'potongan': { type: 'currency', width: 15, sample: 200000 },
  'deduction': { type: 'currency', width: 15, sample: 200000 },
  'gaji bersih': { type: 'currency', width: 15, sample: 4800000 },
  'net salary': { type: 'currency', width: 15, sample: 4800000 },
  
  // Quantity
  'jumlah': { type: 'number', width: 10, sample: 10 },
  'qty': { type: 'number', width: 8, sample: 5 },
  'quantity': { type: 'number', width: 10, sample: 5 },
  'kuantitas': { type: 'number', width: 10, sample: 5 },
  'stok': { type: 'number', width: 10, sample: 100 },
  'stock': { type: 'number', width: 10, sample: 100 },
  
  // Date/Time
  'tanggal': { type: 'date', width: 12, sample: '2025-01-15' },
  'date': { type: 'date', width: 12, sample: '2025-01-15' },
  'tgl': { type: 'date', width: 12, sample: '2025-01-15' },
  'tanggal lahir': { type: 'date', width: 12, sample: '1990-05-20' },
  'tanggal masuk': { type: 'date', width: 12, sample: '2020-01-02' },
  'tanggal bergabung': { type: 'date', width: 12, sample: '2020-01-02' },
  'tanggal order': { type: 'date', width: 12, sample: '2025-01-15' },
  'tanggal transaksi': { type: 'date', width: 12, sample: '2025-01-15' },
  'jatuh tempo': { type: 'date', width: 12, sample: '2025-02-15' },
  'due date': { type: 'date', width: 12, sample: '2025-02-15' },
  'bulan': { type: 'string', width: 12, sample: 'Januari' },
  'tahun': { type: 'number', width: 8, sample: 2025 },
  
  // Product/Item
  'produk': { type: 'string', width: 30, sample: 'Laptop Asus' },
  'product': { type: 'string', width: 30, sample: 'Laptop Asus' },
  'nama produk': { type: 'string', width: 30, sample: 'Laptop Gaming' },
  'nama barang': { type: 'string', width: 30, sample: 'Keyboard Mechanical' },
  'item': { type: 'string', width: 30, sample: 'Mouse Wireless' },
  'barang': { type: 'string', width: 30, sample: 'Monitor LED 24"' },
  'sku': { type: 'string', width: 15, sample: 'SKU-001' },
  'kode barang': { type: 'string', width: 15, sample: 'BRG-001' },
  'kode produk': { type: 'string', width: 15, sample: 'PRD-001' },
  'kategori': { type: 'string', width: 15, sample: 'Elektronik' },
  'category': { type: 'string', width: 15, sample: 'Electronics' },
  'satuan': { type: 'string', width: 8, sample: 'Pcs' },
  'unit': { type: 'string', width: 8, sample: 'Pcs' },
  
  // Status
  'status': { type: 'string', width: 12, sample: 'Aktif' },
  'keterangan': { type: 'string', width: 40, sample: 'Catatan tambahan' },
  'description': { type: 'string', width: 40, sample: 'Description text' },
  'deskripsi': { type: 'string', width: 40, sample: 'Deskripsi produk' },
  'notes': { type: 'string', width: 40, sample: 'Additional notes' },
  'catatan': { type: 'string', width: 40, sample: 'Catatan penting' },
  
  // Organization
  'departemen': { type: 'string', width: 15, sample: 'IT' },
  'department': { type: 'string', width: 15, sample: 'IT' },
  'divisi': { type: 'string', width: 15, sample: 'Engineering' },
  'jabatan': { type: 'string', width: 20, sample: 'Software Engineer' },
  'position': { type: 'string', width: 20, sample: 'Manager' },
  'perusahaan': { type: 'string', width: 25, sample: 'PT Maju Jaya' },
  'company': { type: 'string', width: 25, sample: 'PT Example Corp' },
  
  // Percentage
  'persentase': { type: 'percentage', width: 10, sample: 10 },
  'persen': { type: 'percentage', width: 10, sample: 10 },
  'percentage': { type: 'percentage', width: 10, sample: 10 },
  'rate': { type: 'percentage', width: 10, sample: 11 },
  
  // Attendance
  'hadir': { type: 'number', width: 8, sample: 22 },
  'sakit': { type: 'number', width: 8, sample: 1 },
  'izin': { type: 'number', width: 8, sample: 1 },
  'alpha': { type: 'number', width: 8, sample: 0 },
  'cuti': { type: 'number', width: 8, sample: 2 },
  'jam masuk': { type: 'string', width: 10, sample: '08:00' },
  'jam keluar': { type: 'string', width: 10, sample: '17:00' },
  'lembur': { type: 'number', width: 8, sample: 5 }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PARSER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class InstructionParser {
  constructor(options = {}) {
    this.options = {
      language: options.language || 'id',
      generateSampleData: options.generateSampleData ?? true,
      sampleRowCount: options.sampleRowCount || 5,
      ...options
    };
    
    this.columnDatabase = { ...COLUMN_DATABASE, ...options.customColumns };
  }

  /**
   * 🧠 MAIN PARSE METHOD
   * Parse natural language instruction ke struktur Excel
   */
  async parse(instruction) {
    if (!instruction || typeof instruction !== 'string') {
      throw new Error('Instruksi harus berupa teks');
    }

    const cleanInstruction = normalizeString(instruction).toLowerCase();
    
    // 1. Detect intent (create table, analyze, etc)
    const intent = this.detectIntent(cleanInstruction);
    
    // 2. Extract columns
    const columns = this.extractColumns(cleanInstruction);
    
    // 3. Extract row count
    const rowCount = this.extractRowCount(cleanInstruction);
    
    // 4. Detect table type/template
    const tableType = this.detectTableType(cleanInstruction);
    
    // 5. Extract formatting preferences
    const formatting = this.extractFormatting(cleanInstruction);
    
    // 6. Build result
    const result = {
      intent,
      tableType,
      columns,
      rowCount: rowCount || this.options.sampleRowCount,
      formatting,
      originalInstruction: instruction
    };
    
    // 7. Generate parsed data if requested
    if (this.options.generateSampleData) {
      result.parsedData = this.generateParsedData(result);
    }
    
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTENT DETECTION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Detect user intent from instruction
   */
  detectIntent(instruction) {
    const intents = {
      create: ['buat', 'buatkan', 'create', 'generate', 'bikin', 'tambah', 'new'],
      analyze: ['analisis', 'analyze', 'cek', 'check', 'periksa', 'review'],
      convert: ['convert', 'ubah', 'konversi', 'jadikan', 'export', 'transform'],
      clean: ['bersihkan', 'clean', 'hapus', 'remove', 'delete', 'clear'],
      format: ['format', 'style', 'styling', 'rapikan', 'beautify']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(kw => instruction.includes(kw))) {
        return intent;
      }
    }
    
    return 'create'; // Default
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COLUMN EXTRACTION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Extract columns from instruction
   */
  extractColumns(instruction) {
    const columns = [];
    const foundColumnNames = new Set();
    
    // Method 1: Direct pattern matching
    for (const pattern of PATTERNS.COLUMN_PATTERNS) {
      let match;
      while ((match = pattern.exec(instruction)) !== null) {
        const columnPart = match[1];
        const extracted = this.parseColumnList(columnPart);
        extracted.forEach(col => {
          if (!foundColumnNames.has(col.name.toLowerCase())) {
            columns.push(col);
            foundColumnNames.add(col.name.toLowerCase());
          }
        });
      }
    }
    
    // Method 2: Check against column database
    for (const [colName, colDef] of Object.entries(this.columnDatabase)) {
      if (instruction.includes(colName) && !foundColumnNames.has(colName)) {
        columns.push({
          name: this.toTitleCase(colName),
          ...colDef,
          source: 'database'
        });
        foundColumnNames.add(colName);
      }
    }
    
    // Method 3: Extract from common patterns
    if (columns.length === 0) {
      const commonPatterns = this.extractCommonPatterns(instruction);
      columns.push(...commonPatterns);
    }
    
    // Default columns if none found
    if (columns.length === 0) {
      columns.push(
        { name: 'No', type: 'number', width: 5, sample: 1 },
        { name: 'Nama', type: 'string', width: 25, sample: 'Data 1' },
        { name: 'Keterangan', type: 'string', width: 40, sample: 'Deskripsi' }
      );
    }
    
    return columns;
  }

  /**
   * Parse column list from text
   */
  parseColumnList(text) {
    const columns = [];
    
    // Split by separators
    const parts = text.split(PATTERNS.SEPARATORS)
      .map(p => normalizeString(p))
      .filter(p => p && p.length > 1);
    
    for (const part of parts) {
      const colName = part.toLowerCase();
      const colDef = this.columnDatabase[colName] || this.guessColumnType(colName);
      
      columns.push({
        name: this.toTitleCase(part),
        ...colDef,
        source: this.columnDatabase[colName] ? 'database' : 'guessed'
      });
    }
    
    return columns;
  }

  /**
   * Guess column type from name
   */
  guessColumnType(name) {
    const nameLower = name.toLowerCase();
    
    // Check format patterns
    for (const [type, pattern] of Object.entries(PATTERNS.FORMAT_PATTERNS)) {
      if (pattern.test(nameLower)) {
        return {
          type,
          width: 15,
          sample: this.getSampleForType(type)
        };
      }
    }
    
    // Check partial matches with database
    for (const [dbName, dbDef] of Object.entries(this.columnDatabase)) {
      if (nameLower.includes(dbName) || dbName.includes(nameLower)) {
        return { ...dbDef };
      }
    }
    
    // Default to string
    return {
      type: 'string',
      width: 20,
      sample: 'Sample'
    };
  }

  /**
   * Get sample value for type
   */
  getSampleForType(type) {
    const samples = {
      string: 'Sample Text',
      number: 100,
      currency: 1000000,
      percentage: 10,
      date: '2025-01-15',
      email: 'sample@email.com',
      phone: '08123456789',
      nik: '3201012345678901',
      npwp: '12.345.678.9-012.000'
    };
    return samples[type] || 'Sample';
  }

  /**
   * Extract common patterns (invoice, karyawan, etc)
   */
  extractCommonPatterns(instruction) {
    const columns = [];
    
    if (instruction.includes('karyawan') || instruction.includes('pegawai') || instruction.includes('employee')) {
      columns.push(
        { name: 'No', type: 'number', width: 5, sample: 1 },
        { name: 'Nama', type: 'string', width: 25, sample: 'Budi Santoso' },
        { name: 'NIK', type: 'nik', width: 20, sample: '3201012345678901' },
        { name: 'Jabatan', type: 'string', width: 20, sample: 'Staff' },
        { name: 'Gaji', type: 'currency', width: 15, sample: 5000000 }
      );
    }
    
    if (instruction.includes('invoice') || instruction.includes('faktur')) {
      columns.push(
        { name: 'No', type: 'number', width: 5, sample: 1 },
        { name: 'Item', type: 'string', width: 30, sample: 'Produk A' },
        { name: 'Qty', type: 'number', width: 8, sample: 2 },
        { name: 'Harga', type: 'currency', width: 15, sample: 500000 },
        { name: 'Subtotal', type: 'currency', width: 15, sample: 1000000 }
      );
    }
    
    if (instruction.includes('penjualan') || instruction.includes('sales')) {
      columns.push(
        { name: 'Tanggal', type: 'date', width: 12, sample: '2025-01-15' },
        { name: 'Produk', type: 'string', width: 25, sample: 'Produk X' },
        { name: 'Jumlah', type: 'number', width: 10, sample: 5 },
        { name: 'Harga', type: 'currency', width: 15, sample: 100000 },
        { name: 'Total', type: 'currency', width: 15, sample: 500000 }
      );
    }
    
    return columns;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OTHER EXTRACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Extract row count from instruction
   */
  extractRowCount(instruction) {
    for (const pattern of PATTERNS.ROW_COUNT_PATTERNS) {
      const match = pattern.exec(instruction);
      if (match) {
        const count = parseInt(match[1] || match[2]);
        if (count > 0 && count <= 1000) {
          return count;
        }
      }
    }
    return null;
  }

  /**
   * Detect table type
   */
  detectTableType(instruction) {
    const types = {
      invoice: ['invoice', 'faktur', 'tagihan'],
      payroll: ['payroll', 'gaji', 'salary', 'slip gaji'],
      inventory: ['inventory', 'inventaris', 'stok', 'stock', 'barang'],
      sales: ['sales', 'penjualan', 'laporan penjualan'],
      attendance: ['absensi', 'attendance', 'kehadiran', 'hadir'],
      expense: ['expense', 'pengeluaran', 'biaya'],
      budget: ['budget', 'anggaran'],
      employee: ['karyawan', 'pegawai', 'employee', 'staff'],
      customer: ['customer', 'pelanggan', 'client'],
      product: ['produk', 'product', 'barang']
    };
    
    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(kw => instruction.includes(kw))) {
        return type;
      }
    }
    
    return 'general';
  }

  /**
   * Extract formatting preferences
   */
  extractFormatting(instruction) {
    const formatting = {
      style: 'professional',
      currency: 'IDR',
      dateFormat: 'DD/MM/YYYY'
    };
    
    // Style detection
    if (instruction.includes('modern')) formatting.style = 'modern';
    if (instruction.includes('minimal')) formatting.style = 'minimal';
    if (instruction.includes('colorful') || instruction.includes('warna')) formatting.style = 'colorful';
    if (instruction.includes('dark') || instruction.includes('gelap')) formatting.style = 'dark';
    
    // Currency detection
    if (instruction.includes('dollar') || instruction.includes('usd')) formatting.currency = 'USD';
    if (instruction.includes('euro') || instruction.includes('eur')) formatting.currency = 'EUR';
    
    return formatting;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate parsed data from parse result
   */
  generateParsedData(parseResult) {
    const { columns, rowCount } = parseResult;
    const headers = columns.map(c => c.name);
    const rows = [];
    
    for (let i = 0; i < rowCount; i++) {
      const row = { _rowIndex: i + 2 };
      
      for (const col of columns) {
        row[col.name] = this.generateSampleValue(col, i);
      }
      
      rows.push(row);
    }
    
    const sheetName = 'Sheet1';
    
    return {
      type: 'generated',
      sheetNames: [sheetName],
      sheets: {
        [sheetName]: {
          name: sheetName,
          headers,
          rows,
          rawData: [headers, ...rows.map(r => headers.map(h => r[h]))],
          totalRows: rows.length,
          totalColumns: headers.length,
          columnDefinitions: columns
        }
      },
      activeSheet: sheetName,
      totalSheets: 1,
      metadata: {
        source: 'instruction',
        generatedAt: new Date().toISOString(),
        instruction: parseResult.originalInstruction
      }
    };
  }

  /**
   * Generate sample value for column
   */
  generateSampleValue(column, rowIndex) {
    const { type, sample } = column;
    const colName = column.name.toLowerCase();
    
    // Auto-increment for No/ID columns
    if (colName === 'no' || colName === 'nomor' || colName === 'id') {
      return rowIndex + 1;
    }
    
    switch (type) {
      case 'number':
        return typeof sample === 'number' ? sample + rowIndex : rowIndex + 1;
      
      case 'currency':
        const baseValue = typeof sample === 'number' ? sample : 1000000;
        return baseValue + (rowIndex * 100000);
      
      case 'percentage':
        return sample || 10;
      
      case 'date':
        const baseDate = new Date('2025-01-15');
        baseDate.setDate(baseDate.getDate() + rowIndex);
        return baseDate.toISOString().split('T')[0];
      
      case 'string':
        if (colName.includes('nama')) {
          const names = ['Budi Santoso', 'Dewi Lestari', 'Ahmad Wijaya', 'Siti Rahayu', 'Eko Prasetyo'];
          return names[rowIndex % names.length];
        }
        return sample || `${column.name} ${rowIndex + 1}`;
      
      case 'email':
        const emailNames = ['budi', 'dewi', 'ahmad', 'siti', 'eko'];
        return `${emailNames[rowIndex % emailNames.length]}@email.com`;
      
      case 'phone':
        return `0812345678${rowIndex}`;
      
      default:
        return sample || `Value ${rowIndex + 1}`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convert to Title Case
   */
  toTitleCase(str) {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK PARSE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quick parse instruction
 */
export async function parseInstruction(instruction, options = {}) {
  const parser = new InstructionParser(options);
  return parser.parse(instruction);
}

// Create singleton
export const instructionParser = new InstructionParser();

export default {
  InstructionParser,
  parseInstruction,
  instructionParser,
  COLUMN_DATABASE
};
