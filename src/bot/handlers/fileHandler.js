// ═══════════════════════════════════════════════════════════════════════════
// FILEHANDLER.JS - Handle File Uploads from Discord
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';

import { BOT_CONFIG } from '../../utils/constants.js';
import { getFileExtension, formatFileSize, generateId } from '../../utils/helpers.js';
import { fileParser } from '../../utils/fileParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Temp directory
const TEMP_DIR = path.join(__dirname, '../../../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE HANDLER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class FileHandler {
  constructor() {
    this.supportedExtensions = ['.xlsx', '.xls', '.csv', '.json'];
    this.maxFileSize = BOT_CONFIG.MAX_FILE_SIZE;
    
    // Cleanup old files periodically
    this.startCleanupTask();
  }

  /**
   * 📥 Download and parse file from Discord attachment
   */
  async processAttachment(attachment) {
    // Validate attachment
    const validation = this.validateAttachment(attachment);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Download file
    const buffer = await this.downloadFile(attachment.url);
    
    // Save to temp (optional)
    const tempPath = this.saveToTemp(buffer, attachment.name);

    // Parse file
    const parsedData = await fileParser.parse(buffer, attachment.name);

    return {
      buffer,
      tempPath,
      parsedData,
      filename: attachment.name,
      size: attachment.size,
      sizeFormatted: formatFileSize(attachment.size)
    };
  }

  /**
   * ✅ Validate attachment
   */
  validateAttachment(attachment) {
    if (!attachment) {
      return { valid: false, error: 'Tidak ada file yang dilampirkan' };
    }

    const ext = '.' + getFileExtension(attachment.name);
    
    if (!this.supportedExtensions.includes(ext.toLowerCase())) {
      return { 
        valid: false, 
        error: `Format file tidak didukung. Format yang didukung: ${this.supportedExtensions.join(', ')}` 
      };
    }

    if (attachment.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `File terlalu besar. Maksimum: ${formatFileSize(this.maxFileSize)}` 
      };
    }

    return { valid: true };
  }

  /**
   * 📥 Download file from URL
   */
  async downloadFile(url) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Gagal mengunduh file: ${error.message}`);
    }
  }

  /**
   * 💾 Save buffer to temp file
   */
  saveToTemp(buffer, originalName) {
    const ext = path.extname(originalName);
    const tempName = `${generateId('file')}_${Date.now()}${ext}`;
    const tempPath = path.join(TEMP_DIR, tempName);
    
    fs.writeFileSync(tempPath, buffer);
    
    return tempPath;
  }

  /**
   * 📤 Create Discord attachment from buffer
   */
  createAttachment(buffer, filename) {
    const { AttachmentBuilder } = require('discord.js');
    return new AttachmentBuilder(buffer, { name: filename });
  }

  /**
   * 🗑️ Delete temp file
   */
  deleteTempFile(tempPath) {
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (error) {
      console.warn('Failed to delete temp file:', error.message);
    }
  }

  /**
   * 🧹 Start cleanup task for old temp files
   */
  startCleanupTask() {
    // Run cleanup every 30 minutes
    setInterval(() => {
      this.cleanupTempFiles();
    }, 30 * 60 * 1000);

    // Run once on startup
    this.cleanupTempFiles();
  }

  /**
   * 🧹 Cleanup old temp files
   */
  cleanupTempFiles() {
    const maxAge = BOT_CONFIG.TEMP_FILE_LIFETIME || 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    try {
      const files = fs.readdirSync(TEMP_DIR);
      
      for (const file of files) {
        if (file === '.gitkeep') continue;
        
        const filePath = path.join(TEMP_DIR, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      console.warn('Cleanup error:', error.message);
    }
  }

  /**
   * 📊 Get file info without parsing
   */
  getFileInfo(attachment) {
    return {
      name: attachment.name,
      size: attachment.size,
      sizeFormatted: formatFileSize(attachment.size),
      extension: getFileExtension(attachment.name),
      url: attachment.url,
      isSupported: this.supportedExtensions.includes('.' + getFileExtension(attachment.name))
    };
  }

  /**
   * 🔍 Find attachment in message or interaction
   */
  findAttachment(interaction) {
    // Check option attachment
    const optionAttachment = interaction.options?.getAttachment('file');
    if (optionAttachment) {
      return optionAttachment;
    }

    // Check message attachments (for replies)
    if (interaction.message?.attachments?.size > 0) {
      return interaction.message.attachments.first();
    }

    // Check referenced message
    if (interaction.message?.reference) {
      // Would need to fetch the referenced message
      return null;
    }

    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

export const fileHandler = new FileHandler();

export default {
  FileHandler,
  fileHandler
};
