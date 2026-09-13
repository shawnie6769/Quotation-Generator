const defaultTerms = `1. This quotation is valid for 30 days from the date above.
2. 50% down payment is required before work commences.
3. Prices are subject to change without prior notice after validity period.`;

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function resetClientForm() {
  document.getElementById('clientName').value = '';
  document.getElementById('clientAddress').value = '';
  document.getElementById('clientAttn').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('quoteDate').value = todayISO();
  document.getElementById('vatRate').value = '12';
  document.getElementById('terms').value = defaultTerms;
}

export function initializeClientForm() {
  document.getElementById('quoteDate').value = todayISO();
}
