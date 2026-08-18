function formatLearnedCount(count) {
  return count > 0 ? `已学 ${count} 门课程` : "尚未开始学习"
}

function formatPrice(price) {
  return price === 0 ? "免费" : `¥${price}`
}

function formatSales(count) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

module.exports = {
  formatLearnedCount,
  formatPrice,
  formatSales
}
