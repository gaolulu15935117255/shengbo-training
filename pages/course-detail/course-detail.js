const { getCourseDetail, startCourse } = require("../../utils/course")
const auth = require("../../utils/auth")
const config = require("../../config/api")

Page({
  data: {
    course: null,
    learned: false,
    hasAccess: false,
    priceText: "",
    progress: 0,
    saving: false
  },

  onLoad(options) {
    this.courseCode = options.id
    this.loadDetail()
  },

  onShow() {
    if (this.courseCode && this.data.course) {
      this.loadDetail(true)
    }
  },

  loadDetail(silent) {
    getCourseDetail(this.courseCode)
      .then((course) => {
        this.setData({
          course,
          learned: !!course.learned,
          hasAccess: !!course.hasAccess,
          priceText: course.priceText,
          progress: course.progress || 0
        })
        wx.setNavigationBarTitle({ title: course.title })
      })
      .catch(() => {
        if (!silent) wx.showToast({ title: "课程不存在", icon: "none" })
      })
  },

  startLearn() {
    const course = this.data.course
    if (!course || this.data.saving) return
    if (!this.data.hasAccess) {
      this.goBuy()
      return
    }
    if (config.useApi && !auth.isLoggedIn()) {
      auth.requireLogin("登录后学习进度会保存到您的微信账号").then(() => this.startLearn()).catch(() => {})
      return
    }
    this.setData({ saving: true })
    startCourse(course.courseCode || course.id)
      .then((result) => {
        this.setData({
          learned: true,
          progress: (result && result.progress) || this.data.progress
        })
        wx.showToast({ title: this.data.progress > 0 ? "继续学习" : "已开始学习", icon: "success" })
      })
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || "保存进度失败", icon: "none" })
      })
      .finally(() => {
        this.setData({ saving: false })
      })
  },

  markLesson(e) {
    const course = this.data.course
    const lessonId = Number(e.currentTarget.dataset.id)
    if (!course || !lessonId || this.data.saving) return
    if (!this.data.hasAccess) {
      this.goBuy()
      return
    }
    if (config.useApi && !auth.isLoggedIn()) {
      auth.requireLogin("登录后学习进度会保存到您的微信账号").then(() => this.markLesson(e)).catch(() => {})
      return
    }
    const lesson = (course.lessons || []).find((item) => item.id === lessonId)
    if (lesson && lesson.learned) return

    this.setData({ saving: true })
    startCourse(course.courseCode || course.id, { learnedLessonId: lessonId })
      .then((result) => {
        const lessons = (course.lessons || []).map((item) => (
          item.id === lessonId ? { ...item, learned: true } : item
        ))
        this.setData({
          course: { ...course, lessons },
          learned: true,
          progress: (result && result.progress) || 0
        })
      })
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || "保存进度失败", icon: "none" })
      })
      .finally(() => {
        this.setData({ saving: false })
      })
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
    const cat = this.data.course && this.data.course.category
    const quizCat = cat === "housekeeper" ? "housekeeper" : "nanny"
    wx.navigateTo({
      url: `/pages/quiz-category/quiz-category?category=${quizCat}`
    })
  }
})
