// ═══════════════════════════════════════════════════════════════════════════
// CONVERT.JS - /convert Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { fileHandler } from '../handlers/fileHandler.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { DataConverter } from '../../engine/converter.js';
import { getFileExtension } from '../../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
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
          { name: '📄 CSV - Comma Separated Values', value: 'csv' },
          { name: '📋 JSON - JavaScript Object Notation', value: 'json' },
          { name: '🌐 HTML - Web Page Table', value: 'html' },
          { name: '📝 Markdown - MD Table', value: 'md' },
          { name: '🗃️ SQL - Insert Statements', value: 'sql' },
          { name: '📰 XML - Extensible Markup', value: 'xml' },
          { name: '📗 Excel - XLSX Format', value: 'xlsx' }
        )
    )
    .addStringOption(option =>
      option
        .setName('sql_table')
        .setDescription('Nama tabel untuk SQL (default: data_table)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('sql_dialect')
        .setDescription('Dialect SQL')
        .setRequired(false)
        .addChoices(
          { name: 'MySQL', value: 'mysql' },
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'SQLite', value: 'sqlite' }
        )
    ),

  cooldown: 3,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const attachment = interaction.options.getAttachment('file');
    const targetFormat = interaction.options.getString('format');
    const sqlTable = interaction.options.getString('sql_table') || 'data_table';
    const sqlDialect = interaction.options.getString('sql_dialect') || 'mysql';

    await interaction.deferReply();

    try {
      // Process file
      const fileResult = await fileHandler.processAttachment(attachment);
      const sourceFormat = getFileExtension(attachment.name);

      // Configure converter
      const converter = new DataConverter({
        sqlTableName: sqlTable,
        sqlDialect: sqlDialect,
        prettyPrint: true,
        htmlStyles: true
      });

      // Convert
      const result = await converter.convert(fileResult.parsedData, targetFormat);

      // Prepare output filename
      const baseName = attachment.name.replace(/\.[^/.]+$/, '');
      const outputFilename = `${baseName}${result.extension}`;

      // Create attachment
      const outputBuffer = typeof result.content === 'string' 
        ? Buffer.from(result.content, result.encoding || 'utf-8')
        : result.content;
      
      const file = new AttachmentBuilder(outputBuffer, { name: outputFilename });

      // Build response
      const embed = responseBuilder.buildConversionEmbed(
        sourceFormat, 
        targetFormat, 
        outputFilename
      );

      // Add format-specific info
      if (targetFormat === 'sql') {
        embed.addFields({
          name: '🗃️ SQL Info',
          value: `Tabel: \`${sqlTable}\`\nDialect: ${sqlDialect.toUpperCase()}`,
          inline: true
        });
      }

      await interaction.editReply({
        embeds: [embed],
        files: [file]
      });

      bot.stats.filesProcessed++;

    } catch (error) {
      console.error('Convert error:', error);
      
      const errorEmbed = responseBuilder.buildErrorEmbed(
        'Gagal Mengkonversi',
        error.message
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
