const {
  getCategoryById,
  getQuestionsBySubcategory,
  practiceModes
} = require("../../data/questions")
const { hasSubcategoryAccess, hasCategoryAccess } = require("../../utils/permission")

Page({
  data: {
    category: null,
    subcategories: [],
    modes: practiceModes.filter((m) => ["chapter", "special", "mock"].includes(m.id)),
    hasAccess: false
  },

  onLoad(options) {
    const category = getCategoryById(options.category)
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
    this.setData({ category, subcategories, hasAccess })
    wx.setNavigationBarTitle({ title: category.name })
  },

  startChapter(e) {
    const sub = e.currentTarget.dataset.sub
    if (sub.locked) {
      this.showUnlockTip()
      return
    }
    wx.navigateTo({
      url: `/pages/quiz-practice/quiz-practice?mode=chapter&subcategory=${sub.id}&category=${this.data.category.id}`
    })
  },

  startMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === "mock" && !this.data.hasAccess) {
      this.showUnlockTip()
      return
    }
    wx.navigateTo({
      url: `/pages/quiz-practice/quiz-practice?mode=${mode}&category=${this.data.category.id}`
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
