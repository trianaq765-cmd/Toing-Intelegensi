// ═══════════════════════════════════════════════════════════════════════════
// BOT INDEX.JS - Discord Bot Main File (FIXED)
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  Events,
  ActivityType,
  EmbedBuilder,
  AttachmentBuilder
} from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// BOT CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class ExcelBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.stats = {
      commandsExecuted: 0,
      filesProcessed: 0,
      startTime: null,
      errors: 0
    };

    this.setupEventHandlers();
  }

  /**
   * 🚀 Start the bot
   */
  async start(token) {
    try {
      console.log('📦 Loading commands...');
      await this.loadCommands();

      console.log('🔌 Connecting to Discord...');
      await this.client.login(token);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * 📦 Load all commands from files
   */
  async loadCommands() {
    const commandsPath = join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
      console.warn('⚠️ Commands directory not found, creating...');
      fs.mkdirSync(commandsPath, { recursive: true });
      return;
    }

    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.js'));

    console.log(`   Found ${commandFiles.length} command files`);

    for (const file of commandFiles) {
      try {
        const filePath = join(commandsPath, file);
        const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
        const command = await import(fileUrl);
        
        const cmd = command.default || command;
        
        if (cmd && cmd.data && cmd.execute) {
          this.commands.set(cmd.data.name, cmd);
          console.log(`   ✓ Loaded: /${cmd.data.name}`);
        } else {
          console.warn(`   ⚠️ Invalid structure: ${file}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to load ${file}:`, error.message);
      }
    }

    console.log(`✅ Loaded ${this.commands.size} commands\n`);
  }

  /**
   * 🎯 Setup event handlers
   */
  setupEventHandlers() {
    // ═══════════════════════════════════════════════════════════════════════
    // READY EVENT
    // ═══════════════════════════════════════════════════════════════════════
    this.client.once(Events.ClientReady, (client) => {
      this.stats.startTime = new Date();

      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║              🤖 EXCEL INTELLIGENCE BOT                    ║');
      console.log('╠═══════════════════════════════════════════════════════════╣');
      console.log(`║  📛 Bot: ${client.user.tag.padEnd(43)}║`);
      console.log(`║  🆔 ID: ${client.user.id.padEnd(44)}║`);
      console.log(`║  🏠 Servers: ${String(client.guilds.cache.size).padEnd(40)}║`);
      console.log(`║  📦 Commands: ${String(this.commands.size).padEnd(39)}║`);
      console.log('╠═══════════════════════════════════════════════════════════╣');
      console.log('║  ✅ Bot is ONLINE and ready to receive commands!          ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

      // Set presence
      client.user.setPresence({
        activities: [{ name: '/help untuk bantuan', type: ActivityType.Listening }],
        status: 'online'
      });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // INTERACTION EVENT (Slash Commands)
    // ═══════════════════════════════════════════════════════════════════════
    this.client.on(Events.InteractionCreate, async (interaction) => {
      // Log all interactions for debugging
      console.log(`📥 Interaction received: ${interaction.type} - ${interaction.commandName || 'N/A'}`);

      // Only handle chat input commands (slash commands)
      if (!interaction.isChatInputCommand()) {
        console.log('   ↳ Not a slash command, ignoring');
        return;
      }

      const commandName = interaction.commandName;
      console.log(`🎮 Command: /${commandName} by ${interaction.user.tag}`);

      // SPECIAL: Handle /ping directly for testing
      if (commandName === 'ping') {
        const ping = this.client.ws.ping;
        await interaction.reply({
          content: `🏓 Pong! Latency: **${ping}ms**\n✅ Bot is working correctly!`,
          ephemeral: false
        });
        console.log(`   ✅ Responded to /ping`);
        return;
      }

      // Get command from collection
      const command = this.commands.get(commandName);

      if (!command) {
        console.log(`   ⚠️ Command not found in collection: ${commandName}`);
        console.log(`   📦 Available commands: ${[...this.commands.keys()].join(', ')}`);
        
        await interaction.reply({
          content: `❌ Command \`/${commandName}\` tidak ditemukan. Gunakan \`/help\` untuk melihat daftar command.`,
          ephemeral: true
        });
        return;
      }

      // Execute command
      try {
        await command.execute(interaction, this);
        this.stats.commandsExecuted++;
        console.log(`   ✅ Command executed successfully`);
      } catch (error) {
        console.error(`   ❌ Error executing /${commandName}:`, error);
        this.stats.errors++;

        const errorMessage = {
          content: `❌ Terjadi error saat menjalankan command:\n\`\`\`${error.message}\`\`\``,
          ephemeral: true
        };

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (e) {
          console.error('   ❌ Failed to send error message:', e.message);
        }
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // ERROR EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    this.client.on(Events.Error, (error) => {
      console.error('❌ Discord client error:', error);
      this.stats.errors++;
    });

    this.client.on(Events.Warn, (warning) => {
      console.warn('⚠️ Discord warning:', warning);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // DEBUG EVENT (for troubleshooting)
    // ═══════════════════════════════════════════════════════════════════════
    if (process.env.DEBUG === 'true') {
      this.client.on(Events.Debug, (info) => {
        console.log('🔍 Debug:', info);
      });
    }
  }

  /**
   * 📊 Get bot statistics
   */
  getStats() {
    const uptime = this.stats.startTime 
      ? Date.now() - this.stats.startTime.getTime() 
      : 0;

    return {
      ...this.stats,
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      servers: this.client.guilds?.cache?.size || 0,
      users: this.client.users?.cache?.size || 0,
      commands: this.commands.size,
      ping: this.client.ws?.ping || 0
    };
  }

  /**
   * ⏱️ Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * 🛑 Shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down bot...');
    await this.client.destroy();
    console.log('✅ Bot disconnected');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

export const bot = new ExcelBot();

export default bot;
