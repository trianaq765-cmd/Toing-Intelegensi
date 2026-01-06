// ═══════════════════════════════════════════════════════════════════════════
// AUTO-REGISTER.JS - Auto Register Commands on Startup
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const commands = [
  // /ping
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Cek apakah bot aktif'),

  // /help
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('❓ Tampilkan panduan penggunaan bot'),

  // /stats
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📈 Tampilkan statistik bot'),

  // /analyze
  new SlashCommandBuilder()
    .setName('analyze')
    .setDescription('🔍 Analisis file Excel/CSV secara mendalam')
    .addAttachmentOption(option =>
      option
        .setName('file')
        .setDescription('File Excel (.xlsx, .xls) atau CSV untuk dianalisis')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('deep')
        .setDescription('Analisis mendalam (lebih detail)')
        .setRequired(false)
    ),

  // /clean
  new SlashCommandBuilder()
    .setName('clean')
    .setDescription('🧹 Bersihkan dan perbaiki data Excel/CSV')
    .addAttachmentOption(option =>
      option
        .setName('file')
        .setDescription('File Excel/CSV untuk dibersihkan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('mode')
        .setDescription('Mode pembersihan')
        .setRequired(false)
        .addChoices(
          { name: '🚀 Quick - Hapus duplikat & baris kosong', value: 'quick' },
          { name: '📋 Standard - Termasuk trim & format', value: 'standard' },
          { name: '💼 Financial - Optimasi data keuangan', value: 'financial' },
          { name: '🔧 Full - Semua pembersihan', value: 'full' }
        )
    ),

  // /convert
  new SlashCommandBuilder()
    .setName('convert')
    .setDescription('🔄 Konversi file ke format lain')
    .addAttachmentOption(option =>
      option
        .setName('file')
        .setDescription('File untuk dikonversi')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('format')
        .setDescription('Format tujuan')
        .setRequired(true)
        .addChoices(
          { name: '📄 CSV', value: 'csv' },
          { name: '📋 JSON', value: 'json' },
          { name: '🌐 HTML', value: 'html' },
          { name: '📝 Markdown', value: 'md' },
          { name: '🗃️ SQL', value: 'sql' },
          { name: '📰 XML', value: 'xml' }
        )
    ),

  // /create - WITH SUBCOMMANDS (FIXED!)
  new SlashCommandBuilder()
    .setName('create')
    .setDescription('✨ Buat Excel dari instruksi')
    .addSubcommand(subcommand =>
      subcommand
        .setName('from_instruction')
        .setDescription('Buat dari instruksi bahasa natural')
        .addStringOption(option =>
          option
            .setName('instruction')
            .setDescription('Contoh: buatkan tabel karyawan dengan kolom nama, gaji')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quick')
        .setDescription('Buat cepat dengan kolom tertentu')
        .addStringOption(option =>
          option
            .setName('columns')
            .setDescription('Daftar kolom dipisah koma (contoh: nama, email, gaji)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('rows')
            .setDescription('Jumlah baris sample (default: 5)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        )
    ),

  // /template
  new SlashCommandBuilder()
    .setName('template')
    .setDescription('📋 Generate template Excel profesional')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Jenis template')
        .setRequired(true)
        .addChoices(
          { name: '🧾 Invoice / Faktur', value: 'invoice' },
          { name: '💰 Payroll / Slip Gaji', value: 'payroll' },
          { name: '📦 Inventory / Stok Barang', value: 'inventory' },
          { name: '📊 Sales Report', value: 'sales_report' },
          { name: '💵 Budget / Anggaran', value: 'budget' },
          { name: '📅 Attendance / Absensi', value: 'attendance' },
          { name: '🧾 Expense / Pengeluaran', value: 'expense' }
        )
    )
    .addStringOption(option =>
      option
        .setName('company')
        .setDescription('Nama perusahaan (opsional)')
        .setRequired(false)
    ),

  // /format
  new SlashCommandBuilder()
    .setName('format')
    .setDescription('🎨 Format dan styling file Excel')
    .addAttachmentOption(option =>
      option
        .setName('file')
        .setDescription('File Excel/CSV untuk diformat')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('style')
        .setDescription('Style preset')
        .setRequired(false)
        .addChoices(
          { name: '💼 Professional', value: 'professional' },
          { name: '🎨 Modern', value: 'modern' },
          { name: '📝 Minimal', value: 'minimal' },
          { name: '🌈 Colorful', value: 'colorful' },
          { name: '🌙 Dark', value: 'dark' },
          { name: '🇮🇩 Indonesia', value: 'indonesia' }
        )
    )
];

// ─────────────────────────────────────────────────────────────────────────────
// AUTO REGISTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function autoRegister() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    console.log('⚠️  Missing DISCORD_TOKEN or DISCORD_CLIENT_ID - Skipping command registration');
    return;
  }

  console.log('\n🔄 Auto-registering Discord commands...');

  const commandsJson = commands.map(cmd => cmd.toJSON());
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    if (guildId) {
      // Guild commands (instant)
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandsJson }
      );
      console.log(`✅ Registered ${commandsJson.length} commands to guild ${guildId}`);
    } else {
      // Global commands (takes up to 1 hour)
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsJson }
      );
      console.log(`✅ Registered ${commandsJson.length} global commands`);
    }

    console.log('📋 Commands registered:');
    commandsJson.forEach(cmd => {
      console.log(`   /${cmd.name} - ${cmd.description}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Failed to register commands:', error.message);
    // Don't exit - let the bot start anyway
  }
}

// Run
autoRegister();
