const { listCourses, listMyCourses } = require("../../utils/course")
const { categories: defaultCategories } = require("../../data/courses")

Page({
  data: {
    categories: defaultCategories,
    activeCategory: "all",
    list: [],
    mineOnly: false,
    loading: true
  },

  onLoad(options) {
    this.mineOnly = options.mine === "1"
    if (this.mineOnly) {
      wx.setNavigationBarTitle({ title: "我的课程" })
    }
    this.setData({
      mineOnly: this.mineOnly,
      activeCategory: options.category || "all"
    })
  },

  onShow() {
    this.loadList(this.data.activeCategory)
  },

  loadList(category) {
    const fetcher = this.mineOnly
      ? listMyCourses().then((list) => {
          const filtered = !category || category === "all"
            ? list
            : list.filter((item) => item.category === category)
          return { list: filtered, categories: this.data.categories }
        })
      : listCourses(category)

    fetcher
      .then((data) => {
        this.setData({
          activeCategory: category,
          categories: data.categories && data.categories.length
            ? data.categories
            : this.data.categories,
          list: data.list || [],
          loading: false
        })
      })
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || "加载失败", icon: "none" })
        this.setData({ loading: false })
      })
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
