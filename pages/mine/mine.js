const { courses } = require("../../data/courses")
const { formatLearnedCount } = require("../../utils/util")
const auth = require("../../utils/auth")
const permission = require("../../utils/permission")
const {
  getQuizStats,
  getAccuracy,
  getWrongIds,
  getFavoriteIds,
  syncWrongIds,
  syncFavoriteIds
} = require("../../utils/quiz")
const storage = require("../../utils/storage")
const config = require("../../config/api")

Page({
  data: {
    userInfo: null,
    avatarLetter: "微",
    isLoggedIn: false,
    loggingIn: false,
    needsProfile: false,
    showProfileEditor: false,
    editNickName: "",
    editAvatarUrl: "",
    savingProfile: false,
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
    this.refreshPage()
  },

  refreshPage() {
    const applyLocal = () => {
      const userInfo = auth.getUser()
      const learnedIds = getApp().globalData.learnedIds || []
      const learnedCourses = courses.filter((item) => learnedIds.includes(item.id))
      const stats = userInfo && userInfo.stats ? userInfo.stats : getQuizStats()
      const messages = storage.get(storage.KEYS.MESSAGES, [])

      this.setData({
        userInfo,
        avatarLetter: (userInfo && userInfo.nickName ? userInfo.nickName : "微").charAt(0),
        isLoggedIn: auth.isLoggedIn(),
        needsProfile: auth.needsProfile(userInfo),
        membershipLabel: permission.getMembershipLabel(),
        membershipExpire: permission.getMembershipExpireText(),
        summary: formatLearnedCount(learnedCourses.length),
        learnedCourses: learnedCourses.slice(0, 3),
        stats,
        accuracy: stats.accuracy != null
          ? stats.accuracy
          : stats.totalAnswered && stats.totalCorrect
            ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
            : getAccuracy(),
        wrongCount: getWrongIds().length,
        favoriteCount: getFavoriteIds().length,
        unreadCount: messages.filter((m) => !m.read).length
      })
    }

    Promise.all([
      syncWrongIds().catch(() => {}),
      syncFavoriteIds().catch(() => {}),
      config.useApi && auth.getToken() ? auth.refreshProfile().catch(() => {}) : Promise.resolve()
    ]).finally(applyLocal)
  },

  onLogin() {
    if (this.data.loggingIn) return
    this.setData({ loggingIn: true })
    auth
      .authorizeAndLogin()
      .then((user) => {
        this.refreshPage()
        if (auth.needsProfile(user)) {
          this.openProfileEditor()
          wx.showToast({ title: "请选择微信头像和昵称", icon: "none" })
        } else {
          wx.showToast({ title: "授权成功", icon: "success" })
        }
      })
      .catch((err) => {
        const msg = err.errMsg || err.message || ""
        if (err.code === "AUTH_CANCEL" || msg.includes("cancel") || msg.includes("deny")) {
          wx.showToast({ title: "您取消了授权", icon: "none" })
        } else {
          wx.showToast({ title: msg.slice(0, 40) || "授权失败，请重试", icon: "none" })
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
          this.setData({ showProfileEditor: false })
          this.refreshPage()
          wx.showToast({ title: "已退出", icon: "none" })
        }
      }
    })
  },

  preventMove() {},

  openProfileEditor() {
    const user = auth.getUser() || {}
    const nick = (user.nickName || "").trim()
    this.setData({
      showProfileEditor: true,
      editNickName: nick === "微信用户" ? "" : nick,
      editAvatarUrl: user.avatarUrl || ""
    })
  },

  closeProfileEditor() {
    this.setData({ showProfileEditor: false })
  },

  onChooseAvatar(e) {
    const avatarUrl = (e.detail && e.detail.avatarUrl) || ""
    if (avatarUrl) {
      this.setData({ editAvatarUrl: avatarUrl })
    }
  },

  onNickNameBlur(e) {
    this.setData({ editNickName: (e.detail.value || "").trim() })
  },

  saveProfile(e) {
    if (this.data.savingProfile) return
    const formNick = e && e.detail && e.detail.value ? e.detail.value.nickName : ""
    const nickName = (formNick || this.data.editNickName || "").trim()
    const avatarUrl = this.data.editAvatarUrl || ""
    if (!nickName && !avatarUrl) {
      wx.showToast({ title: "请选择头像或填写昵称", icon: "none" })
      return
    }

    this.setData({ savingProfile: true })
    const isRemote = /^https?:\/\//i.test(avatarUrl)
    const upload = avatarUrl && !isRemote ? auth.uploadAvatar(avatarUrl) : Promise.resolve(avatarUrl)

    upload
      .then((remoteAvatar) => {
        const payload = {}
        if (nickName) payload.nickName = nickName
        if (remoteAvatar && /^https?:\/\//i.test(remoteAvatar)) payload.avatarUrl = remoteAvatar
        if (!payload.nickName && !payload.avatarUrl) return auth.getUser()
        return auth.updateProfile(payload)
      })
      .then(() => {
        this.setData({ showProfileEditor: false })
        this.refreshPage()
        wx.showToast({ title: "资料已保存", icon: "success" })
      })
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || "保存失败", icon: "none" })
      })
      .finally(() => {
        this.setData({ savingProfile: false })
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
