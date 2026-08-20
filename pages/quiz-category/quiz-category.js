const { practiceModes } = require("../../data/questions")
const { quizApi } = require("../../utils/api")
const { hasSubcategoryAccess } = require("../../utils/permission")
const config = require("../../config/api")

Page({
  data: {
    category: null,
    subcategories: [],
    modes: practiceModes.filter((m) => ["chapter", "special", "mock"].includes(m.id)),
    hasAccess: false,
    loading: true
  },

  onLoad(options) {
    this.categoryCode = options.category
    this.loadCategory()
  },

  loadCategory() {
    if (!config.useApi) {
      const { getCategoryById, getQuestionsBySubcategory } = require("../../data/questions")
      const { hasCategoryAccess } = require("../../utils/permission")
      const category = getCategoryById(this.categoryCode)
      if (!category) {
        wx.showToast({ title: "分类不存在", icon: "none" })
        return
      }
      const hasAccess = hasCategoryAccess(category.id)
      const subcategories = category.subcategories.map((sub) => ({
        ...sub,
        questionCount: getQuestionsBySubcategory(sub.id).length,
        locked: !hasSubcategoryAccess(sub, category.id)
      }))
      this.setData({ category, subcategories, hasAccess, loading: false })
      wx.setNavigationBarTitle({ title: category.name })
      return
    }

    quizApi
      .categories()
      .then((categories) => {
        const category = (categories || []).find((c) => c.categoryCode === this.categoryCode)
        if (!category) {
          wx.showToast({ title: "分类不存在", icon: "none" })
          return
        }
        const subcategories = (category.subcategories || []).map((sub) => ({
          id: sub.id,
          name: sub.name,
          questionCount: sub.questionCount,
          free: sub.isFree,
          locked: sub.locked
        }))
        const hasAccess = (category.subcategories || [])
          .filter((sub) => !sub.isFree)
          .every((sub) => !sub.locked)
        this.setData({
          category: {
            id: category.id,
            categoryCode: category.categoryCode,
            name: category.name,
            icon: category.icon,
            desc: category.desc
          },
          subcategories,
          hasAccess,
          loading: false
        })
        wx.setNavigationBarTitle({ title: category.name })
      })
      .catch(() => {
        wx.showToast({ title: "加载失败", icon: "none" })
        this.setData({ loading: false })
      })
  },

  startChapter(e) {
    const sub = e.currentTarget.dataset.sub
    if (sub.locked) {
      this.showUnlockTip()
      return
    }
    wx.navigateTo({
      url: `/pages/quiz-practice/quiz-practice?mode=chapter&subcategoryId=${sub.id}&categoryId=${this.data.category.id}`
    })
  },

  startMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === "mock" && !this.data.hasAccess) {
      this.showUnlockTip()
      return
    }
    wx.navigateTo({
      url: `/pages/quiz-practice/quiz-practice?mode=${mode}&categoryId=${this.data.category.id}`
    })
  },

  showUnlockTip() {
    wx.showModal({
      title: "需要解锁",
      content: "该内容为付费资源，购买对应课程或开通会员即可解锁",
      confirmText: "去购买",
      success: (res) => {
        if (res.confirm) wx.navigateTo({ url: "/pages/shop/shop" })
      }
    })
  }
})
