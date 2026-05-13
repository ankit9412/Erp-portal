const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

module.exports = {
  formatCurrency,
  formatDate,
};