const { formatDuration } = require("../../utils/quiz")

Page({
  data: {
    correct: 0,
    total: 0,
    score: 0,
    mode: "chapter",
    duration: 0,
    durationText: ""
  },

  onLoad(options) {
    const correct = parseInt(options.correct) || 0
    const total = parseInt(options.total) || 0
    const score = options.score ? parseInt(options.score) : Math.round((correct / total) * 100)
    const duration = parseInt(options.duration) || 0
    this.setData({
      correct,
      total,
      score,
      mode: options.mode || "chapter",
      duration,
      durationText: duration > 0 ? formatDuration(duration) : ""
    })
  },

  goBack() {
    wx.navigateBack({ delta: 2 })
  },

  retryWrong() {
    wx.redirectTo({ url: "/pages/quiz-wrong/quiz-wrong" })
  }
})
