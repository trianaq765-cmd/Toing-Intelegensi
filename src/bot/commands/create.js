// ═══════════════════════════════════════════════════════════════════════════
// CREATE.JS - /create Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { 
  SlashCommandBuilder, 
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { smartCreate } from '../../engine/generators/index.js';
import { ExcelFormatter } from '../../engine/formatter.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('✨ Buat Excel dari teks atau instruksi')
    .addSubcommand(subcommand =>
      subcommand
        .setName('from_text')
        .setDescription('Buat Excel dari teks/data yang di-paste')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('from_instruction')
        .setDescription('Buat Excel dari instruksi bahasa natural')
        .addStringOption(option =>
          option
            .setName('instruction')
            .setDescription('Instruksi pembuatan (contoh: "buatkan tabel karyawan dengan kolom nama, gaji")')
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
            .setDescription('Daftar kolom dipisah koma (contoh: nama, email, telepon, gaji)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('rows')
            .setDescription('Jumlah baris sample (default: 5)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(100)
        )
    ),

  cooldown: 3,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'from_text':
        await this.handleFromText(interaction);
        break;
      case 'from_instruction':
        await this.handleFromInstruction(interaction, bot);
        break;
      case 'quick':
        await this.handleQuick(interaction, bot);
        break;
    }
  },

  /**
   * 📝 Handle from_text - Show modal for text input
   */
  async handleFromText(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('create:text_modal')
      .setTitle('Buat Excel dari Teks');

    const textInput = new TextInputBuilder()
      .setCustomId('text_data')
      .setLabel('Paste data Anda di sini')
      .setPlaceholder('Nama, Email, Telepon\nBudi, budi@email.com, 08123456789\nDewi, dewi@email.com, 08234567890')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const row = new ActionRowBuilder().addComponents(textInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  },

  /**
   * 🧠 Handle from_instruction
   */
  async handleFromInstruction(interaction, bot) {
    const instruction = interaction.options.getString('instruction');

    await interaction.deferReply();

    try {
      // Parse instruction
      const result = await smartCreate(instruction, {
        generateSampleData: true,
        sampleRowCount: 5
      });

      if (!result.parsedData) {
        throw new Error('Gagal menginterpretasi instruksi. Coba lebih spesifik.');
      }

      // Format output
      const formatter = new ExcelFormatter({ stylePreset: 'professional' });
      const buffer = await formatter.format(result.parsedData);

      // Generate filename
      const filename = `created_${Date.now()}.xlsx`;

      // Build response
      const embed = responseBuilder.buildCreateEmbed(result, filename);
      embed.addFields({
        name: '💬 Instruksi',
        value: `\`${instruction}\``,
        inline: false
      });

      const file = new AttachmentBuilder(buffer, { name: filename });

      await interaction.editReply({
        embeds: [embed],
        files: [file]
      });

      bot.stats.filesProcessed++;

    } catch (error) {
      console.error('Create instruction error:', error);
      
      const errorEmbed = responseBuilder.buildErrorEmbed(
        'Gagal Membuat Excel',
        error.message
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  /**
   * ⚡ Handle quick create
   */
  async handleQuick(interaction, bot) {
    const columnsStr = interaction.options.getString('columns');
    const rowCount = interaction.options.getInteger('rows') || 5;

    await interaction.deferReply();

    try {
      // Parse columns
      const columns = columnsStr.split(',').map(c => c.trim()).filter(c => c);
      
      if (columns.length === 0) {
        throw new Error('Minimal 1 kolom diperlukan');
      }

      // Create instruction for parser
      const instruction = `buatkan tabel dengan kolom ${columns.join(', ')} sebanyak ${rowCount} baris`;
      
      const result = await smartCreate(instruction, {
        generateSampleData: true,
        sampleRowCount: rowCount
      });

      // Format output
      const formatter = new ExcelFormatter({ stylePreset: 'professional' });
      const buffer = await formatter.format(result.parsedData);

      const filename = `quick_${Date.now()}.xlsx`;
      const embed = responseBuilder.buildCreateEmbed(result, filename);
      const file = new AttachmentBuilder(buffer, { name: filename });

      await interaction.editReply({
        embeds: [embed],
        files: [file]
      });

      bot.stats.filesProcessed++;

    } catch (error) {
      console.error('Quick create error:', error);
      
      const errorEmbed = responseBuilder.buildErrorEmbed(
        'Gagal Membuat Excel',
        error.message
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  /**
   * 📝 Handle modal submit
   */
  async handleModal(interaction, params, bot) {
    const modalId = params[0];

    if (modalId === 'text_modal') {
      const textData = interaction.fields.getTextInputValue('text_data');

      await interaction.deferReply();

      try {
        const result = await smartCreate(textData, {
          autoDetectFormat: true,
          autoDetectHeaders: true
        });

        if (!result.parsedData) {
          throw new Error('Gagal mengurai data teks');
        }

        const formatter = new ExcelFormatter({ stylePreset: 'professional' });
        const buffer = await formatter.format(result.parsedData);

        const filename = `from_text_${Date.now()}.xlsx`;
        const embed = responseBuilder.buildSuccessEmbed(
          'Excel Dibuat dari Teks',
          `Berhasil mengurai ${result.parsedData.sheets[result.parsedData.activeSheet].totalRows} baris data`
        );

        const file = new AttachmentBuilder(buffer, { name: filename });

        await interaction.editReply({
          embeds: [embed],
          files: [file]
        });

        bot.stats.filesProcessed++;

      } catch (error) {
        const errorEmbed = responseBuilder.buildErrorEmbed(
          'Gagal Membuat Excel',
          error.message
        );
        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  }
};
