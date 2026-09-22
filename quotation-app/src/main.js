import './style.css';
import { initializeItemsTable } from './components/itemsTable.js';
import { initializeClientForm, resetClientForm } from './components/clientForm.js';
import { recalculateTotals } from './components/totals.js';
import { initializePdfExport } from './pdf/exportPdf.js';
import {
  clearDraft,
  createQuotationFile,
  downloadQuotationFile,
  loadDraft,
  readQuotationFile,
  saveDraft
} from './quotationStorage.js';

const itemsBody = document.getElementById('itemsBody');
const statusMsg = document.getElementById('statusMsg');
const sheet = document.getElementById('sheet');
const landing = document.getElementById('landing');
const appShell = document.getElementById('appShell');
const landingStatus = document.getElementById('landingStatus');
const quotationFileInput = document.getElementById('quotationFileInput');
let editorReady = false;

function persistDraft() {
  if (editorReady) saveDraft(createQuotationFile(itemsBody));
}

const itemTable = initializeItemsTable({
  itemsBody,
  addRowBtn: document.getElementById('addRowBtn'),
  onChange: () => {
    recalculateTotals(itemsBody);
    persistDraft();
  }
});

document.getElementById('vatRate').addEventListener('input', () => {
  recalculateTotals(itemsBody);
  persistDraft();
});

function showEditor() {
  landing.hidden = true;
  appShell.hidden = false;
  editorReady = true;
}

function startNewQuotation() {
  clearDraft();
  editorReady = false;
  resetClientForm();
  itemTable.clear();
  itemTable.addRow();
  itemTable.addRow();
  showEditor();
}

function restoreQuotation(quotation) {
  document.getElementById('clientName').value = quotation.client.name || '';
  document.getElementById('clientAddress').value = quotation.client.address || '';
  document.getElementById('clientAttn').value = quotation.client.attention || '';
  document.getElementById('clientEmail').value = quotation.client.email || '';
  document.getElementById('quoteDate').value = quotation.client.date || '';
  document.getElementById('vatRate').value = quotation.vatRate || '12';
  document.getElementById('terms').value = quotation.terms || '';
  itemTable.clear();

  const columnMap = new Map();
  quotation.optionalColumns.forEach((column) => {
    columnMap.set(column.id, itemTable.addColumn(column.name));
  });
  quotation.rows.forEach((savedRow) => {
    const optionalValues = Object.fromEntries(Object.entries(savedRow.optionalValues || {}).map(([id, value]) => [columnMap.get(id), value]));
    itemTable.addRow(savedRow.description, savedRow.quantity, savedRow.price, {
      ...savedRow,
      optionalValues
    });
  });
  if (!quotation.rows.length) itemTable.addRow();
  recalculateTotals(itemsBody);
  showEditor();
  persistDraft();
}

initializeClientForm();

initializePdfExport({
  downloadBtn: document.getElementById('downloadBtn'),
  statusMsg,
  sheet
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Start a new quotation? This clears everything currently on the form.')) {
    startNewQuotation();
    statusMsg.textContent = '';
  }
});

document.getElementById('startQuotationBtn').addEventListener('click', startNewQuotation);
document.getElementById('resumeQuotationBtn').addEventListener('click', () => restoreQuotation(loadDraft()));
document.getElementById('openQuotationBtn').addEventListener('click', () => quotationFileInput.click());
document.getElementById('toolbarOpenQuotationBtn').addEventListener('click', () => quotationFileInput.click());
document.getElementById('homeBtn').addEventListener('click', () => {
  editorReady = false;
  landingStatus.textContent = '';
  document.getElementById('resumeQuotationBtn').hidden = !loadDraft();
  landing.hidden = false;
  appShell.hidden = true;
});
quotationFileInput.addEventListener('change', async () => {
  const [file] = quotationFileInput.files;
  if (!file) return;
  try {
    restoreQuotation(await readQuotationFile(file));
    landingStatus.textContent = '';
  } catch (error) {
    landingStatus.textContent = error.message || 'Unable to open that quotation file.';
  } finally {
    quotationFileInput.value = '';
  }
});
document.getElementById('saveQuotationBtn').addEventListener('click', () => {
  const quotation = createQuotationFile(itemsBody);
  saveDraft(quotation);
  downloadQuotationFile(quotation);
  statusMsg.textContent = 'Quotation file saved.';
  setTimeout(() => { statusMsg.textContent = ''; }, 3000);
});

document.querySelectorAll('#editor input, #editor textarea, #editor select').forEach((field) => {
  field.addEventListener('input', persistDraft);
  field.addEventListener('change', persistDraft);
});
document.getElementById('editor').addEventListener('input', persistDraft);
document.getElementById('editor').addEventListener('change', persistDraft);

if (loadDraft()) document.getElementById('resumeQuotationBtn').hidden = false;
