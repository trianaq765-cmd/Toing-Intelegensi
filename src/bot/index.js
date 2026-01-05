// ═══════════════════════════════════════════════════════════════════════════
// BOT INDEX.JS - Discord Bot Initialization & Event Handling
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  Events,
  ActivityType,
  REST,
  Routes
} from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import { BOT_CONFIG } from '../utils/constants.js';

// Get directory path for ES modules
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
      // Load commands
      await this.loadCommands();

      // Login
      await this.client.login(token);
      
      console.log('✅ Bot started successfully!');
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * 📦 Load all commands
   */
  async loadCommands() {
    const commandsPath = join(__dirname, 'commands');
    
    // Check if commands directory exists
    if (!fs.existsSync(commandsPath)) {
      console.warn('⚠️ Commands directory not found');
      return;
    }

    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      try {
        const filePath = join(commandsPath, file);
        const command = await import(`file://${filePath}`);
        
        if (command.default && command.default.data && command.default.execute) {
          this.commands.set(command.default.data.name, command.default);
          console.log(`  ✓ Loaded command: ${command.default.data.name}`);
        } else {
          console.warn(`  ⚠️ Invalid command structure: ${file}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to load ${file}:`, error.message);
      }
    }

    console.log(`📦 Loaded ${this.commands.size} commands`);
  }

  /**
   * 🎯 Setup event handlers
   */
  setupEventHandlers() {
    // Ready event
    this.client.once(Events.ClientReady, (client) => {
      console.log(`\n${'═'.repeat(60)}`);
      console.log('🤖 EXCEL INTELLIGENCE BOT');
      console.log('═'.repeat(60));
      console.log(`📛 Logged in as: ${client.user.tag}`);
      console.log(`🆔 Bot ID: ${client.user.id}`);
      console.log(`🏠 Servers: ${client.guilds.cache.size}`);
      console.log(`👥 Users: ${client.users.cache.size}`);
      console.log('═'.repeat(60) + '\n');

      this.stats.startTime = new Date();

      // Set presence
      this.updatePresence();
      
      // Update presence every 5 minutes
      setInterval(() => this.updatePresence(), 5 * 60 * 1000);
    });

    // Interaction event (slash commands)
    this.client.on(Events.InteractionCreate, async (interaction) => {
      await this.handleInteraction(interaction);
    });

    // Error handling
    this.client.on(Events.Error, (error) => {
      console.error('❌ Discord client error:', error);
      this.stats.errors++;
    });

    // Warning handling
    this.client.on(Events.Warn, (warning) => {
      console.warn('⚠️ Discord warning:', warning);
    });

    // Guild join
    this.client.on(Events.GuildCreate, (guild) => {
      console.log(`➕ Joined new guild: ${guild.name} (${guild.id})`);
    });

    // Guild leave
    this.client.on(Events.GuildDelete, (guild) => {
      console.log(`➖ Left guild: ${guild.name} (${guild.id})`);
    });
  }

  /**
   * 🎮 Handle interactions
   */
  async handleInteraction(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      await this.handleCommand(interaction);
      return;
    }

    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      await this.handleAutocomplete(interaction);
      return;
    }

    // Handle buttons
    if (interaction.isButton()) {
      await this.handleButton(interaction);
      return;
    }

    // Handle select menus
    if (interaction.isStringSelectMenu()) {
      await this.handleSelectMenu(interaction);
      return;
    }

    // Handle modals
    if (interaction.isModalSubmit()) {
      await this.handleModal(interaction);
      return;
    }
  }

  /**
   * 🔧 Handle slash commands
   */
  async handleCommand(interaction) {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
      return;
    }

    // Check cooldown
    const cooldownResult = this.checkCooldown(interaction, command);
    if (cooldownResult.onCooldown) {
      await interaction.reply({
        content: `⏳ Tunggu ${cooldownResult.remaining} detik sebelum menggunakan command ini lagi.`,
        ephemeral: true
      });
      return;
    }

    try {
      console.log(`🎮 Command: /${interaction.commandName} by ${interaction.user.tag}`);
      
      await command.execute(interaction, this);
      
      this.stats.commandsExecuted++;
    } catch (error) {
      console.error(`❌ Error executing ${interaction.commandName}:`, error);
      this.stats.errors++;

      const errorMessage = {
        content: '❌ Terjadi error saat menjalankan command. Silakan coba lagi.',
        ephemeral: true
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (e) {
        console.error('Failed to send error message:', e);
      }
    }
  }

  /**
   * 🔄 Handle autocomplete
   */
  async handleAutocomplete(interaction) {
    const command = this.commands.get(interaction.commandName);

    if (!command || !command.autocomplete) {
      return;
    }

    try {
      await command.autocomplete(interaction, this);
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  }

  /**
   * 🔘 Handle button interactions
   */
  async handleButton(interaction) {
    const [action, ...params] = interaction.customId.split(':');
    
    // Handle common button actions
    switch (action) {
      case 'download':
        // Handled by individual commands
        break;
      case 'delete':
        await interaction.message.delete().catch(() => {});
        break;
      default:
        // Delegate to command if exists
        const command = this.commands.get(action);
        if (command && command.handleButton) {
          await command.handleButton(interaction, params, this);
        }
    }
  }

  /**
   * 📋 Handle select menu
   */
  async handleSelectMenu(interaction) {
    const [action, ...params] = interaction.customId.split(':');
    
    const command = this.commands.get(action);
    if (command && command.handleSelect) {
      await command.handleSelect(interaction, params, this);
    }
  }

  /**
   * 📝 Handle modal submit
   */
  async handleModal(interaction) {
    const [action, ...params] = interaction.customId.split(':');
    
    const command = this.commands.get(action);
    if (command && command.handleModal) {
      await command.handleModal(interaction, params, this);
    }
  }

  /**
   * ⏱️ Check cooldown
   */
  checkCooldown(interaction, command) {
    const cooldownAmount = (command.cooldown || 3) * 1000;
    const key = `${command.data.name}-${interaction.user.id}`;

    if (this.cooldowns.has(key)) {
      const expirationTime = this.cooldowns.get(key) + cooldownAmount;
      const now = Date.now();

      if (now < expirationTime) {
        const remaining = ((expirationTime - now) / 1000).toFixed(1);
        return { onCooldown: true, remaining };
      }
    }

    this.cooldowns.set(key, Date.now());
    setTimeout(() => this.cooldowns.delete(key), cooldownAmount);

    return { onCooldown: false };
  }

  /**
   * 🎭 Update bot presence
   */
  updatePresence() {
    const activities = [
      { name: '📊 Excel files', type: ActivityType.Watching },
      { name: '/help untuk bantuan', type: ActivityType.Listening },
      { name: `${this.client.guilds.cache.size} servers`, type: ActivityType.Watching },
      { name: '🧠 Analyzing data', type: ActivityType.Playing }
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];

    this.client.user.setPresence({
      activities: [activity],
      status: 'online'
    });
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
      servers: this.client.guilds.cache.size,
      users: this.client.users.cache.size,
      commands: this.commands.size,
      ping: this.client.ws.ping
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

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * 🛑 Graceful shutdown
   */
  async shutdown() {
    console.log('\n🛑 Shutting down bot...');
    
    try {
      await this.client.destroy();
      console.log('✅ Bot disconnected successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

// Create singleton instance
export const bot = new ExcelBot();

// Start bot if run directly
const isMainModule = process.argv[1] && 
  fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  import('dotenv').then(dotenv => {
    dotenv.config();
    
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      console.error('❌ DISCORD_TOKEN not found in environment variables');
      process.exit(1);
    }

    bot.start(token).catch(error => {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    });
  });
}

export default bot;
