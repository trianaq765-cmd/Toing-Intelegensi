// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATEENGINE.JS - Professional Template Generator
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import ExcelJS from 'exceljs';
import { 
  formatRupiah, 
  formatDate, 
  formatNumber,
  calculatePPN,
  generateId 
} from '../../utils/helpers.js';
import { TAX_RATES, TEMPLATE_TYPES } from '../../utils/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_CONFIGS = {
  invoice: {
    name: 'Invoice / Faktur',
    description: 'Template faktur penjualan dengan perhitungan PPN otomatis',
    sheets: ['Invoice'],
    hasCompanyHeader: true,
    hasFormulas: true
  },
  payroll: {
    name: 'Slip Gaji',
    description: 'Template slip gaji karyawan dengan komponen lengkap',
    sheets: ['Payroll'],
    hasCompanyHeader: true,
    hasFormulas: true
  },
  inventory: {
    name: 'Daftar Inventaris',
    description: 'Template untuk tracking stok barang',
    sheets: ['Inventory'],
    hasCompanyHeader: false,
    hasFormulas: true
  },
  sales_report: {
    name: 'Laporan Penjualan',
    description: 'Template laporan penjualan harian/bulanan',
    sheets: ['Daily Sales', 'Summary'],
    hasCompanyHeader: true,
    hasFormulas: true
  },
  budget: {
    name: 'Anggaran',
    description: 'Template perencanaan anggaran',
    sheets: ['Budget'],
    hasCompanyHeader: true,
    hasFormulas: true
  },
  attendance: {
    name: 'Absensi',
    description: 'Template rekap absensi karyawan',
    sheets: ['Attendance'],
    hasCompanyHeader: true,
    hasFormulas: true
  },
  expense: {
    name: 'Laporan Pengeluaran',
    description: 'Template reimbursement dan pengeluaran',
    sheets: ['Expenses'],
    hasCompanyHeader: true,
    hasFormulas: true
  },
  purchase_order: {
    name: 'Purchase Order',
    description: 'Template surat pesanan pembelian',
    sheets: ['PO'],
    hasCompanyHeader: true,
    hasFormulas: true
  },
  quotation: {
    name: 'Penawaran Harga',
    description: 'Template surat penawaran harga',
    sheets: ['Quotation'],
    hasCompanyHeader: true,
    hasFormulas: true
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEMPLATE ENGINE CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class TemplateEngine {
  constructor(options = {}) {
    this.options = {
      companyName: options.companyName || 'PT. Nama Perusahaan',
      companyAddress: options.companyAddress || 'Jl. Contoh No. 123, Jakarta',
      companyPhone: options.companyPhone || '021-12345678',
      companyEmail: options.companyEmail || 'info@company.com',
      logo: options.logo || null,
      primaryColor: options.primaryColor || '2F5496',
      secondaryColor: options.secondaryColor || '5B9BD5',
      ppnRate: options.ppnRate || TAX_RATES.PPN,
      includeFormulas: options.includeFormulas ?? true,
      includeSampleData: options.includeSampleData ?? true,
      ...options
    };
  }

  /**
   * 📋 GET AVAILABLE TEMPLATES
   */
  getAvailableTemplates() {
    return Object.entries(TEMPLATE_CONFIGS).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * 🏭 GENERATE TEMPLATE
   */
  async generate(templateType, customOptions = {}) {
    const opts = { ...this.options, ...customOptions };
    const config = TEMPLATE_CONFIGS[templateType];
    
    if (!config) {
      throw new Error(`Template "${templateType}" tidak ditemukan. Template tersedia: ${Object.keys(TEMPLATE_CONFIGS).join(', ')}`);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Excel Intelligence Bot';
    workbook.created = new Date();

    // Generate based on template type
    switch (templateType) {
      case 'invoice':
        await this.generateInvoice(workbook, opts);
        break;
      case 'payroll':
        await this.generatePayroll(workbook, opts);
        break;
      case 'inventory':
        await this.generateInventory(workbook, opts);
        break;
      case 'sales_report':
        await this.generateSalesReport(workbook, opts);
        break;
      case 'budget':
        await this.generateBudget(workbook, opts);
        break;
      case 'attendance':
        await this.generateAttendance(workbook, opts);
        break;
      case 'expense':
        await this.generateExpense(workbook, opts);
        break;
      case 'purchase_order':
        await this.generatePurchaseOrder(workbook, opts);
        break;
      case 'quotation':
        await this.generateQuotation(workbook, opts);
        break;
      default:
        throw new Error(`Generator untuk "${templateType}" belum diimplementasi`);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    
    return {
      buffer,
      filename: `${templateType}_${generateId()}.xlsx`,
      templateInfo: config
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INVOICE TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────────

  async generateInvoice(workbook, opts) {
    const ws = workbook.addWorksheet('Invoice', {
      properties: { tabColor: { argb: 'FF2F5496' } }
    });

    const primary = opts.primaryColor;
    let row = 1;

    // === COMPANY HEADER ===
    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).value = opts.companyName;
    ws.getCell(`A${row}`).font = { bold: true, size: 18, color: { argb: `FF${primary}` } };
    ws.getRow(row).height = 30;
    row++;

    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).value = opts.companyAddress;
    ws.getCell(`A${row}`).font = { size: 10, color: { argb: 'FF666666' } };
    row++;

    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).value = `Tel: ${opts.companyPhone} | Email: ${opts.companyEmail}`;
    ws.getCell(`A${row}`).font = { size: 10, color: { argb: 'FF666666' } };
    row += 2;

    // === INVOICE TITLE ===
    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).value = 'INVOICE';
    ws.getCell(`A${row}`).font = { bold: true, size: 24, color: { argb: `FF${primary}` } };
    ws.getCell(`A${row}`).alignment = { horizontal: 'center' };
    ws.getRow(row).height = 35;
    row += 2;

    // === INVOICE INFO ===
    const invoiceNo = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001`;
    const invoiceDate = formatDate(new Date());
    const dueDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    ws.getCell(`A${row}`).value = 'No. Invoice:';
    ws.getCell(`B${row}`).value = invoiceNo;
    ws.getCell(`B${row}`).font = { bold: true };
    ws.getCell(`D${row}`).value = 'Kepada:';
    ws.getCell(`E${row}`).value = 'PT. Customer Name';
    ws.getCell(`E${row}`).font = { bold: true };
    row++;

    ws.getCell(`A${row}`).value = 'Tanggal:';
    ws.getCell(`B${row}`).value = invoiceDate;
    ws.getCell(`E${row}`).value = 'Jl. Customer Address';
    row++;

    ws.getCell(`A${row}`).value = 'Jatuh Tempo:';
    ws.getCell(`B${row}`).value = dueDate;
    ws.getCell(`B${row}`).font = { color: { argb: 'FFDC3545' } };
    ws.getCell(`E${row}`).value = 'Jakarta 12345';
    row += 2;

    // === ITEMS TABLE ===
    const headerRow = row;
    const headers = ['No', 'Deskripsi Item', 'Qty', 'Satuan', 'Harga Satuan', 'Subtotal'];
    headers.forEach((h, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${primary}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    ws.getRow(row).height = 25;
    row++;

    // Sample items
    const items = opts.includeSampleData ? [
      { desc: 'Jasa Konsultasi IT', qty: 10, unit: 'Jam', price: 500000 },
      { desc: 'Instalasi Software', qty: 1, unit: 'Paket', price: 2500000 },
      { desc: 'Training Karyawan', qty: 2, unit: 'Sesi', price: 1500000 },
      { desc: 'Maintenance Bulanan', qty: 1, unit: 'Bulan', price: 3000000 }
    ] : [];

    const dataStartRow = row;
    items.forEach((item, idx) => {
      ws.getCell(row, 1).value = idx + 1;
      ws.getCell(row, 2).value = item.desc;
      ws.getCell(row, 3).value = item.qty;
      ws.getCell(row, 4).value = item.unit;
      ws.getCell(row, 5).value = item.price;
      ws.getCell(row, 5).numFmt = '_-"Rp"* #,##0_-';
      
      if (opts.includeFormulas) {
        ws.getCell(row, 6).value = { formula: `C${row}*E${row}` };
      } else {
        ws.getCell(row, 6).value = item.qty * item.price;
      }
      ws.getCell(row, 6).numFmt = '_-"Rp"* #,##0_-';

      // Borders
      for (let i = 1; i <= 6; i++) {
        ws.getCell(row, i).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
        ws.getCell(row, i).alignment = { vertical: 'middle' };
      }
      ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell(row, 3).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell(row, 4).alignment = { horizontal: 'center', vertical: 'middle' };

      row++;
    });

    // Add empty rows for user to fill
    for (let i = 0; i < 3; i++) {
      for (let j = 1; j <= 6; j++) {
        ws.getCell(row, j).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      if (opts.includeFormulas) {
        ws.getCell(row, 6).value = { formula: `IF(C${row}="","",C${row}*E${row})` };
        ws.getCell(row, 6).numFmt = '_-"Rp"* #,##0_-';
      }
      row++;
    }
    const dataEndRow = row - 1;
    row++;

    // === TOTALS ===
    ws.getCell(row, 5).value = 'Subtotal:';
    ws.getCell(row, 5).font = { bold: true };
    ws.getCell(row, 5).alignment = { horizontal: 'right' };
    if (opts.includeFormulas) {
      ws.getCell(row, 6).value = { formula: `SUM(F${dataStartRow}:F${dataEndRow})` };
    } else {
      ws.getCell(row, 6).value = items.reduce((sum, i) => sum + i.qty * i.price, 0);
    }
    ws.getCell(row, 6).numFmt = '_-"Rp"* #,##0_-';
    ws.getCell(row, 6).font = { bold: true };
    row++;

    ws.getCell(row, 5).value = `PPN (${opts.ppnRate * 100}%):`;
    ws.getCell(row, 5).alignment = { horizontal: 'right' };
    if (opts.includeFormulas) {
      ws.getCell(row, 6).value = { formula: `F${row - 1}*${opts.ppnRate}` };
    } else {
      const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
      ws.getCell(row, 6).value = Math.round(subtotal * opts.ppnRate);
    }
    ws.getCell(row, 6).numFmt = '_-"Rp"* #,##0_-';
    row++;

    ws.getCell(row, 5).value = 'TOTAL:';
    ws.getCell(row, 5).font = { bold: true, size: 12 };
    ws.getCell(row, 5).alignment = { horizontal: 'right' };
    if (opts.includeFormulas) {
      ws.getCell(row, 6).value = { formula: `F${row - 2}+F${row - 1}` };
    } else {
      const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
      ws.getCell(row, 6).value = Math.round(subtotal * (1 + opts.ppnRate));
    }
    ws.getCell(row, 6).numFmt = '_-"Rp"* #,##0_-';
    ws.getCell(row, 6).font = { bold: true, size: 12, color: { argb: `FF${primary}` } };
    ws.getCell(row, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    row += 2;

    // === NOTES ===
    ws.getCell(`A${row}`).value = 'Catatan:';
    ws.getCell(`A${row}`).font = { bold: true };
    row++;
    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).value = '- Pembayaran dapat ditransfer ke rekening BCA 1234567890 a/n PT. Nama Perusahaan';
    row++;
    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).value = '- Harap sertakan nomor invoice pada bukti transfer';
    row += 2;

    // === SIGNATURE ===
    ws.getCell(`E${row}`).value = 'Hormat Kami,';
    ws.getCell(`E${row}`).alignment = { horizontal: 'center' };
    row += 4;
    ws.getCell(`E${row}`).value = '___________________';
    ws.getCell(`E${row}`).alignment = { horizontal: 'center' };
    row++;
    ws.getCell(`E${row}`).value = 'Nama Pengirim';
    ws.getCell(`E${row}`).font = { bold: true };
    ws.getCell(`E${row}`).alignment = { horizontal: 'center' };

    // Column widths
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 35;
    ws.getColumn(3).width = 8;
    ws.getColumn(4).width = 10;
    ws.getColumn(5).width = 18;
    ws.getColumn(6).width = 18;

    // Print settings
    ws.pageSetup.paperSize = 9; // A4
    ws.pageSetup.orientation = 'portrait';
    ws.pageSetup.fitToPage = true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAYROLL TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────────

  async generatePayroll(workbook, opts) {
    const ws = workbook.addWorksheet('Payroll', {
      properties: { tabColor: { argb: 'FF28A745' } }
    });

    const primary = opts.primaryColor;
    let row = 1;

    // Company Header
    ws.mergeCells(`A${row}:H${row}`);
    ws.getCell(`A${row}`).value = opts.companyName;
    ws.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: `FF${primary}` } };
    ws.getRow(row).height = 25;
    row++;

    ws.mergeCells(`A${row}:H${row}`);
    ws.getCell(`A${row}`).value = 'SLIP GAJI KARYAWAN';
    ws.getCell(`A${row}`).font = { bold: true, size: 14 };
    ws.getCell(`A${row}`).alignment = { horizontal: 'center' };
    row++;

    ws.mergeCells(`A${row}:H${row}`);
    ws.getCell(`A${row}`).value = `Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    ws.getCell(`A${row}`).alignment = { horizontal: 'center' };
    row += 2;

    // Headers
    const headers = ['No', 'Nama Karyawan', 'Jabatan', 'Gaji Pokok', 'Tunjangan', 'Lembur', 'Potongan', 'Gaji Bersih'];
    headers.forEach((h, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    ws.getRow(row).height = 30;
    row++;

    // Sample data
    const employees = opts.includeSampleData ? [
      { name: 'Budi Santoso', position: 'Manager', basic: 15000000, allowance: 3000000, overtime: 500000, deduction: 1000000 },
      { name: 'Dewi Lestari', position: 'Supervisor', basic: 10000000, allowance: 2000000, overtime: 750000, deduction: 500000 },
      { name: 'Ahmad Wijaya', position: 'Staff', basic: 6000000, allowance: 1000000, overtime: 300000, deduction: 200000 },
      { name: 'Siti Rahayu', position: 'Staff', basic: 6000000, allowance: 1000000, overtime: 0, deduction: 200000 },
      { name: 'Eko Prasetyo', position: 'Staff', basic: 5500000, allowance: 800000, overtime: 450000, deduction: 150000 }
    ] : [];

    const dataStartRow = row;
    employees.forEach((emp, idx) => {
      ws.getCell(row, 1).value = idx + 1;
      ws.getCell(row, 2).value = emp.name;
      ws.getCell(row, 3).value = emp.position;
      ws.getCell(row, 4).value = emp.basic;
      ws.getCell(row, 5).value = emp.allowance;
      ws.getCell(row, 6).value = emp.overtime;
      ws.getCell(row, 7).value = emp.deduction;
      
      if (opts.includeFormulas) {
        ws.getCell(row, 8).value = { formula: `D${row}+E${row}+F${row}-G${row}` };
      } else {
        ws.getCell(row, 8).value = emp.basic + emp.allowance + emp.overtime - emp.deduction;
      }

      // Format currency columns
      for (let i = 4; i <= 8; i++) {
        ws.getCell(row, i).numFmt = '_-"Rp"* #,##0_-';
      }

      // Borders and alignment
      for (let i = 1; i <= 8; i++) {
        ws.getCell(row, i).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        ws.getCell(row, i).alignment = { vertical: 'middle' };
      }
      ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };

      row++;
    });

    // Empty rows
    for (let i = 0; i < 5; i++) {
      for (let j = 1; j <= 8; j++) {
        ws.getCell(row, j).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
      if (opts.includeFormulas) {
        ws.getCell(row, 8).value = { formula: `IF(D${row}="","",D${row}+E${row}+F${row}-G${row})` };
        ws.getCell(row, 8).numFmt = '_-"Rp"* #,##0_-';
      }
      row++;
    }
    const dataEndRow = row - 1;
    row++;

    // Totals
    ws.getCell(row, 3).value = 'TOTAL:';
    ws.getCell(row, 3).font = { bold: true };
    ws.getCell(row, 3).alignment = { horizontal: 'right' };
    
    for (let i = 4; i <= 8; i++) {
      const colLetter = String.fromCharCode(64 + i);
      if (opts.includeFormulas) {
        ws.getCell(row, i).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
      }
      ws.getCell(row, i).numFmt = '_-"Rp"* #,##0_-';
      ws.getCell(row, i).font = { bold: true };
      ws.getCell(row, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    }

    // Column widths
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 25;
    ws.getColumn(3).width = 15;
    ws.getColumn(4).width = 15;
    ws.getColumn(5).width = 15;
    ws.getColumn(6).width = 12;
    ws.getColumn(7).width = 12;
    ws.getColumn(8).width = 15;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INVENTORY TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────────

  async generateInventory(workbook, opts) {
    const ws = workbook.addWorksheet('Inventory', {
      properties: { tabColor: { argb: 'FF6F42C1' } }
    });

    let row = 1;

    // Title
    ws.mergeCells(`A${row}:I${row}`);
    ws.getCell(`A${row}`).value = 'DAFTAR INVENTARIS BARANG';
    ws.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FF6F42C1' } };
    ws.getCell(`A${row}`).alignment = { horizontal: 'center' };
    ws.getRow(row).height = 30;
    row++;

    ws.mergeCells(`A${row}:I${row}`);
    ws.getCell(`A${row}`).value = `Update Terakhir: ${formatDate(new Date())}`;
    ws.getCell(`A${row}`).alignment = { horizontal: 'center' };
    ws.getCell(`A${row}`).font = { color: { argb: 'FF666666' } };
    row += 2;

    // Headers
    const headers = ['No', 'Kode', 'Nama Barang', 'Kategori', 'Stok', 'Satuan', 'Harga Satuan', 'Total Nilai', 'Status'];
    headers.forEach((h, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6F42C1' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    ws.getRow(row).height = 25;
    row++;

    // Sample data
    const items = opts.includeSampleData ? [
      { code: 'ELC-001', name: 'Laptop Asus VivoBook', category: 'Elektronik', stock: 15, unit: 'Unit', price: 8500000, status: 'Tersedia' },
      { code: 'ELC-002', name: 'Monitor LED 24"', category: 'Elektronik', stock: 25, unit: 'Unit', price: 2500000, status: 'Tersedia' },
      { code: 'ELC-003', name: 'Keyboard Mechanical', category: 'Elektronik', stock: 5, unit: 'Unit', price: 750000, status: 'Stok Menipis' },
      { code: 'ATK-001', name: 'Kertas HVS A4', category: 'ATK', stock: 100, unit: 'Rim', price: 55000, status: 'Tersedia' },
      { code: 'ATK-002', name: 'Tinta Printer', category: 'ATK', stock: 2, unit: 'Botol', price: 125000, status: 'Perlu Restock' }
    ] : [];

    const dataStartRow = row;
    items.forEach((item, idx) => {
      ws.getCell(row, 1).value = idx + 1;
      ws.getCell(row, 2).value = item.code;
      ws.getCell(row, 3).value = item.name;
      ws.getCell(row, 4).value = item.category;
      ws.getCell(row, 5).value = item.stock;
      ws.getCell(row, 6).value = item.unit;
      ws.getCell(row, 7).value = item.price;
      ws.getCell(row, 7).numFmt = '_-"Rp"* #,##0_-';
      
      if (opts.includeFormulas) {
        ws.getCell(row, 8).value = { formula: `E${row}*G${row}` };
      } else {
        ws.getCell(row, 8).value = item.stock * item.price;
      }
      ws.getCell(row, 8).numFmt = '_-"Rp"* #,##0_-';
      
      ws.getCell(row, 9).value = item.status;
      
      // Status coloring
      const statusCell = ws.getCell(row, 9);
      if (item.status === 'Tersedia') {
        statusCell.font = { color: { argb: 'FF28A745' } };
      } else if (item.status === 'Stok Menipis') {
        statusCell.font = { color: { argb: 'FFFFC107' } };
      } else {
        statusCell.font = { color: { argb: 'FFDC3545' } };
      }

      // Borders
      for (let i = 1; i <= 9; i++) {
        ws.getCell(row, i).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
      ws.getCell(row, 1).alignment = { horizontal: 'center' };
      ws.getCell(row, 5).alignment = { horizontal: 'center' };
      ws.getCell(row, 9).alignment = { horizontal: 'center' };

      row++;
    });

    // Empty rows
    for (let i = 0; i < 5; i++) {
      for (let j = 1; j <= 9; j++) {
        ws.getCell(row, j).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
      if (opts.includeFormulas) {
        ws.getCell(row, 8).value = { formula: `IF(E${row}="","",E${row}*G${row})` };
        ws.getCell(row, 8).numFmt = '_-"Rp"* #,##0_-';
      }
      row++;
    }
    const dataEndRow = row - 1;
    row++;

    // Total
    ws.getCell(row, 7).value = 'TOTAL NILAI:';
    ws.getCell(row, 7).font = { bold: true };
    ws.getCell(row, 7).alignment = { horizontal: 'right' };
    if (opts.includeFormulas) {
      ws.getCell(row, 8).value = { formula: `SUM(H${dataStartRow}:H${dataEndRow})` };
    }
    ws.getCell(row, 8).numFmt = '_-"Rp"* #,##0_-';
    ws.getCell(row, 8).font = { bold: true, size: 12 };
    ws.getCell(row, 8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };

    // Column widths
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 12;
    ws.getColumn(3).width = 30;
    ws.getColumn(4).width = 12;
    ws.getColumn(5).width = 8;
    ws.getColumn(6).width = 10;
    ws.getColumn(7).width = 15;
    ws.getColumn(8).width = 18;
    ws.getColumn(9).width = 15;

    // Auto filter
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 9 } };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OTHER TEMPLATES (Simplified implementations)
  // ─────────────────────────────────────────────────────────────────────────────

  async generateSalesReport(workbook, opts) {
    // Similar structure to Invoice
    await this.generateGenericTemplate(workbook, 'Laporan Penjualan', [
      'Tanggal', 'No. Transaksi', 'Customer', 'Produk', 'Qty', 'Harga', 'Total'
    ], opts);
  }

  async generateBudget(workbook, opts) {
    await this.generateGenericTemplate(workbook, 'Anggaran', [
      'No', 'Kategori', 'Deskripsi', 'Budget', 'Realisasi', 'Selisih', 'Persentase'
    ], opts);
  }

  async generateAttendance(workbook, opts) {
    await this.generateGenericTemplate(workbook, 'Absensi', [
      'No', 'Nama', 'NIK', 'Departemen', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Total'
    ], opts);
  }

  async generateExpense(workbook, opts) {
    await this.generateGenericTemplate(workbook, 'Pengeluaran', [
      'Tanggal', 'No. Bukti', 'Kategori', 'Deskripsi', 'Jumlah', 'Status'
    ], opts);
  }

  async generatePurchaseOrder(workbook, opts) {
    // Similar to Invoice but for PO
    await this.generateInvoice(workbook, { ...opts, title: 'PURCHASE ORDER' });
  }

  async generateQuotation(workbook, opts) {
    // Similar to Invoice but for Quotation
    await this.generateInvoice(workbook, { ...opts, title: 'PENAWARAN HARGA' });
  }

  /**
   * Generic template generator
   */
  async generateGenericTemplate(workbook, title, headers, opts) {
    const ws = workbook.addWorksheet(title, {
      properties: { tabColor: { argb: `FF${opts.primaryColor}` } }
    });

    let row = 1;

    // Title
    ws.mergeCells(`A${row}:${String.fromCharCode(64 + headers.length)}${row}`);
    ws.getCell(`A${row}`).value = title.toUpperCase();
    ws.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: `FF${opts.primaryColor}` } };
    ws.getCell(`A${row}`).alignment = { horizontal: 'center' };
    ws.getRow(row).height = 30;
    row += 2;

    // Headers
    headers.forEach((h, i) => {
      const cell = ws.getCell(row, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${opts.primaryColor}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    row++;

    // Empty rows
    for (let i = 0; i < 10; i++) {
      for (let j = 1; j <= headers.length; j++) {
        ws.getCell(row, j).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
      row++;
    }

    // Auto column width
    headers.forEach((h, i) => {
      ws.getColumn(i + 1).width = Math.max(h.length + 5, 12);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK GENERATE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quick generate template
 */
export async function generateTemplate(templateType, options = {}) {
  const engine = new TemplateEngine(options);
  return engine.generate(templateType, options);
}

/**
 * Get available templates
 */
export function getTemplateList() {
  return Object.entries(TEMPLATE_CONFIGS).map(([id, config]) => ({
    id,
    ...config
  }));
}

// Create singleton
export const templateEngine = new TemplateEngine();

export default {
  TemplateEngine,
  templateEngine,
  generateTemplate,
  getTemplateList,
  TEMPLATE_CONFIGS
};
