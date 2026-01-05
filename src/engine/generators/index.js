// ═══════════════════════════════════════════════════════════════════════════
// GENERATORS INDEX - Export all generator modules
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

// Text to Excel
export { 
  TextToExcel, 
  textToExcel, 
  pasteToExcel, 
  textToExcelConverter 
} from './textToExcel.js';

// Instruction Parser (NLP)
export { 
  InstructionParser, 
  parseInstruction, 
  instructionParser,
  COLUMN_DATABASE 
} from './instructionParser.js';

// Template Engine
export { 
  TemplateEngine, 
  templateEngine, 
  generateTemplate, 
  getTemplateList,
  TEMPLATE_CONFIGS 
} from './templateEngine.js';

// Convenience re-exports
import { textToExcel, pasteToExcel } from './textToExcel.js';
import { parseInstruction } from './instructionParser.js';
import { generateTemplate, getTemplateList } from './templateEngine.js';

/**
 * 🚀 Smart Create - Intelligently create Excel from various inputs
 */
export async function smartCreate(input, options = {}) {
  const inputType = typeof input;
  
  if (inputType !== 'string') {
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
    const parsed = await parseInstruction(trimmedInput, options);
    return {
      type: 'instruction',
      ...parsed
    };
  }
  
  // Try to parse as data
  try {
    const parsed = await textToExcel(trimmedInput, options);
    return {
      type: 'data',
      parsedData: parsed
    };
  } catch (e) {
    // If parsing fails, treat as instruction
    const parsed = await parseInstruction(trimmedInput, options);
    return {
      type: 'instruction',
      ...parsed
    };
  }
}

export default {
  // Text to Excel
  textToExcel,
  pasteToExcel,
  
  // Instruction Parser
  parseInstruction,
  
  // Templates
  generateTemplate,
  getTemplateList,
  
  // Smart Create
  smartCreate
};
