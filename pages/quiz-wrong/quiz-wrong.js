const { getWrongIds, clearWrong } = require("../../utils/quiz")
const { getQuestionById } = require("../../data/questions")

Page({
  data: {
    list: []
  },

  onShow() {
    const list = getWrongIds().map(getQuestionById).filter(Boolean)
    this.setData({ list })
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
          clearWrong()
          this.setData({ list: [] })
          wx.showToast({ title: "已清空", icon: "success" })
        }
      }
    })
  }
})
