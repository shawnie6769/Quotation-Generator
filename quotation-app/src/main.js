import './style.css';
import { initializeItemsTable } from './components/itemsTable.js';
import { initializeClientForm, resetClientForm } from './components/clientForm.js';
import { recalculateTotals } from './components/totals.js';
import { initializePdfExport } from './pdf/exportPdf.js';

const itemsBody = document.getElementById('itemsBody');
const statusMsg = document.getElementById('statusMsg');
const sheet = document.getElementById('sheet');
const itemTable = initializeItemsTable({
  itemsBody,
  addRowBtn: document.getElementById('addRowBtn'),
  onChange: () => recalculateTotals(itemsBody)
});

document.getElementById('vatRate').addEventListener('input', () => recalculateTotals(itemsBody));

initializeClientForm();
itemTable.addRow();
itemTable.addRow();

initializePdfExport({
  downloadBtn: document.getElementById('downloadBtn'),
  statusMsg,
  sheet
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Start a new quotation? This clears everything currently on the form.')) {
    resetClientForm();
    itemTable.clear();
    itemTable.addRow();
    itemTable.addRow();
    statusMsg.textContent = '';
  }
});
