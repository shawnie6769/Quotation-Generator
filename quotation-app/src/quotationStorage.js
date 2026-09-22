const draftKey = 'stoneric-quotation-draft';
const fileVersion = 1;

function readField(id) {
  return document.getElementById(id).value;
}

function collectQuotation(itemsBody) {
  const optionalColumns = [...document.querySelectorAll('.optional-column')].map((header) => ({
    id: header.dataset.columnId,
    name: header.querySelector('.column-name').value
  }));
  const rows = [...itemsBody.querySelectorAll('tr')].map((row) => ({
    itemNo: row.querySelector('.item-no-input').value,
    description: row.querySelector('.desc-input').value,
    quantity: row.querySelector('.qty-input').value,
    unit: row.querySelector('.unit-input').value,
    otherUnit: row.querySelector('.other-unit-input').value,
    price: row.querySelector('.price-input').value,
    excludeFromTotal: row.classList.contains('exclude-from-total'),
    optionalValues: Object.fromEntries([...row.querySelectorAll('.optional-cell input')].map((field) => [field.dataset.columnId, field.value]))
  }));

  return {
    version: fileVersion,
    savedAt: new Date().toISOString(),
    client: {
      name: readField('clientName'),
      address: readField('clientAddress'),
      attention: readField('clientAttn'),
      email: readField('clientEmail'),
      date: readField('quoteDate')
    },
    vatRate: readField('vatRate'),
    terms: readField('terms'),
    optionalColumns,
    rows
  };
}

function isQuotation(value) {
  return value && value.version === fileVersion && value.client && Array.isArray(value.rows) && Array.isArray(value.optionalColumns);
}

export function saveDraft(quotation) {
  localStorage.setItem(draftKey, JSON.stringify(quotation));
}

export function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey));
    return isQuotation(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(draftKey);
}

export function createQuotationFile(itemsBody) {
  return collectQuotation(itemsBody);
}

export function downloadQuotationFile(quotation) {
  const clientName = quotation.client.name.trim() || 'Untitled';
  const safeName = clientName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Untitled';
  const blob = new Blob([JSON.stringify(quotation, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Quotation-${safeName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readQuotationFile(file) {
  const parsed = JSON.parse(await file.text());
  if (!isQuotation(parsed)) throw new Error('This file is not a valid Stoneric quotation.');
  return parsed;
}
