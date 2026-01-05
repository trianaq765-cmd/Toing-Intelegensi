// ═══════════════════════════════════════════════════════════════════════════
// CLEAN.JS - /clean Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { fileHandler } from '../handlers/fileHandler.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { DataCleaner } from '../../engine/cleaner.js';
import { ExcelFormatter } from '../../engine/formatter.js';
import { toExcelBuffer } from '../../utils/fileParser.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
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
    )
    .addBooleanOption(option =>
      option
        .setName('fix_calculations')
        .setDescription('Perbaiki perhitungan (subtotal, PPN)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('format_output')
        .setDescription('Format output dengan styling profesional')
        .setRequired(false)
    ),

  cooldown: 5,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const attachment = interaction.options.getAttachment('file');
    const mode = interaction.options.getString('mode') || 'standard';
    const fixCalculations = interaction.options.getBoolean('fix_calculations') ?? true;
    const formatOutput = interaction.options.getBoolean('format_output') ?? true;

    await interaction.deferReply();

    try {
      // Process file
      const fileResult = await fileHandler.processAttachment(attachment);

      // Configure cleaner based on mode
      let cleanerOptions;
      switch (mode) {
        case 'quick':
          cleanerOptions = {
            removeDuplicates: true,
            removeEmptyRows: true,
            trimWhitespace: true,
            normalizeCase: false,
            standardizeDates: false,
            standardizePhones: false,
            fixCalculations: false,
            fixTypos: false
          };
          break;
        case 'financial':
          cleanerOptions = {
            removeDuplicates: true,
            removeEmptyRows: true,
            trimWhitespace: true,
            normalizeCase: false,
            standardizeDates: true,
            standardizePhones: false,
            fixCalculations: true,
            fixTypos: false
          };
          break;
        case 'full':
          cleanerOptions = {
            removeDuplicates: true,
            removeEmptyRows: true,
            trimWhitespace: true,
            normalizeCase: true,
            caseType: 'title',
            standardizeDates: true,
            standardizePhones: true,
            fixCalculations: true,
            fixTypos: true
          };
          break;
        default: // standard
          cleanerOptions = {
            removeDuplicates: true,
            removeEmptyRows: true,
            trimWhitespace: true,
            normalizeCase: false,
            standardizeDates: true,
            standardizePhones: true,
            fixCalculations: fixCalculations,
            fixTypos: false
          };
      }

      // Clean data
      const cleaner = new DataCleaner(cleanerOptions);
      const cleanResult = await cleaner.clean(fileResult.parsedData);

      // Generate output file
      let outputBuffer;
      const outputFilename = attachment.name.replace(/(\.[^/.]+)$/, '_cleaned$1');

      if (formatOutput) {
        const formatter = new ExcelFormatter({ 
          stylePreset: 'professional',
          addFormulas: true 
        });
        outputBuffer = await formatter.format(cleanResult.data);
      } else {
        outputBuffer = toExcelBuffer(cleanResult.data);
      }

      // Build response
      const embed = responseBuilder.buildCleaningEmbed(cleanResult, attachment.name);
      const file = new AttachmentBuilder(outputBuffer, { name: outputFilename });

      // Action buttons
      const buttons = responseBuilder.buildActionButtons([
        { id: 'clean:analyze', label: 'Analisis Hasil', emoji: '🔍', style: 1 },
        { id: 'clean:convert', label: 'Konversi', emoji: '🔄', style: 2 }
      ]);

      await interaction.editReply({
        embeds: [embed],
        files: [file],
        components: [buttons]
      });

      bot.stats.filesProcessed++;

    } catch (error) {
      console.error('Clean error:', error);
      
      const errorEmbed = responseBuilder.buildErrorEmbed(
        'Gagal Membersihkan Data',
        error.message
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
