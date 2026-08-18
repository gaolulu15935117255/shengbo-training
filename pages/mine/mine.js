const { courses } = require("../../data/courses")
const { formatLearnedCount } = require("../../utils/util")

Page({
  data: {
    summary: "尚未开始学习",
    learnedCourses: []
  },

  onShow() {
    const learnedIds = getApp().globalData.learnedIds || []
    const learnedCourses = courses.filter((item) => learnedIds.includes(item.id))
    this.setData({
      summary: formatLearnedCount(learnedCourses.length),
      learnedCourses
    })
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${id}`
    })
  }
})
