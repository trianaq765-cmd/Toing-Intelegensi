// ═══════════════════════════════════════════════════════════════════════════
// PING.JS - Simple test command
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Cek apakah bot aktif'),

  async execute(interaction, bot) {
    const ping = interaction.client.ws.ping;
    const uptime = bot?.getStats?.()?.uptimeFormatted || 'N/A';

    await interaction.reply({
      content: `🏓 **Pong!**\n\n📡 Latency: **${ping}ms**\n⏱️ Uptime: **${uptime}**\n✅ Bot berfungsi dengan baik!`
    });
  }
};
