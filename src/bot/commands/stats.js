// ═══════════════════════════════════════════════════════════════════════════
// STATS.JS - /stats Command
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder } from 'discord.js';
import { responseBuilder } from '../handlers/responseBuilder.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📈 Tampilkan statistik bot'),

  cooldown: 5,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const stats = bot.getStats();
    const embed = responseBuilder.buildStatsEmbed(stats);
    
    await interaction.reply({ embeds: [embed] });
  }
};
