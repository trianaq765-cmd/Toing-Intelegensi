// ═══════════════════════════════════════════════════════════════════════════
// COMMANDS INDEX - Export all commands (for reference)
// Excel Intelligence Bot - 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

// Commands are loaded dynamically from the commands folder
// This file serves as documentation

export const commandList = [
  {
    name: 'analyze',
    description: 'Analisis file Excel/CSV secara mendalam',
    file: 'analyze.js'
  },
  {
    name: 'clean',
    description: 'Bersihkan dan perbaiki data',
    file: 'clean.js'
  },
  {
    name: 'convert',
    description: 'Konversi ke format lain',
    file: 'convert.js'
  },
  {
    name: 'create',
    description: 'Buat Excel dari teks/instruksi',
    file: 'create.js'
  },
  {
    name: 'template',
    description: 'Generate template profesional',
    file: 'template.js'
  },
  {
    name: 'format',
    description: 'Styling dan formatting',
    file: 'format.js'
  },
  {
    name: 'stats',
    description: 'Statistik bot',
    file: 'stats.js'
  },
  {
    name: 'help',
    description: 'Panduan penggunaan',
    file: 'help.js'
  }
];

export default commandList;
