// ═══════════════════════════════════════════════════════════════════════════
// APP.JS - Frontend JavaScript for Excel Intelligence Bot Dashboard
// 2025 Edition
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const state = {
  selectedFile: null,
  currentAction: 'analyze',
  isProcessing: false
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM ELEMENTS
// ─────────────────────────────────────────────────────────────────────────────

const elements = {
  uploadArea: document.getElementById('uploadArea'),
  fileInput: document.getElementById('fileInput'),
  processBtn: document.getElementById('processBtn'),
  loading: document.getElementById('loading'),
  results: document.getElementById('results'),
  resultsContent: document.getElementById('resultsContent'),
  closeResults: document.getElementById('closeResults'),
  templatesGrid: document.getElementById('templatesGrid'),
  instructionInput: document.getElementById('instructionInput'),
  createBtn: document.getElementById('createBtn'),
  rowCount: document.getElementById('rowCount'),
  stylePreset: document.getElementById('stylePreset'),
  toastContainer: document.getElementById('toastContainer')
};

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initUpload();
  initActionRadios();
  initTemplates();
  initCreate();
  initCloseResults();
});

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD HANDLING
// ─────────────────────────────────────────────────────────────────────────────

function initUpload() {
  const { uploadArea, fileInput, processBtn } = elements;

  // Click to upload
  uploadArea.addEventListener('click', () => fileInput.click());

  // File selected
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Process button
  processBtn.addEventListener('click', processFile);
}

