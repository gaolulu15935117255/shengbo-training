function formatLearnedCount(count) {
  return count > 0 ? `已学 ${count} 门` : "尚未开始学习"
}

module.exports = {
  formatLearnedCount
}
