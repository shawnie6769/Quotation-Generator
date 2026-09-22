export const peso = (amount) => '₱' + (Number.isNaN(amount) ? 0 : amount).toLocaleString('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function recalculateTotals(itemsBody) {
  let subTotal = 0;

  itemsBody.querySelectorAll('tr').forEach((row) => {
    const quantity = parseFloat(row.querySelector('.qty-input').value) || 0;
    const price = parseFloat(row.querySelector('.price-input').value) || 0;
    const total = quantity * price;
    const included = !row.classList.contains('exclude-from-total');
    row.querySelector('.row-total').textContent = included && quantity && price ? peso(total) : '';
    if (included) subTotal += total;
  });

  const vatRate = parseFloat(document.getElementById('vatRate').value) || 0;
  const vat = subTotal * (vatRate / 100);
  const grand = subTotal + vat;
  document.getElementById('subTotal').textContent = peso(subTotal);
  document.getElementById('vatTotal').textContent = peso(vat);
  document.getElementById('grandTotal').textContent = peso(grand);
}
