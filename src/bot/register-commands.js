// ═══════════════════════════════════════════════════════════════════════════
// REGISTER-COMMANDS.JS - Register Slash Commands to Discord (FIXED)
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITIONS (Inline untuk memastikan tidak ada import error)
// ─────────────────────────────────────────────────────────────────────────────

const commands = [
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
    )
    .addBooleanOption(option =>
      option
        .setName('report')
        .setDescription('Generate laporan Excel lengkap')
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
          { name: '💼 Financial - Optimasi untuk data keuangan', value: 'financial' },
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

  // /create
  new SlashCommandBuilder()
    .setName('create')
    .setDescription('✨ Buat Excel dari teks atau instruksi')
    .addSubcommand(subcommand =>
      subcommand
        .setName('from_instruction')
        .setDescription('Buat Excel dari instruksi bahasa natural')
        .addStringOption(option =>
          option
            .setName('instruction')
            .setDescription('Instruksi pembuatan (contoh: "buatkan tabel karyawan")')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quick')
        .setDescription('Buat Excel cepat dengan kolom tertentu')
        .addStringOption(option =>
          option
            .setName('columns')
            .setDescription('Daftar kolom dipisah koma')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('rows')
            .setDescription('Jumlah baris (default: 5)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(100)
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
    ),

  // /stats
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📈 Tampilkan statistik bot'),

  // /help
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('❓ Tampilkan panduan penggunaan bot')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Nama command untuk info detail')
        .setRequired(false)
        .addChoices(
          { name: 'analyze', value: 'analyze' },
          { name: 'clean', value: 'clean' },
          { name: 'convert', value: 'convert' },
          { name: 'create', value: 'create' },
          { name: 'template', value: 'template' },
          { name: 'format', value: 'format' }
        )
    ),

  // /ping (simple test command)
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Cek apakah bot aktif')
];

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  // Validation
  if (!token) {
    console.error('❌ ERROR: DISCORD_TOKEN tidak ditemukan di .env');
    console.log('\n📝 Pastikan file .env berisi:');
    console.log('   DISCORD_TOKEN=your_bot_token_here');
    process.exit(1);
  }

  if (!clientId) {
    console.error('❌ ERROR: DISCORD_CLIENT_ID tidak ditemukan di .env');
    console.log('\n📝 Pastikan file .env berisi:');
    console.log('   DISCORD_CLIENT_ID=your_client_id_here');
    process.exit(1);
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║           DISCORD SLASH COMMANDS REGISTRATION             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`📋 Commands to register: ${commands.length}`);
  console.log(`🆔 Client ID: ${clientId}`);
  console.log(`🏠 Guild ID: ${guildId || '(Global - All Servers)'}\n`);

  // Convert to JSON
  const commandsJson = commands.map(cmd => cmd.toJSON());

  // Show command list
  console.log('📦 Commands:');
  commandsJson.forEach(cmd => {
    console.log(`   /${cmd.name} - ${cmd.description}`);
  });
  console.log('');

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('⏳ Registering commands...\n');

    let data;

    if (guildId) {
      // Guild-specific (instant update)
      console.log(`📍 Mode: Guild-specific (instant update)`);
      console.log(`🏠 Target Guild: ${guildId}\n`);

      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandsJson }
      );

      console.log(`✅ Successfully registered ${data.length} commands to guild!`);
    } else {
      // Global (takes up to 1 hour)
      console.log('🌍 Mode: Global (may take up to 1 hour to propagate)\n');

      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsJson }
      );

      console.log(`✅ Successfully registered ${data.length} global commands!`);
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    REGISTRATION COMPLETE                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('🎉 Commands are now available! Try:');
    console.log('   /ping - Test if bot responds');
    console.log('   /help - Show all commands');
    console.log('   /analyze - Analyze Excel file\n');

    if (!guildId) {
      console.log('⚠️  Note: Global commands may take up to 1 hour to appear.');
      console.log('   For instant updates, set DISCORD_GUILD_ID in .env\n');
    }

  } catch (error) {
    console.error('❌ Error registering commands:');
    console.error(error);

    if (error.code === 50001) {
      console.log('\n💡 Fix: Bot mungkin tidak memiliki akses ke server.');
      console.log('   Pastikan bot sudah diinvite dengan permission yang benar.');
    }

    if (error.code === 401) {
      console.log('\n💡 Fix: Token tidak valid.');
      console.log('   Cek DISCORD_TOKEN di file .env');
    }

    process.exit(1);
  }
}

// Run
registerCommands();