function handleFileSelect(file) {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/json'
  ];

  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.json'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    showToast(`Format file tidak didukung. Gunakan: ${allowedExtensions.join(', ')}`, 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('File terlalu besar. Maksimum 10MB', 'error');
    return;
  }

  state.selectedFile = file;
  elements.processBtn.disabled = false;
  
  // Update upload area
  elements.uploadArea.innerHTML = `
    <div class="upload-icon">✅</div>
    <h3>${file.name}</h3>
    <p>${formatFileSize(file.size)}</p>
    <p class="upload-formats">Klik untuk ganti file</p>
  `;

  showToast(`File "${file.name}" siap diproses`, 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION RADIOS
// ─────────────────────────────────────────────────────────────────────────────

function initActionRadios() {
  const radios = document.querySelectorAll('input[name="action"]');
  const convertOptions = document.getElementById('convertOptions');
  const styleOptions = document.getElementById('styleOptions');

  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.currentAction = e.target.value;
      
      // Show/hide relevant options
      convertOptions.style.display = e.target.value === 'convert' ? 'block' : 'none';
      styleOptions.style.display = ['format', 'clean', 'report'].includes(e.target.value) ? 'block' : 'none';
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS FILE
// ─────────────────────────────────────────────────────────────────────────────

async function processFile() {
  if (!state.selectedFile || state.isProcessing) return;

  state.isProcessing = true;
  showLoading(true);
  hideResults();

  const formData = new FormData();
  formData.append('file', state.selectedFile);

  try {
    let endpoint;
    let isDownload = false;

    switch (state.currentAction) {
      case 'analyze':
        endpoint = '/api/analyze';
        formData.append('deepAnalysis', 'true');
        break;
      case 'clean':
        endpoint = '/api/clean';
        formData.append('mode', 'standard');
        formData.append('formatOutput', 'true');
        isDownload = true;
        break;
      case 'format':
        endpoint = '/api/format';
        formData.append('style', elements.stylePreset.value);
        isDownload = true;
        break;
      case 'report':
        endpoint = '/api/report';
        formData.append('language', 'id');
        isDownload = true;
        break;
      case 'convert':
        endpoint = '/api/convert';
        formData.append('format', document.getElementById('convertFormat').value);
        isDownload = true;
        break;
      default:
        endpoint = '/api/analyze';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Terjadi kesalahan');
    }

    if (isDownload) {
      // Download file
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'output.xlsx';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      downloadBlob(blob, filename);
      showToast('File berhasil diproses!', 'success');
    } else {
      // Show results
      const data = await response.json();
      displayAnalysisResults(data);
    }

  } catch (error) {
    console.error('Process error:', error);
    showToast(error.message, 'error');
  } finally {
    state.isProcessing = false;
    showLoading(false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY RESULTS
// ─────────────────────────────────────────────────────────────────────────────

function displayAnalysisResults(data) {
  const { analysis, filename, fileSize, processingTime } = data;
  const { qualityScore, summary, issues, suggestions } = analysis;

  // Determine score class
  let scoreClass = 'poor';
  if (qualityScore.overall >= 90) scoreClass = 'excellent';
  else if (qualityScore.overall >= 70) scoreClass = 'good';
  else if (qualityScore.overall >= 50) scoreClass = 'fair';

  const html = `
    <div class="results-summary">
      <div class="result-item">
        <span class="result-value">${summary.totalRows.toLocaleString()}</span>
        <span class="result-label">Baris</span>
      </div>
      <div class="result-item">
        <span class="result-value">${summary.totalColumns}</span>
        <span class="result-label">Kolom</span>
      </div>
      <div class="result-item">
        <span class="result-value">${issues.total}</span>
        <span class="result-label">Masalah</span>
      </div>
      <div class="result-item">
        <span class="result-value">${processingTime}</span>
        <span class="result-label">Waktu</span>
      </div>
    </div>

    <div class="score-display">
      <div class="score-value ${scoreClass}">${qualityScore.overall}%</div>
      <div class="score-grade">Grade: ${qualityScore.grade} - ${qualityScore.gradeLabel}</div>
      
      <div class="score-bars">
        <div class="score-bar">
          <span class="score-bar-label">Kelengkapan</span>
          <div class="score-bar-track">
            <div class="score-bar-fill" style="width: ${qualityScore.breakdown.completeness}%"></div>
          </div>
          <span class="score-bar-value">${qualityScore.breakdown.completeness}%</span>
        </div>
        <div class="score-bar">
          <span class="score-bar-label">Konsistensi</span>
          <div class="score-bar-track">
            <div class="score-bar-fill" style="width: ${qualityScore.breakdown.consistency}%"></div>
          </div>
          <span class="score-bar-value">${qualityScore.breakdown.consistency}%</span>
        </div>
        <div class="score-bar">
          <span class="score-bar-label">Validitas</span>
          <div class="score-bar-track">
            <div class="score-bar-fill" style="width: ${qualityScore.breakdown.validity}%"></div>
          </div>
          <span class="score-bar-value">${qualityScore.breakdown.validity}%</span>
        </div>
        <div class="score-bar">
          <span class="score-bar-label">Keunikan</span>
          <div class="score-bar-track">
            <div class="score-bar-fill" style="width: ${qualityScore.breakdown.uniqueness}%"></div>
          </div>
          <span class="score-bar-value">${qualityScore.breakdown.uniqueness}%</span>
        </div>
      </div>
    </div>

    ${issues.total > 0 ? `
      <div style="margin-top: var(--spacing-lg);">
        <h4>⚠️ Masalah Ditemukan (${issues.total})</h4>
        <div style="margin-top: var(--spacing-md); display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
          ${issues.bySeverity.error?.length ? `<span style="color: var(--error);">❌ ${issues.bySeverity.error.length} Error</span>` : ''}
          ${issues.bySeverity.warning?.length ? `<span style="color: var(--warning);">⚠️ ${issues.bySeverity.warning.length} Warning</span>` : ''}
          ${issues.bySeverity.info?.length ? `<span style="color: var(--info);">ℹ️ ${issues.bySeverity.info.length} Info</span>` : ''}
        </div>
      </div>
    ` : '<p style="color: var(--success); margin-top: var(--spacing-lg);">✅ Tidak ada masalah ditemukan!</p>'}

    ${suggestions.length > 0 ? `
      <div style="margin-top: var(--spacing-lg);">
        <h4>💡 Saran Perbaikan</h4>
        <ul style="margin-top: var(--spacing-md); list-style: none;">
          ${suggestions.slice(0, 5).map(s => `
            <li style="padding: var(--spacing-sm) 0; color: var(--text-secondary);">
              <span style="color: ${s.priority === 'high' ? 'var(--error)' : s.priority === 'medium' ? 'var(--warning)' : 'var(--info)'}">●</span>
              ${s.message}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}

    <div style="margin-top: var(--spacing-xl); display: flex; gap: var(--spacing-md);">
      <button class="btn btn-primary" onclick="downloadReport()">
        📊 Download Laporan
      </button>
      <button class="btn btn-secondary" onclick="cleanFile()">
        🧹 Bersihkan Data
      </button>
    </div>
  `;

  elements.resultsContent.innerHTML = html;
  elements.results.style.display = 'block';
  elements.results.scrollIntoView({ behavior: 'smooth' });
}

async function downloadReport() {
  if (!state.selectedFile) return;

  const formData = new FormData();
  formData.append('file', state.selectedFile);
  formData.append('language', 'id');

  try {
    showToast('Generating report...', 'info');
    
    const response = await fetch('/api/report', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to generate report');

    const blob = await response.blob();
    const filename = state.selectedFile.name.replace(/\.[^/.]+$/, '') + '_report.xlsx';
    downloadBlob(blob, filename);
    
    showToast('Report downloaded!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function cleanFile() {
  if (!state.selectedFile) return;

  const formData = new FormData();
  formData.append('file', state.selectedFile);
  formData.append('mode', 'standard');
  formData.append('formatOutput', 'true');

  try {
    showToast('Cleaning data...', 'info');
    
    const response = await fetch('/api/clean', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to clean file');

    const blob = await response.blob();
    const filename = state.selectedFile.name.replace(/\.[^/.]+$/, '') + '_cleaned.xlsx';
    downloadBlob(blob, filename);
    
    showToast('File cleaned and downloaded!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

async function initTemplates() {
  try {
    const response = await fetch('/api/templates');
    const data = await response.json();

    if (data.success && data.templates) {
      const icons = {
        invoice: '🧾',
        payroll: '💰',
        inventory: '📦',
        sales_report: '📊',
        budget: '💵',
        attendance: '📅',
        expense: '🧾',
        purchase_order: '📝',
        quotation: '💼'
      };

      elements.templatesGrid.innerHTML = data.templates.map(t => `
        <div class="template-card" onclick="downloadTemplate('${t.id}')">
          <div class="template-icon">${icons[t.id] || '📋'}</div>
          <h4>${t.name}</h4>
          <p>${t.description}</p>
          <button class="btn btn-secondary btn-sm">Download</button>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
    elements.templatesGrid.innerHTML = '<p>Gagal memuat templates</p>';
  }
}

async function downloadTemplate(type) {
  try {
    showToast(`Generating ${type} template...`, 'info');
    
    const response = await fetch(`/api/templates/${type}?withSample=true`);
    
    if (!response.ok) throw new Error('Failed to generate template');

    const blob = await response.blob();
    const filename = `${type}_template.xlsx`;
    downloadBlob(blob, filename);
    
    showToast('Template downloaded!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE FROM INSTRUCTION
// ─────────────────────────────────────────────────────────────────────────────

function initCreate() {
  elements.createBtn.addEventListener('click', createFromInstruction);
}

async function createFromInstruction() {
  const instruction = elements.instructionInput.value.trim();
  
  if (!instruction) {
    showToast('Masukkan instruksi terlebih dahulu', 'warning');
    return;
  }

  try {
    showToast('Generating Excel...', 'info');
    
    const response = await fetch('/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: instruction,
        type: 'instruction',
        rowCount: parseInt(elements.rowCount.value) || 5
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create file');
    }

    const blob = await response.blob();
    const filename = `created_${Date.now()}.xlsx`;
    downloadBlob(blob, filename);
    
    showToast('Excel created successfully!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function showLoading(show) {
  elements.loading.style.display = show ? 'flex' : 'none';
}

function hideResults() {
  elements.results.style.display = 'none';
}

function initCloseResults() {
  elements.closeResults.addEventListener('click', hideResults);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function copyCode() {
  const code = document.getElementById('apiExample').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Code copied!', 'success');
  });
}

// Make functions available globally for onclick handlers
window.downloadTemplate = downloadTemplate;
window.downloadReport = downloadReport;
window.cleanFile = cleanFile;
window.copyCode = copyCode;
