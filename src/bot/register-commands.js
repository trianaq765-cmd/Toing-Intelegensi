// ═══════════════════════════════════════════════════════════════════════════
// REGISTER-COMMANDS.JS - Register Slash Commands to Discord
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// LOAD COMMANDS
// ─────────────────────────────────────────────────────────────────────────────

async function loadCommands() {
  const commands = [];
  const commandsPath = join(__dirname, 'commands');

  if (!fs.existsSync(commandsPath)) {
    console.error('❌ Commands directory not found');
    return commands;
  }

  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const filePath = join(commandsPath, file);
      const command = await import(`file://${filePath}`);

      if (command.default && command.default.data) {
        commands.push(command.default.data.toJSON());
        console.log(`  ✓ Loaded: ${command.default.data.name}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to load ${file}:`, error.message);
    }
  }

  return commands;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER COMMANDS
// ─────────────────────────────────────────────────────────────────────────────

async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment');
    process.exit(1);
  }

  console.log('📦 Loading commands...\n');
  const commands = await loadCommands();
  console.log(`\n✅ Loaded ${commands.length} commands\n`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('🔄 Registering commands...\n');

    if (guildId) {
      // Guild commands (instant update, for testing)
      console.log(`📍 Registering to guild: ${guildId}`);
      
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );

      console.log(`\n✅ Successfully registered ${data.length} guild commands!`);
    } else {
      // Global commands (takes up to 1 hour to update)
      console.log('🌍 Registering globally (may take up to 1 hour to propagate)');
      
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );

      console.log(`\n✅ Successfully registered ${data.length} global commands!`);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('Commands registered:');
    console.log('═'.repeat(50));
    commands.forEach(cmd => {
      console.log(`  /${cmd.name} - ${cmd.description}`);
    });
    console.log('═'.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE COMMANDS (Optional)
// ─────────────────────────────────────────────────────────────────────────────

async function deleteCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('🗑️ Deleting all commands...\n');

    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: [] }
      );
      console.log('✅ Deleted all guild commands');
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: [] }
      );
      console.log('✅ Deleted all global commands');
    }
  } catch (error) {
    console.error('❌ Error deleting commands:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--delete')) {
  deleteCommands();
} else {
  registerCommands();
}

export { registerCommands, deleteCommands, loadCommands };
