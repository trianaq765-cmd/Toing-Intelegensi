// ═══════════════════════════════════════════════════════════════════════════
// RESPONSEBUILDER.JS - Build Discord Embeds & Responses
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder
} from 'discord.js';

import { BOT_CONFIG } from '../../utils/constants.js';
import { formatRupiah, formatNumber, formatPercentage } from '../../utils/helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE BUILDER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class ResponseBuilder {
  constructor() {
    this.colors = BOT_CONFIG.COLORS;
    this.emojis = BOT_CONFIG.EMOJIS;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYSIS EMBEDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 📊 Build analysis result embed
   */
  buildAnalysisEmbed(analysisResult, filename) {
    const score = analysisResult.qualityScore;
    const summary = analysisResult.summary;
    const issues = analysisResult.issues;

    // Determine color based on score
    let color = this.colors.SUCCESS;
    if (score.overall < 50) color = this.colors.ERROR;
    else if (score.overall < 75) color = this.colors.WARNING;

    const embed = new EmbedBuilder()
      .setTitle(`${this.emojis.ANALYZE} Hasil Analisis Data`)
      .setDescription(`File: \`${filename}\``)
      .setColor(color)
      .addFields(
        {
          name: '📋 Ringkasan',
          value: [
            `${this.emojis.EXCEL} **Baris:** ${formatNumber(summary.totalRows)}`,
            `📊 **Kolom:** ${summary.totalColumns}`,
            `⏱️ **Waktu:** ${summary.analysisTime}`
          ].join('\n'),
          inline: true
        },
        {
          name: '🎯 Skor Kualitas',
          value: [
            `**${score.overall}%** (${score.grade})`,
            `${this.getScoreEmoji(score.overall)} ${score.gradeLabel}`
          ].join('\n'),
          inline: true
        },
        {
          name: '📈 Detail Skor',
          value: [
            `Kelengkapan: ${this.getProgressBar(score.breakdown.completeness)} ${score.breakdown.completeness}%`,
            `Konsistensi: ${this.getProgressBar(score.breakdown.consistency)} ${score.breakdown.consistency}%`,
            `Validitas: ${this.getProgressBar(score.breakdown.validity)} ${score.breakdown.validity}%`,
            `Keunikan: ${this.getProgressBar(score.breakdown.uniqueness)} ${score.breakdown.uniqueness}%`
          ].join('\n'),
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Excel Intelligence Bot' });

    // Add issues if any
    if (issues.total > 0) {
      const issuesList = [];
      if (issues.bySeverity.error?.length) {
        issuesList.push(`❌ **${issues.bySeverity.error.length}** Error`);
      }
      if (issues.bySeverity.warning?.length) {
        issuesList.push(`⚠️ **${issues.bySeverity.warning.length}** Warning`);
      }
      if (issues.bySeverity.info?.length) {
        issuesList.push(`ℹ️ **${issues.bySeverity.info.length}** Info`);
      }

      embed.addFields({
        name: '⚠️ Masalah Ditemukan',
        value: issuesList.join(' | '),
        inline: false
      });
    }

    // Add suggestions
    if (analysisResult.suggestions?.length > 0) {
      const topSuggestions = analysisResult.suggestions
        .slice(0, 3)
        .map((s, i) => `${i + 1}. ${s.message}`)
        .join('\n');

      embed.addFields({
        name: '💡 Saran Perbaikan',
        value: topSuggestions,
        inline: false
      });
    }

    return embed;
  }

  /**
   * 📊 Build column analysis embed
   */
  buildColumnAnalysisEmbed(columnAnalysis, sheetName) {
    const columns = Object.entries(columnAnalysis).slice(0, 10);
    
    const embed = new EmbedBuilder()
      .setTitle(`📊 Analisis Kolom - ${sheetName}`)
      .setColor(this.colors.INFO)
      .setTimestamp();

    const columnList = columns.map(([name, info]) => {
      const typeEmoji = this.getTypeEmoji(info.detectedType);
      const fillBar = this.getMiniProgressBar(info.fillRate);
      return `${typeEmoji} **${name}**: ${info.detectedType} ${fillBar}`;
    }).join('\n');

    embed.setDescription(columnList || 'Tidak ada kolom');

    if (Object.keys(columnAnalysis).length > 10) {
      embed.setFooter({ 
        text: `Menampilkan 10 dari ${Object.keys(columnAnalysis).length} kolom` 
      });
    }

    return embed;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLEANING EMBEDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 🧹 Build cleaning result embed
   */
  buildCleaningEmbed(cleanResult, filename) {
    const summary = cleanResult.summary;
    const log = cleanResult.log;

    const embed = new EmbedBuilder()
      .setTitle(`${this.emojis.CLEAN} Hasil Pembersihan Data`)
      .setDescription(`File: \`${filename}\``)
      .setColor(this.colors.SUCCESS)
      .addFields(
        {
          name: '📊 Ringkasan',
          value: [
            `📥 **Baris Awal:** ${formatNumber(summary.originalRows)}`,
            `📤 **Baris Akhir:** ${formatNumber(summary.cleanedRows)}`,
            `🗑️ **Dihapus:** ${formatNumber(summary.rowsRemoved)}`,
            `⏱️ **Waktu:** ${summary.cleaningTime}`
          ].join('\n'),
          inline: true
        },
        {
          name: '✅ Operasi Dilakukan',
          value: log.length > 0 
            ? log.slice(0, 5).map(l => `• ${l.message}`).join('\n')
            : 'Tidak ada perubahan',
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Excel Intelligence Bot' });

    return embed;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONVERSION EMBEDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 🔄 Build conversion result embed
   */
  buildConversionEmbed(fromFormat, toFormat, filename) {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.CONVERT} Konversi Berhasil`)
      .setDescription(`File berhasil dikonversi dari **${fromFormat.toUpperCase()}** ke **${toFormat.toUpperCase()}**`)
      .setColor(this.colors.SUCCESS)
      .addFields({
        name: '📁 File',
        value: `\`${filename}\``,
        inline: false
      })
      .setTimestamp()
      .setFooter({ text: 'Excel Intelligence Bot' });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE EMBEDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 📋 Build template list embed
   */
  buildTemplateListEmbed(templates) {
    const embed = new EmbedBuilder()
      .setTitle(`${this.emojis.TEMPLATE} Template Tersedia`)
      .setColor(this.colors.PRIMARY)
      .setDescription('Pilih template yang ingin digunakan:')
      .setTimestamp();

    const templateList = templates.map(t => 
      `**${t.name}**\n└ ${t.description}`
    ).join('\n\n');

    embed.addFields({
      name: '📋 Daftar Template',
      value: templateList,
      inline: false
    });

    return embed;
  }

  /**
   * 📋 Build template generated embed
   */
  buildTemplateGeneratedEmbed(templateInfo, filename) {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.SUCCESS} Template Dibuat`)
      .setDescription(`Template **${templateInfo.name}** berhasil dibuat!`)
      .setColor(this.colors.SUCCESS)
      .addFields(
        {
          name: '📁 File',
          value: `\`${filename}\``,
          inline: true
        },
        {
          name: '📋 Deskripsi',
          value: templateInfo.description,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Excel Intelligence Bot' });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE EMBEDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * ✨ Build creation result embed
   */
  buildCreateEmbed(parseResult, filename) {
    const embed = new EmbedBuilder()
      .setTitle(`${this.emojis.CREATE} Excel Dibuat`)
      .setColor(this.colors.SUCCESS)
      .setTimestamp();

    if (parseResult.columns) {
      const columnList = parseResult.columns
        .slice(0, 10)
        .map(c => `• **${c.name}** (${c.type})`)
        .join('\n');

      embed.addFields({
        name: '📊 Kolom',
        value: columnList,
        inline: true
      });
    }

    if (parseResult.rowCount) {
      embed.addFields({
        name: '📝 Data',
        value: `${parseResult.rowCount} baris sample`,
        inline: true
      });
    }

    embed.addFields({
      name: '📁 File',
      value: `\`${filename}\``,
      inline: false
    });

    return embed;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ERROR & INFO EMBEDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * ❌ Build error embed
   */
  buildErrorEmbed(title, message) {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.ERROR} ${title}`)
      .setDescription(message)
      .setColor(this.colors.ERROR)
      .setTimestamp();
  }

  /**
   * ⚠️ Build warning embed
   */
  buildWarningEmbed(title, message) {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.WARNING} ${title}`)
      .setDescription(message)
      .setColor(this.colors.WARNING)
      .setTimestamp();
  }

  /**
   * ℹ️ Build info embed
   */
  buildInfoEmbed(title, message) {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.INFO} ${title}`)
      .setDescription(message)
      .setColor(this.colors.INFO)
      .setTimestamp();
  }

  /**
   * ✅ Build success embed
   */
  buildSuccessEmbed(title, message) {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.SUCCESS} ${title}`)
      .setDescription(message)
      .setColor(this.colors.SUCCESS)
      .setTimestamp();
  }

  /**
   * ⏳ Build loading embed
   */
  buildLoadingEmbed(message = 'Memproses...') {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.LOADING} Loading`)
      .setDescription(message)
      .setColor(this.colors.NEUTRAL)
      .setTimestamp();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATS & HELP EMBEDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 📈 Build stats embed
   */
  buildStatsEmbed(stats) {
    return new EmbedBuilder()
      .setTitle(`${this.emojis.STATS} Bot Statistics`)
      .setColor(this.colors.PRIMARY)
      .addFields(
        {
          name: '⏱️ Uptime',
          value: stats.uptimeFormatted,
          inline: true
        },
        {
          name: '🏠 Servers',
          value: formatNumber(stats.servers),
          inline: true
        },
        {
          name: '📡 Ping',
          value: `${stats.ping}ms`,
          inline: true
        },
        {
          name: '🎮 Commands Executed',
          value: formatNumber(stats.commandsExecuted),
          inline: true
        },
        {
          name: '📁 Files Processed',
          value: formatNumber(stats.filesProcessed),
          inline: true
        },
        {
          name: '❌ Errors',
          value: formatNumber(stats.errors),
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Excel Intelligence Bot v2.0' });
  }

  /**
   * ❓ Build help embed
   */
  buildHelpEmbed(commands = []) {
    const embed = new EmbedBuilder()
      .setTitle(`${this.emojis.HELP} Bantuan - Excel Intelligence Bot`)
      .setDescription('Bot cerdas untuk analisis dan pengolahan file Excel/CSV')
      .setColor(this.colors.PRIMARY)
      .setTimestamp();

    const commandList = [
      { name: '/analyze', desc: 'Analisis file Excel/CSV' },
      { name: '/clean', desc: 'Bersihkan dan perbaiki data' },
      { name: '/convert', desc: 'Konversi ke format lain' },
      { name: '/create', desc: 'Buat Excel dari teks/instruksi' },
      { name: '/template', desc: 'Generate template profesional' },
      { name: '/format', desc: 'Styling dan formatting' },
      { name: '/stats', desc: 'Statistik bot' },
      { name: '/help', desc: 'Tampilkan bantuan ini' }
    ];

    embed.addFields({
      name: '🎮 Commands',
      value: commandList.map(c => `\`${c.name}\` - ${c.desc}`).join('\n'),
      inline: false
    });

    embed.addFields({
      name: '📁 Format Didukung',
      value: '`.xlsx` `.xls` `.csv` `.json`',
      inline: true
    });

    embed.addFields({
      name: '🔄 Output Format',
      value: 'CSV, JSON, HTML, Markdown, SQL, XML',
      inline: true
    });

    embed.setFooter({ text: 'Tip: Lampirkan file saat menggunakan command!' });

    return embed;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BUTTONS & COMPONENTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 🔘 Build action buttons
   */
  buildActionButtons(actions = []) {
    const row = new ActionRowBuilder();

    for (const action of actions.slice(0, 5)) {
      const button = new ButtonBuilder()
        .setCustomId(action.id)
        .setLabel(action.label)
        .setStyle(action.style || ButtonStyle.Primary);

      if (action.emoji) {
        button.setEmoji(action.emoji);
      }

      if (action.disabled) {
        button.setDisabled(true);
      }

      row.addComponents(button);
    }

    return row;
  }

  /**
   * 📋 Build template select menu
   */
  buildTemplateSelectMenu(templates) {
    const select = new StringSelectMenuBuilder()
      .setCustomId('template:select')
      .setPlaceholder('Pilih template...')
      .addOptions(
        templates.slice(0, 25).map(t => ({
          label: t.name,
          description: t.description.substring(0, 100),
          value: t.id,
          emoji: '📋'
        }))
      );

    return new ActionRowBuilder().addComponents(select);
  }

  /**
   * 📁 Create file attachment
   */
  createAttachment(buffer, filename) {
    return new AttachmentBuilder(buffer, { name: filename });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get score emoji
   */
  getScoreEmoji(score) {
    if (score >= 90) return '🌟';
    if (score >= 75) return '✅';
    if (score >= 50) return '⚠️';
    return '❌';
  }

  /**
   * Get progress bar
   */
  getProgressBar(percentage, length = 10) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Get mini progress bar
   */
  getMiniProgressBar(percentage) {
    const filled = Math.round((percentage / 100) * 5);
    return '▓'.repeat(filled) + '░'.repeat(5 - filled);
  }

  /**
   * Get type emoji
   */
  getTypeEmoji(type) {
    const typeEmojis = {
      string: '📝',
      number: '🔢',
      integer: '🔢',
      float: '🔢',
      currency: '💰',
      percentage: '📊',
      date: '📅',
      datetime: '📅',
      email: '📧',
      phone: '📱',
      url: '🔗',
      nik: '🪪',
      npwp: '📋',
      boolean: '✔️',
      empty: '⬜',
      mixed: '🔀',
      unknown: '❓'
    };
    return typeEmojis[type] || '📄';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

export const responseBuilder = new ResponseBuilder();

export default {
  ResponseBuilder,
  responseBuilder
};
