// ═══════════════════════════════════════════════════════════════════════════
// HELP.JS - /help Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { BOT_CONFIG } from '../../utils/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
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
          { name: 'template', value: 'template' }
        )
    ),

  cooldown: 3,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const commandName = interaction.options.getString('command');

    if (commandName) {
      // Show detailed help for specific command
      const embed = this.getCommandHelp(commandName);
      await interaction.reply({ embeds: [embed] });
    } else {
      // Show general help
      const embed = responseBuilder.buildHelpEmbed();
      await interaction.reply({ embeds: [embed] });
    }
  },

  /**
   * 📖 Get detailed command help
   */
  getCommandHelp(command) {
    const helps = {
      analyze: {
        title: '🔍 /analyze - Analisis Data',
        description: 'Menganalisis file Excel/CSV secara mendalam untuk menemukan masalah dan insight.',
        usage: '/analyze file:[attachment] deep:[true/false] report:[true/false]',
        options: [
          '**file** - File Excel/CSV untuk dianalisis (wajib)',
          '**deep** - Analisis mendalam (default: true)',
          '**report** - Generate laporan Excel lengkap'
        ],
        features: [
          '✅ Auto-detect tipe data (NIK, NPWP, Email, dll)',
          '✅ Deteksi duplikat, outlier, dan error',
          '✅ Validasi format Indonesia',
          '✅ Cek perhitungan PPN (11%)',
          '✅ Quality scoring dengan grade A-F'
        ]
      },
      clean: {
        title: '🧹 /clean - Pembersihan Data',
        description: 'Membersihkan dan memperbaiki data secara otomatis.',
        usage: '/clean file:[attachment] mode:[quick/standard/financial/full]',
        options: [
          '**file** - File untuk dibersihkan (wajib)',
          '**mode** - Mode pembersihan',
          '**fix_calculations** - Perbaiki perhitungan',
          '**format_output** - Styling profesional'
        ],
        features: [
          '✅ Hapus duplikat & baris kosong',
          '✅ Trim whitespace',
          '✅ Standardisasi format tanggal & telepon',
          '✅ Perbaiki perhitungan subtotal/PPN',
          '✅ Auto-fix typo (mode full)'
        ]
      },
      convert: {
        title: '🔄 /convert - Konversi Format',
        description: 'Mengkonversi file ke berbagai format.',
        usage: '/convert file:[attachment] format:[csv/json/html/md/sql/xml]',
        options: [
          '**file** - File untuk dikonversi (wajib)',
          '**format** - Format tujuan (wajib)',
          '**sql_table** - Nama tabel SQL',
          '**sql_dialect** - Dialect SQL (mysql/postgresql/sqlite)'
        ],
        features: [
          '✅ CSV dengan delimiter otomatis',
          '✅ JSON dengan formatting',
          '✅ HTML dengan styling',
          '✅ Markdown table',
          '✅ SQL dengan CREATE TABLE'
        ]
      },
      create: {
        title: '✨ /create - Buat Excel',
        description: 'Membuat Excel dari teks atau instruksi bahasa natural.',
        usage: '/create from_instruction instruction:"buatkan tabel karyawan"',
        options: [
          '**/create from_text** - Buat dari teks yang di-paste',
          '**/create from_instruction** - Buat dari instruksi',
          '**/create quick** - Buat cepat dengan kolom tertentu'
        ],
        features: [
          '✅ Parse berbagai format teks (CSV, JSON, key-value)',
          '✅ Natural language understanding Indonesia',
          '✅ Auto-generate sample data',
          '✅ Smart column type detection'
        ]
      },
      template: {
        title: '📋 /template - Generate Template',
        description: 'Generate template Excel profesional siap pakai.',
        usage: '/template type:[invoice/payroll/...] company:"PT Example"',
        options: [
          '**type** - Jenis template (wajib)',
          '**company** - Nama perusahaan',
          '**with_sample** - Sertakan data contoh'
        ],
        features: [
          '✅ 9 template profesional',
          '✅ Formula otomatis',
          '✅ Styling siap print',
          '✅ Kalkulasi PPN otomatis'
        ]
      }
    };

    const help = helps[command];
    
    if (!help) {
      return responseBuilder.buildErrorEmbed('Command tidak ditemukan', `Command "${command}" tidak valid.`);
    }

    const embed = new EmbedBuilder()
      .setTitle(help.title)
      .setDescription(help.description)
      .setColor(BOT_CONFIG.COLORS.PRIMARY)
      .addFields(
        {
          name: '📝 Penggunaan',
          value: `\`${help.usage}\``,
          inline: false
        },
        {
          name: '⚙️ Options',
          value: help.options.join('\n'),
          inline: false
        },
        {
          name: '✨ Fitur',
          value: help.features.join('\n'),
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Excel Intelligence Bot' });

    return embed;
  }
};
