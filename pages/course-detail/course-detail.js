const { getCourseById } = require("../../data/courses")
const { hasCourseAccess } = require("../../utils/permission")
const { formatPrice } = require("../../utils/util")

Page({
  data: {
    course: null,
    learned: false,
    hasAccess: false,
    priceText: ""
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
      learned: learnedIds.includes(course.id),
      hasAccess: hasCourseAccess(course),
      priceText: formatPrice(course.price)
    })
    wx.setNavigationBarTitle({ title: course.title })
  },

  onShow() {
    if (this.data.course) {
      this.setData({ hasAccess: hasCourseAccess(this.data.course) })
    }
  },

  startLearn() {
    const course = this.data.course
    if (!course) return
    if (!this.data.hasAccess) {
      this.goBuy()
      return
    }
    getApp().markLearned(course.id)
    this.setData({ learned: true })
    wx.showToast({ title: "已开始学习", icon: "success" })
  },

  goBuy() {
    wx.showModal({
      title: "需要解锁",
      content: "该课程为付费内容，购买对应课程包或开通会员即可学习",
      confirmText: "去购买",
      success: (res) => {
        if (res.confirm) wx.navigateTo({ url: "/pages/shop/shop" })
      }
    })
  },

  goQuiz() {
    const cat = this.data.course.category
    const quizCat = cat === "housekeeper" ? "housekeeper" : "nanny"
    wx.navigateTo({
      url: `/pages/quiz-category/quiz-category?category=${quizCat}`
    })
  }
})
