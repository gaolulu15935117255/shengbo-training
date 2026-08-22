const { syncFavoriteIds } = require("../../utils/quiz")
const { quizApi } = require("../../utils/api")
const config = require("../../config/api")

Page({
  data: {
    list: [],
    loading: true
  },

  onShow() {
    this.loadList()
  },

  loadList() {
    if (!config.useApi) {
      const { getFavoriteIds } = require("../../utils/quiz")
      const { getQuestionById } = require("../../data/questions")
      const list = getFavoriteIds().map(getQuestionById).filter(Boolean)
      this.setData({ list, loading: false })
      return
    }

    syncFavoriteIds()
      .then((ids) => {
        if (!ids.length) {
          this.setData({ list: [], loading: false })
          return null
        }
        return quizApi.questionsBatch(ids, false)
      })
      .then((questions) => {
        if (!questions) return
        this.setData({ list: questions, loading: false })
      })
      .catch(() => {
        this.setData({ loading: false })
        wx.showToast({ title: "加载失败", icon: "none" })
      })
  },

  startPractice() {
    if (this.data.list.length === 0) {
      wx.showToast({ title: "暂无收藏", icon: "none" })
      return
    }
    const auth = require("../../utils/auth")
    auth
      .requireLogin()
      .then(() => {
        wx.navigateTo({ url: "/pages/quiz-practice/quiz-practice?mode=favorite" })
      })
      .catch((err) => {
        if (err && err.code === "LOGIN_CANCEL") return
        wx.showToast({ title: (err && err.message) || "请先登录", icon: "none" })
      })
  }
})
