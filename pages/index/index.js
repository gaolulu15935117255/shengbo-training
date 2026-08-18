const { courses, categories } = require("../../data/courses")

Page({
  data: {
    heroTitle: "圣博培训",
    heroDesc: "育儿嫂 · 保姆技能提升",
    categories: categories.filter((item) => item.id !== "all"),
    featured: courses.slice(0, 3)
  },

  goCourses(event) {
    const category = event.currentTarget.dataset.category || "all"
    wx.navigateTo({
      url: `/pages/courses/courses?category=${category}`
    })
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${id}`
    })
  }
})
