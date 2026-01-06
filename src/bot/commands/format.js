// ═══════════════════════════════════════════════════════════════════════════
// FORMAT.JS - /format Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { fileHandler } from '../handlers/fileHandler.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { DataAnalyzer } from '../../engine/analyzer.js';
import { ExcelFormatter, STYLE_PRESETS } from '../../engine/formatter.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
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
          { name: '💼 Professional - Formal & clean', value: 'professional' },
          { name: '🎨 Modern - Contemporary look', value: 'modern' },
          { name: '📝 Minimal - Simple & light', value: 'minimal' },
          { name: '🌈 Colorful - Vibrant colors', value: 'colorful' },
          { name: '🌙 Dark - Dark theme', value: 'dark' },
          { name: '🇮🇩 Indonesia - Red & white theme', value: 'indonesia' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('formulas')
        .setDescription('Tambahkan formula SUM/TOTAL (default: ya)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('auto_width')
        .setDescription('Auto-fit column width (default: ya)')
        .setRequired(false)
    ),

  cooldown: 3,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const attachment = interaction.options.getAttachment('file');
    const style = interaction.options.getString('style') || 'professional';
    const addFormulas = interaction.options.getBoolean('formulas') ?? true;
    const autoWidth = interaction.options.getBoolean('auto_width') ?? true;

    await interaction.deferReply();

    try {
      // Process file
      const fileResult = await fileHandler.processAttachment(attachment);

      // Analyze for column types
      const analyzer = new DataAnalyzer({ deepAnalysis: false });
      const analysis = await analyzer.analyze(fileResult.parsedData);

      // Format
      const formatter = new ExcelFormatter({
        stylePreset: style,
        addFormulas,
        autoWidth,
        freezeHeader: true,
        autoFilter: true,
        zebraStripes: true
      });

      const buffer = await formatter.format(fileResult.parsedData, analysis.columnAnalysis);

      // Create output
      const outputFilename = attachment.name.replace(/(\.[^/.]+)$/, '_formatted$1');
      const file = new AttachmentBuilder(buffer, { name: outputFilename });

      // Build response
      const styleName = STYLE_PRESETS[style]?.name || style;
      const embed = responseBuilder.buildSuccessEmbed(
        'File Diformat',
        `Style: **${styleName}**\nFormulas: ${addFormulas ? 'Ya' : 'Tidak'}\nAuto Width: ${autoWidth ? 'Ya' : 'Tidak'}`
      );

      embed.addFields({
        name: '📁 File',
        value: `\`${outputFilename}\``,
        inline: false
      });

      await interaction.editReply({
        embeds: [embed],
        files: [file]
      });

      bot.stats.filesProcessed++;

    } catch (error) {
      console.error('Format error:', error);
      
      const errorEmbed = responseBuilder.buildErrorEmbed(
        'Gagal Memformat',
        error.message
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  /**
   * 🔄 Autocomplete for styles
   */
  async autocomplete(interaction, bot) {
    const focusedOption = interaction.options.getFocused(true);
    
    if (focusedOption.name === 'style') {
      const styles = Object.entries(STYLE_PRESETS).map(([id, preset]) => ({
        name: preset.name,
        value: id
      }));
      
      const filtered = styles.filter(s => 
        s.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      
      await interaction.respond(filtered.slice(0, 25));
    }
  }
};
