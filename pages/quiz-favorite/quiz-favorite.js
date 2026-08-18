const { getFavoriteIds } = require("../../utils/quiz")
const { getQuestionById } = require("../../data/questions")

Page({
  data: {
    list: []
  },

  onShow() {
    const list = getFavoriteIds().map(getQuestionById).filter(Boolean)
    this.setData({ list })
  },

  startPractice() {
    if (this.data.list.length === 0) {
      wx.showToast({ title: "暂无收藏", icon: "none" })
      return
    }
    wx.navigateTo({ url: "/pages/quiz-practice/quiz-practice?mode=favorite" })
  }
})
