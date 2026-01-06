// ═══════════════════════════════════════════════════════════════════════════
// STATS.JS - Bot statistics command
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📈 Tampilkan statistik bot'),

  async execute(interaction, bot) {
    const stats = bot.getStats();

    const embed = new EmbedBuilder()
      .setTitle('📈 Bot Statistics')
      .setColor(0x5865F2)
      .addFields(
        { name: '⏱️ Uptime', value: stats.uptimeFormatted || 'N/A', inline: true },
        { name: '🏠 Servers', value: String(stats.servers), inline: true },
        { name: '📡 Ping', value: `${stats.ping}ms`, inline: true },
        { name: '🎮 Commands Run', value: String(stats.commandsExecuted), inline: true },
        { name: '📁 Files Processed', value: String(stats.filesProcessed), inline: true },
        { name: '❌ Errors', value: String(stats.errors), inline: true }
      )
      .setFooter({ text: 'Excel Intelligence Bot v2.0' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
