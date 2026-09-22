export function initializeItemsTable({ itemsBody, addRowBtn, onChange }) {
  const optionalColumns = document.getElementById('optionalColumns');
  const headerRow = optionalColumns.parentElement;
  const addColumnBtn = document.getElementById('addColumnBtn');
  let columnId = 0;

  function updateColumnButton() {
    addColumnBtn.disabled = document.querySelectorAll('.optional-column').length >= 2;
  }

  function unitField() {
    return `<select class="unit-input" aria-label="Unit">
      <option value="none" selected>None</option>
      <option value="yards">yards</option>
      <option value="inch">inch</option>
      <option value="ft">ft</option>
      <option value="lot">lot</option>
      <option value="pcs">pcs</option>
      <option value="months">months</option>
      <option value="other">Other</option>
    </select><input type="text" class="other-unit-input" placeholder="Unit" aria-label="Other unit">`;
  }

  function addRow(description, quantity, price) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="item-no"><input type="text" class="item-no-input" value="" aria-label="Item number"></td>
      <td class="description-cell"><textarea class="desc-input" rows="1" placeholder="Item description">${description || ''}</textarea></td>
      <td class="qty"><input type="number" class="qty-input" min="0" step="1" value="${quantity ?? ''}"></td>
      <td class="unit">${unitField()}</td>
      <td class="price"><input type="number" class="price-input" min="0" step="0.01" value="${price ?? ''}"></td>
      ${[...document.querySelectorAll('.optional-column')].map((column) => `<td class="optional-cell"><input type="text" data-column-id="${column.dataset.columnId}" aria-label="${column.querySelector('.column-name').value || 'Optional column'}"></td>`).join('')}
      <td class="total"><div class="row-total-wrap"><span class="row-total">₱0.00</span><button type="button" class="toggle-row-total" aria-label="Exclude item from quotation total" aria-pressed="false" title="Exclude item from quotation total">-</button></div></td>
      <td class="row-actions"><button class="remove-row" title="Remove item">✕</button></td>
    `;
    itemsBody.appendChild(row);
    resizeDescription(row.querySelector('.desc-input'));
    onChange();
  }

  function resizeDescription(field) {
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }

  function addColumn() {
    if (document.querySelectorAll('.optional-column').length >= 2) return;
    const id = `column-${++columnId}`;
    const header = document.createElement('th');
    header.className = 'optional-column';
    header.dataset.columnId = id;
    header.innerHTML = '<input class="column-name" type="text" value="New column" aria-label="Optional column label"><button class="remove-column" title="Remove column">✕</button>';
    optionalColumns.before(header);
    itemsBody.querySelectorAll('tr').forEach((row) => {
      const cell = document.createElement('td');
      cell.className = 'optional-cell';
      cell.innerHTML = `<input type="text" data-column-id="${id}" aria-label="Optional column">`;
      row.insertBefore(cell, row.querySelector('.total'));
    });
    updateColumnButton();
  }

  function removeColumn(header) {
    const id = header.dataset.columnId;
    header.remove();
    itemsBody.querySelectorAll(`[data-column-id="${id}"]`).forEach((field) => field.closest('td').remove());
    updateColumnButton();
  }

  itemsBody.addEventListener('input', (event) => {
    if (event.target.classList.contains('desc-input')) resizeDescription(event.target);
    onChange();
  });
  itemsBody.addEventListener('change', (event) => {
    if (event.target.classList.contains('unit-input')) {
      event.target.nextElementSibling.classList.toggle('visible', event.target.value === 'other');
    }
    onChange();
  });
  itemsBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-row')) {
      event.target.closest('tr').remove();
      onChange();
    }
    if (event.target.classList.contains('toggle-row-total')) {
      const row = event.target.closest('tr');
      const excluded = row.classList.toggle('exclude-from-total');
      event.target.setAttribute('aria-pressed', String(excluded));
      event.target.setAttribute('aria-label', excluded ? 'Include item in quotation total' : 'Exclude item from quotation total');
      event.target.title = excluded ? 'Include item in quotation total' : 'Exclude item from quotation total';
      onChange();
    }
  });
  addRowBtn.addEventListener('click', () => addRow());
  addColumnBtn.addEventListener('click', addColumn);
  headerRow.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-column')) removeColumn(event.target.closest('.optional-column'));
  });
  updateColumnButton();

  return {
    addRow,
    clear() {
      itemsBody.innerHTML = '';
      document.querySelectorAll('.optional-column').forEach((header) => removeColumn(header));
    }
  };
}
