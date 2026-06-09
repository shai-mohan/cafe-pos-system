const TAX_RATE = 0.1;

function calcTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}

module.exports = { calcTotals, TAX_RATE };
