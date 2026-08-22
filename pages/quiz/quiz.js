const { practiceModes } = require("../../data/questions")
const {
  getQuizStats,
  getWrongIds,
  getFavoriteIds,
  getRecords,
  syncWrongIds,
  syncFavoriteIds,
  syncRecords
} = require("../../utils/quiz")
const { quizApi } = require("../../utils/api")
const auth = require("../../utils/auth")
const config = require("../../config/api")

const GLOBAL_MODES = ["wrong", "favorite", "records"]
const MODE_ROUTES = {
  wrong: "/pages/quiz-wrong/quiz-wrong",
  favorite: "/pages/quiz-favorite/quiz-favorite",
  records: "/pages/quiz-records/quiz-records"
}

Page({
  data: {
    categories: [],
    modes: practiceModes.filter((m) => GLOBAL_MODES.includes(m.id)),
    stats: {},
    accuracy: 0,
    wrongCount: 0,
    favoriteCount: 0,
    recordCount: 0,
    loading: true
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const applyStats = (stats) => {
      const s = stats || getQuizStats()
      this.setData({
        stats: s,
        accuracy: s.accuracy != null
          ? s.accuracy
          : s.totalAnswered && s.totalCorrect
            ? Math.round((s.totalCorrect / s.totalAnswered) * 100)
            : 0,
        wrongCount: getWrongIds().length,
        favoriteCount: getFavoriteIds().length,
        recordCount: getRecords().length,
        loading: false
      })
    }

    const loadCategories = () => {
      if (config.useApi) {
        return quizApi.categories().then((categories) => {
          this.setData({
            categories: (categories || []).map((item) => ({
              id: item.categoryCode,
              name: item.name,
              icon: item.icon,
              desc: item.desc
            }))
          })
        })
      }
      const { quizCategories } = require("../../data/questions")
      this.setData({
        categories: quizCategories.map((item) => ({
          ...item,
          modeHint: "章节练习 · 专项刷题 · 模拟考试"
        }))
      })
      return Promise.resolve()
    }

    Promise.all([
      loadCategories(),
      syncWrongIds().catch(() => {}),
      syncFavoriteIds().catch(() => {}),
      syncRecords().catch(() => {}),
      config.useApi && auth.getToken()
        ? auth.refreshProfile().then((user) => user && user.stats).catch(() => null)
        : Promise.resolve(null)
    ])
      .then((results) => {
        const profileStats = results[4]
        applyStats(profileStats)
      })
      .catch((err) => {
        applyStats(getQuizStats())
        wx.showToast({
          title: (err && err.message) || "题库加载失败",
          icon: "none",
          duration: 2500
        })
      })
  },

  goCategory(e) {
    wx.navigateTo({
      url: `/pages/quiz-category/quiz-category?category=${e.currentTarget.dataset.id}`
    })
  },

  goMode(e) {
    const mode = e.currentTarget.dataset.mode
    const url = MODE_ROUTES[mode]
    if (!url) return
    auth
      .requireLogin()
      .then(() => {
        wx.navigateTo({ url })
      })
      .catch((err) => {
        if (err && err.code === "LOGIN_CANCEL") return
        wx.showToast({ title: (err && err.message) || "请先登录", icon: "none" })
      })
  }
})
