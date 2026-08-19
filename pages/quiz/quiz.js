const { quizCategories, practiceModes } = require("../../data/questions")
const { getQuizStats, getAccuracy } = require("../../utils/quiz")
const { getWrongIds, getFavoriteIds, getRecords } = require("../../utils/quiz")

// 无需先选题库分类的全局工具
const GLOBAL_MODES = ["wrong", "favorite", "records"]
const MODE_ROUTES = {
  wrong: "/pages/quiz-wrong/quiz-wrong",
  favorite: "/pages/quiz-favorite/quiz-favorite",
  records: "/pages/quiz-records/quiz-records"
}

Page({
  data: {
    categories: quizCategories.map((item) => ({
      ...item,
      modeHint: "章节练习 · 专项刷题 · 模拟考试"
    })),
    modes: practiceModes.filter((m) => GLOBAL_MODES.includes(m.id)),
    stats: {},
    accuracy: 0,
    wrongCount: 0,
    favoriteCount: 0,
    recordCount: 0
  },

  onShow() {
    const stats = getQuizStats()
    this.setData({
      stats,
      accuracy: getAccuracy(),
      wrongCount: getWrongIds().length,
      favoriteCount: getFavoriteIds().length,
      recordCount: getRecords().length
    })
  },

  goCategory(e) {
    wx.navigateTo({
      url: `/pages/quiz-category/quiz-category?category=${e.currentTarget.dataset.id}`
    })
  },

  goMode(e) {
    const mode = e.currentTarget.dataset.mode
    const url = MODE_ROUTES[mode]
    if (url) wx.navigateTo({ url })
  }
})