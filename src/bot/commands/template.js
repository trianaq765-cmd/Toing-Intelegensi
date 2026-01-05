// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE.JS - /template Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { TemplateEngine, getTemplateList } from '../../engine/generators/templateEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
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
          { name: '📊 Sales Report / Laporan Penjualan', value: 'sales_report' },
          { name: '💵 Budget / Anggaran', value: 'budget' },
          { name: '📅 Attendance / Absensi', value: 'attendance' },
          { name: '🧾 Expense / Pengeluaran', value: 'expense' },
          { name: '📝 Purchase Order', value: 'purchase_order' },
          { name: '💼 Quotation / Penawaran', value: 'quotation' }
        )
    )
    .addStringOption(option =>
      option
        .setName('company')
        .setDescription('Nama perusahaan (opsional)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('with_sample')
        .setDescription('Sertakan data contoh (default: ya)')
        .setRequired(false)
    ),

  cooldown: 3,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const templateType = interaction.options.getString('type');
    const companyName = interaction.options.getString('company');
    const withSample = interaction.options.getBoolean('with_sample') ?? true;

    await interaction.deferReply();

    try {
      // Configure template engine
      const options = {
        includeSampleData: withSample,
        includeFormulas: true
      };

      if (companyName) {
        options.companyName = companyName;
      }

      // Generate template
      const engine = new TemplateEngine(options);
      const result = await engine.generate(templateType, options);

      // Create attachment
      const file = new AttachmentBuilder(result.buffer, { name: result.filename });

      // Build response
      const embed = responseBuilder.buildTemplateGeneratedEmbed(result.templateInfo, result.filename);

      if (companyName) {
        embed.addFields({
          name: '🏢 Perusahaan',
          value: companyName,
          inline: true
        });
      }

      embed.addFields({
        name: '📝 Data Contoh',
        value: withSample ? 'Ya' : 'Tidak',
        inline: true
      });

      await interaction.editReply({
        embeds: [embed],
        files: [file]
      });

      bot.stats.filesProcessed++;

    } catch (error) {
      console.error('Template error:', error);
      
      const errorEmbed = responseBuilder.buildErrorEmbed(
        'Gagal Membuat Template',
        error.message
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  /**
   * 🔄 Autocomplete handler
   */
  async autocomplete(interaction, bot) {
    const focusedOption = interaction.options.getFocused(true);
    
    if (focusedOption.name === 'type') {
      const templates = getTemplateList();
      const filtered = templates
        .filter(t => t.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
        .slice(0, 25);
      
      await interaction.respond(
        filtered.map(t => ({ name: t.name, value: t.id }))
      );
    }
  }
};
