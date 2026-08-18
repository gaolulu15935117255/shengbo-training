const { getCourseById } = require("../../data/courses")

Page({
  data: {
    course: null,
    learned: false
  },

  onLoad(options) {
    const course = getCourseById(options.id)
    if (!course) {
      wx.showToast({ title: "课程不存在", icon: "none" })
      return
    }
    const learnedIds = getApp().globalData.learnedIds || []
    this.setData({
      course,
      learned: learnedIds.includes(course.id)
    })
    wx.setNavigationBarTitle({ title: course.title })
  },

  startLearn() {
    const course = this.data.course
    if (!course) return
    getApp().markLearned(course.id)
    this.setData({ learned: true })
    wx.showToast({ title: "已加入学习", icon: "success" })
  }
})
