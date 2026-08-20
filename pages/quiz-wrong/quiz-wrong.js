const { clearWrongRemote, syncWrongIds } = require("../../utils/quiz")
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
      const { getWrongIds } = require("../../utils/quiz")
      const { getQuestionById } = require("../../data/questions")
      const list = getWrongIds().map(getQuestionById).filter(Boolean)
      this.setData({ list, loading: false })
      return
    }

    syncWrongIds()
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
      wx.showToast({ title: "暂无错题", icon: "none" })
      return
    }
    wx.navigateTo({ url: "/pages/quiz-practice/quiz-practice?mode=wrong" })
  },

  clearAll() {
    wx.showModal({
      title: "确认清空",
      content: "确定要清空所有错题吗？",
      success: (res) => {
        if (res.confirm) {
          clearWrongRemote().then(() => {
            this.setData({ list: [] })
            wx.showToast({ title: "已清空", icon: "success" })
          })
        }
      }
    })
  }
})
