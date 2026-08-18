const { categories, getCoursesByCategory } = require("../../data/courses")
const { hasCourseAccess } = require("../../utils/permission")
const { formatPrice } = require("../../utils/util")

Page({
  data: {
    categories,
    activeCategory: "all",
    list: []
  },

  onLoad(options) {
    const category = options.category || "all"
    this.loadList(category)
  },

  loadList(category) {
    const list = getCoursesByCategory(category).map((item) => ({
      ...item,
      priceText: formatPrice(item.price),
      locked: !hasCourseAccess(item)
    }))
    this.setData({ activeCategory: category, list })
  },

  onShow() {
    this.loadList(this.data.activeCategory)
  },

  switchCategory(e) {
    this.loadList(e.currentTarget.dataset.id)
  },

  goDetail(e) {
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${e.currentTarget.dataset.id}`
    })
  }
})
