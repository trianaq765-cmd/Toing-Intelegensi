// ═══════════════════════════════════════════════════════════════════════════
// CREATE.JS - /create Command (FIXED VERSION)
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import { 
  SlashCommandBuilder, 
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { responseBuilder } from '../handlers/responseBuilder.js';
import { ExcelFormatter } from '../../engine/formatter.js';
import { InstructionParser } from '../../engine/generators/instructionParser.js';
import { TextToExcel } from '../../engine/generators/textToExcel.js';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

const command = {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('✨ Buat Excel dari teks atau instruksi')
    .addSubcommand(subcommand =>
      subcommand
        .setName('from_text')
        .setDescription('Buat Excel dari teks/data yang di-paste')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('from_instruction')
        .setDescription('Buat Excel dari instruksi bahasa natural')
        .addStringOption(option =>
          option
            .setName('instruction')
            .setDescription('Instruksi pembuatan (contoh: "buatkan tabel karyawan dengan kolom nama, gaji")')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quick')
        .setDescription('Buat Excel cepat dengan kolom tertentu')
        .addStringOption(option =>
          option
            .setName('columns')
            .setDescription('Daftar kolom dipisah koma (contoh: nama, email, telepon, gaji)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('rows')
            .setDescription('Jumlah baris sample (default: 5)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(100)
        )
    ),

  cooldown: 3,

  /**
   * 🚀 Execute command
   */
  async execute(interaction, bot) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'from_text':
          await handleFromText(interaction);
          break;
        case 'from_instruction':
          await handleFromInstruction(interaction, bot);
          break;
        case 'quick':
          await handleQuick(interaction, bot);
          break;
        default:
          await interaction.reply({
            content: '❌ Subcommand tidak dikenali',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error('Create command error:', error);
      
      const errorMessage = {
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },

  /**
   * 📝 Handle modal submit
   */
  async handleModal(interaction, params, bot) {
    if (params[0] === 'text_modal') {
      await handleTextModalSubmit(interaction, bot);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 📝 Handle from_text - Show modal for text input
 */
async function handleFromText(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('create:text_modal')
    .setTitle('Buat Excel dari Teks');

  const textInput = new TextInputBuilder()
    .setCustomId('text_data')
    .setLabel('Paste data Anda di sini')
    .setPlaceholder('Nama, Email, Telepon\nBudi, budi@email.com, 08123456789\nDewi, dewi@email.com, 08234567890')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);

  const actionRow = new ActionRowBuilder().addComponents(textInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

/**
 * 🧠 Handle from_instruction
 */
async function handleFromInstruction(interaction, bot) {
  const instruction = interaction.options.getString('instruction');

  await interaction.deferReply();

  try {
    // Parse instruction
    const parser = new InstructionParser({
      generateSampleData: true,
      sampleRowCount: 5
    });
    
    const result = await parser.parse(instruction);

    if (!result.parsedData) {
      throw new Error('Gagal menginterpretasi instruksi. Coba lebih spesifik.');
    }

    // Format output
    const formatter = new ExcelFormatter({ stylePreset: 'professional' });
    const buffer = await formatter.format(result.parsedData);

    // Generate filename
    const filename = `created_${Date.now()}.xlsx`;

    // Build response
    const embed = responseBuilder.buildSuccessEmbed(
      'Excel Dibuat dari Instruksi',
      `Berhasil membuat Excel dengan ${result.columns?.length || 0} kolom`
    );

    embed.addFields(
      {
        name: '💬 Instruksi',
        value: `\`${instruction.substring(0, 100)}${instruction.length > 100 ? '...' : ''}\``,
        inline: false
      },
      {
        name: '📊 Kolom',
        value: result.columns?.slice(0, 5).map(c => c.name).join(', ') || 'N/A',
        inline: true
      },
      {
        name: '📝 Baris',
        value: `${result.rowCount || 5} baris sample`,
        inline: true
      },
      {
        name: '📁 File',
        value: `\`${filename}\``,
        inline: false
      }
    );

    const file = new AttachmentBuilder(buffer, { name: filename });

    await interaction.editReply({
      embeds: [embed],
      files: [file]
    });

    if (bot?.stats) {
      bot.stats.filesProcessed++;
    }

  } catch (error) {
    console.error('Create instruction error:', error);
    
    const errorEmbed = responseBuilder.buildErrorEmbed(
      'Gagal Membuat Excel',
      error.message
    );
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * ⚡ Handle quick create
 */
async function handleQuick(interaction, bot) {
  const columnsStr = interaction.options.getString('columns');
  const rowCount = interaction.options.getInteger('rows') || 5;

  await interaction.deferReply();

  try {
    // Parse columns
    const columns = columnsStr
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (columns.length === 0) {
      throw new Error('Minimal 1 kolom diperlukan');
    }

    if (columns.length > 20) {
      throw new Error('Maksimal 20 kolom');
    }

    // Create instruction for parser
    const instruction = `buatkan tabel dengan kolom ${columns.join(', ')} sebanyak ${rowCount} baris`;
    
    const parser = new InstructionParser({
      generateSampleData: true,
      sampleRowCount: rowCount
    });
    
    const result = await parser.parse(instruction);

    if (!result.parsedData) {
      throw new Error('Gagal membuat struktur data');
    }

    // Format output
    const formatter = new ExcelFormatter({ stylePreset: 'professional' });
    const buffer = await formatter.format(result.parsedData);

    const filename = `quick_${Date.now()}.xlsx`;
    
    const embed = responseBuilder.buildSuccessEmbed(
      'Excel Dibuat (Quick)',
      `${columns.length} kolom × ${rowCount} baris`
    );

    embed.addFields(
      {
        name: '📊 Kolom',
        value: columns.join(', '),
        inline: false
      },
      {
        name: '📁 File',
        value: `\`${filename}\``,
        inline: false
      }
    );

    const file = new AttachmentBuilder(buffer, { name: filename });

    await interaction.editReply({
      embeds: [embed],
      files: [file]
    });

    if (bot?.stats) {
      bot.stats.filesProcessed++;
    }

  } catch (error) {
    console.error('Quick create error:', error);
    
    const errorEmbed = responseBuilder.buildErrorEmbed(
      'Gagal Membuat Excel',
      error.message
    );
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * 📝 Handle text modal submit
 */
async function handleTextModalSubmit(interaction, bot) {
  const textData = interaction.fields.getTextInputValue('text_data');

  await interaction.deferReply();

  try {
    // Parse text
    const textParser = new TextToExcel({
      autoDetectFormat: true,
      autoDetectHeaders: true,
      trimValues: true
    });
    
    const result = await textParser.convert(textData);

    if (!result || !result.sheets) {
      throw new Error('Gagal mengurai data teks');
    }

    const sheet = result.sheets[result.activeSheet];
    
    // Format output
    const formatter = new ExcelFormatter({ stylePreset: 'professional' });
    const buffer = await formatter.format(result);

    const filename = `from_text_${Date.now()}.xlsx`;
    
    const embed = responseBuilder.buildSuccessEmbed(
      'Excel Dibuat dari Teks',
      `Berhasil mengurai ${sheet.totalRows} baris × ${sheet.totalColumns} kolom`
    );

    embed.addFields({
      name: '📁 File',
      value: `\`${filename}\``,
      inline: false
    });

    const file = new AttachmentBuilder(buffer, { name: filename });

    await interaction.editReply({
      embeds: [embed],
      files: [file]
    });

    if (bot?.stats) {
      bot.stats.filesProcessed++;
    }

  } catch (error) {
    console.error('Text modal error:', error);
    
    const errorEmbed = responseBuilder.buildErrorEmbed(
      'Gagal Membuat Excel',
      error.message
    );
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default command;
