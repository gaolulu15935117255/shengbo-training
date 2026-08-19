const { courses } = require("../../data/courses")
const { formatLearnedCount } = require("../../utils/util")
const auth = require("../../utils/auth")
const permission = require("../../utils/permission")
const { getQuizStats, getAccuracy, getWrongIds, getFavoriteIds } = require("../../utils/quiz")
const storage = require("../../utils/storage")

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    loggingIn: false,
    membershipLabel: "普通用户",
    membershipExpire: "",
    summary: "尚未开始学习",
    learnedCourses: [],
    stats: {},
    accuracy: 0,
    wrongCount: 0,
    favoriteCount: 0,
    unreadCount: 0,
    menuItems: [
      { icon: "📚", title: "我的课程", url: "/pages/courses/courses?mine=1" },
      { icon: "✎", title: "我的题库", url: "/pages/quiz/quiz" },
      { icon: "📋", title: "我的订单", url: "/pages/orders/orders" },
      { icon: "🔔", title: "消息通知", url: "/pages/messages/messages" },
      { icon: "ℹ️", title: "关于我们", url: "/pages/about/about" }
    ]
  },

  onShow() {
    const userInfo = auth.getUser()
    const learnedIds = getApp().globalData.learnedIds || []
    const learnedCourses = courses.filter((item) => learnedIds.includes(item.id))
    const stats = getQuizStats()
    const messages = storage.get(storage.KEYS.MESSAGES, [])
    const unreadCount = messages.filter((m) => !m.read).length

    this.setData({
      userInfo,
      isLoggedIn: !!userInfo,
      membershipLabel: permission.getMembershipLabel(),
      membershipExpire: permission.getMembershipExpireText(),
      summary: formatLearnedCount(learnedCourses.length),
      learnedCourses: learnedCourses.slice(0, 3),
      stats,
      accuracy: getAccuracy(),
      wrongCount: getWrongIds().length,
      favoriteCount: getFavoriteIds().length,
      unreadCount
    })
  },

  onLogin() {
    if (this.data.loggingIn) return
    this.setData({ loggingIn: true })
    auth
      .loginWithWechat()
      .then(() => {
        this.onShow()
        wx.showToast({ title: "登录成功", icon: "success" })
      })
      .catch((err) => {
        const msg = err.errMsg || ""
        if (msg.includes("cancel") || msg.includes("deny")) {
          wx.showToast({ title: "您取消了授权", icon: "none" })
        } else {
          wx.showToast({ title: "登录失败，请重试", icon: "none" })
        }
      })
      .finally(() => {
        this.setData({ loggingIn: false })
      })
  },

  onLogout() {
    wx.showModal({
      title: "退出登录",
      content: "确定要退出当前微信账号吗？",
      success: (res) => {
        if (res.confirm) {
          auth.logout()
          this.onShow()
          wx.showToast({ title: "已退出", icon: "none" })
        }
      }
    })
  },

  goMenu(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  },

  goShop() {
    wx.navigateTo({ url: "/pages/shop/shop?type=membership" })
  },

  goDetail(e) {
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${e.currentTarget.dataset.id}`
    })
  }
})
