const { getRecords, formatDuration } = require("../../utils/quiz")

const modeLabels = {
  chapter: "章节练习",
  special: "专项刷题",
  mock: "模拟考试",
  wrong: "错题重做",
  favorite: "收藏练习"
}

Page({
  data: {
    records: []
  },

  onShow() {
    const records = getRecords().map((r) => ({
      ...r,
      modeLabel: modeLabels[r.mode] || r.mode,
      timeText: this.formatTime(r.time),
      durationText: r.duration ? formatDuration(r.duration) : ""
    }))
    this.setData({ records })
  },

  formatTime(timestamp) {
    const d = new Date(timestamp)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }
})
