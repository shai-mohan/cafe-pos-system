const RULES = {
  burger: ['Fries', 'Coke'],
  latte: ['Croissant', 'Cheesecake'],
  cappuccino: ['Croissant', 'Cheesecake'],
  americano: ['Croissant'],
  pasta: ['Coke', 'Orange Juice'],
  sandwich: ['Fries', 'Coke'],
  cheesecake: ['Latte', 'Cappuccino'],
  'green tea': ['Croissant'],
  'chai latte': ['Sandwich'],
};

function getRecommendations(cartItemNames, allMenuItems) {
  const suggestions = new Set();
  const cartLower = cartItemNames.map((n) => n.toLowerCase());

  for (const name of cartLower) {
    const rules = RULES[name];
    if (rules) {
      rules.forEach((s) => suggestions.add(s));
    }
  }

  return allMenuItems.filter(
    (item) =>
      suggestions.has(item.name) &&
      item.available &&
      !cartItemNames.includes(item.name)
  ).slice(0, 3);
}

module.exports = { getRecommendations };
