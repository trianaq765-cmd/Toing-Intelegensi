// ═══════════════════════════════════════════════════════════════════════════
// HELP.JS - Help command (SIMPLIFIED)
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('❓ Tampilkan panduan penggunaan bot'),

  async execute(interaction, bot) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Excel Intelligence Bot - Help')
      .setDescription('Bot cerdas untuk analisis dan pengolahan file Excel/CSV')
      .setColor(0x5865F2)
      .addFields(
        {
          name: '📋 Commands',
          value: [
            '`/ping` - Cek apakah bot aktif',
            '`/analyze` - Analisis file Excel/CSV',
            '`/clean` - Bersihkan dan perbaiki data',
            '`/convert` - Konversi ke format lain',
            '`/create` - Buat Excel dari instruksi',
            '`/template` - Generate template profesional',
            '`/format` - Styling file Excel',
            '`/stats` - Statistik bot',
            '`/help` - Tampilkan bantuan ini'
          ].join('\n'),
          inline: false
        },
        {
          name: '📁 Format Didukung',
          value: '`.xlsx` `.xls` `.csv` `.json`',
          inline: true
        },
        {
          name: '🔄 Export Format',
          value: 'CSV, JSON, HTML, Markdown, SQL, XML',
          inline: true
        }
      )
      .setFooter({ text: 'Excel Intelligence Bot v2.0' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
