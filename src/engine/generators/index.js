// ═══════════════════════════════════════════════════════════════════════════
// GENERATORS INDEX - Export all generator modules
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

// Text to Excel
import { TextToExcel, textToExcel, pasteToExcel } from './textToExcel.js';

// Instruction Parser (NLP)
import { InstructionParser, parseInstruction } from './instructionParser.js';

// Template Engine
import { TemplateEngine, generateTemplate, getTemplateList } from './templateEngine.js';

// Re-export everything
export { 
  TextToExcel, 
  textToExcel, 
  pasteToExcel 
};

export { 
  InstructionParser, 
  parseInstruction 
};

export { 
  TemplateEngine, 
  generateTemplate, 
  getTemplateList 
};

/**
 * 🚀 Smart Create - Intelligently create Excel from various inputs
 */
export async function smartCreate(input, options = {}) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input harus berupa string (teks atau instruksi)');
  }
  
  const trimmedInput = input.trim();
  
  // Check if it's a template request
  const templateMatch = trimmedInput.match(/^(?:template|buat template|generate template)\s+(\w+)/i);
  if (templateMatch) {
    const templateType = templateMatch[1].toLowerCase();
    return generateTemplate(templateType, options);
  }
  
  // Check if it's an instruction (contains action words)
  const instructionWords = ['buat', 'buatkan', 'create', 'generate', 'bikin', 'tambah'];
  const isInstruction = instructionWords.some(word => 
    trimmedInput.toLowerCase().includes(word)
  );
  
  if (isInstruction) {
    const parser = new InstructionParser(options);
    const parsed = await parser.parse(trimmedInput);
    return {
      type: 'instruction',
      ...parsed
    };
  }
  
  // Try to parse as data
  try {
    const textParser = new TextToExcel(options);
    const parsed = await textParser.convert(trimmedInput);
    return {
      type: 'data',
      parsedData: parsed
    };
  } catch (e) {
    // If parsing fails, treat as instruction
    const parser = new InstructionParser(options);
    const parsed = await parser.parse(trimmedInput);
    return {
      type: 'instruction',
      ...parsed
    };
  }
}

export default {
  // Text to Excel
  TextToExcel,
  textToExcel,
  pasteToExcel,
  
  // Instruction Parser
  InstructionParser,
  parseInstruction,
  
  // Templates
  TemplateEngine,
  generateTemplate,
  getTemplateList,
  
  // Smart Create
  smartCreate
};
