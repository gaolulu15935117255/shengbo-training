const { categories, getCoursesByCategory } = require("../../data/courses")

Page({
  data: {
    categories,
    activeCategory: "all",
    list: []
  },

  onLoad(options) {
    const category = options.category || "all"
    this.setData({
      activeCategory: category,
      list: getCoursesByCategory(category)
    })
  },

  switchCategory(event) {
    const id = event.currentTarget.dataset.id
    this.setData({
      activeCategory: id,
      list: getCoursesByCategory(id)
    })
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${id}`
    })
  }
})
