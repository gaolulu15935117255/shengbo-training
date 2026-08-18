const { quizCategories, practiceModes } = require("../../data/questions")
const { getQuizStats, getAccuracy } = require("../../utils/quiz")
const { getWrongIds, getFavoriteIds, getRecords } = require("../../utils/quiz")

Page({
  data: {
    categories: quizCategories,
    modes: practiceModes,
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
    const routes = {
      wrong: "/pages/quiz-wrong/quiz-wrong",
      favorite: "/pages/quiz-favorite/quiz-favorite",
      records: "/pages/quiz-records/quiz-records"
    }
    if (routes[mode]) {
      wx.navigateTo({ url: routes[mode] })
      return
    }
    wx.showToast({ title: "请先选择题库分类", icon: "none" })
  }
})
