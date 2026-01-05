// ═══════════════════════════════════════════════════════════════════════════
// ANALYZE.JS - /analyze Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { fileHandler } from '../handlers/fileHandler.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { DataAnalyzer } from '../../engine/analyzer.js';
import { ReportGenerator } from '../../engine/reporter.js';
import { ExcelFormatter } from '../../engine/formatter.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
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

  cooldown: 5,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const attachment = interaction.options.getAttachment('file');
    const deepAnalysis = interaction.options.getBoolean('deep') ?? true;
    const generateReport = interaction.options.getBoolean('report') ?? false;

    // Defer reply (analysis might take time)
    await interaction.deferReply();

    try {
      // Process file
      const fileResult = await fileHandler.processAttachment(attachment);
      
      // Analyze
      const analyzer = new DataAnalyzer({ deepAnalysis });
      const analysisResult = await analyzer.analyze(fileResult.parsedData);

      // Build response embed
      const embed = responseBuilder.buildAnalysisEmbed(analysisResult, attachment.name);

      // Prepare attachments
      const attachments = [];

      // Generate report if requested
      if (generateReport) {
        const reporter = new ReportGenerator();
        const reportBuffer = await reporter.generateAnalysisReport(
          analysisResult, 
          fileResult.parsedData
        );
        
        const reportFilename = attachment.name.replace(/\.[^/.]+$/, '') + '_report.xlsx';
        attachments.push(new AttachmentBuilder(reportBuffer, { name: reportFilename }));
      }

      // Build action buttons
      const buttons = responseBuilder.buildActionButtons([
        { id: 'analyze:columns', label: 'Lihat Kolom', emoji: '📊', style: 1 },
        { id: 'analyze:issues', label: 'Lihat Masalah', emoji: '⚠️', style: 1 },
        { id: 'analyze:clean', label: 'Bersihkan', emoji: '🧹', style: 3 }
      ]);

      // Send response
      await interaction.editReply({
        embeds: [embed],
        files: attachments,
        components: [buttons]
      });

      // Update bot stats
      bot.stats.filesProcessed++;

      // Store analysis result for follow-up actions
      interaction.client.analysisCache = interaction.client.analysisCache || new Map();
      interaction.client.analysisCache.set(interaction.user.id, {
        result: analysisResult,
        parsedData: fileResult.parsedData,
        filename: attachment.name,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Analyze error:', error);
      
      const errorEmbed = responseBuilder.buildErrorEmbed(
        'Gagal Menganalisis',
        error.message
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  /**
   * 🔘 Handle button interactions
   */
  async handleButton(interaction, params, bot) {
    const action = params[0];
    const cache = interaction.client.analysisCache?.get(interaction.user.id);

    if (!cache || Date.now() - cache.timestamp > 30 * 60 * 1000) {
      await interaction.reply({
        content: '⚠️ Data analisis sudah kadaluarsa. Silakan jalankan `/analyze` lagi.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferUpdate();

    switch (action) {
      case 'columns':
        const columnEmbed = responseBuilder.buildColumnAnalysisEmbed(
          cache.result.columnAnalysis,
          cache.parsedData.activeSheet
        );
        await interaction.followUp({ embeds: [columnEmbed], ephemeral: true });
        break;

      case 'issues':
        if (cache.result.issues.total === 0) {
          await interaction.followUp({
            content: '✅ Tidak ada masalah ditemukan!',
            ephemeral: true
          });
        } else {
          const issuesList = cache.result.issues.details
            .slice(0, 10)
            .map((issue, i) => `${i + 1}. [${issue.severity}] ${issue.message}`)
            .join('\n');
          
          const issueEmbed = responseBuilder.buildInfoEmbed(
            `Masalah Ditemukan (${cache.result.issues.total})`,
            issuesList
          );
          await interaction.followUp({ embeds: [issueEmbed], ephemeral: true });
        }
        break;

      case 'clean':
        await interaction.followUp({
          content: '🧹 Gunakan command `/clean` dengan file yang sama untuk membersihkan data.',
          ephemeral: true
        });
        break;
    }
  }
};
