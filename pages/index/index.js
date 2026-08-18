const { banners, brandInfo, stats, announcements, contact } = require("../../data/brand")
const { getFeaturedCourses } = require("../../data/courses")
const { products } = require("../../data/products")

Page({
  data: {
    banners,
    brandInfo,
    stats,
    announcements: announcements.slice(0, 3),
    contact,
    categories: [
      { id: "nanny", name: "育儿嫂专项", icon: "👶", desc: "新生儿护理 · 辅食 · 早教" },
      { id: "housekeeper", name: "保姆家政专项", icon: "🏠", desc: "保洁 · 烹饪 · 礼仪" }
    ],
    hotProducts: products.sort((a, b) => b.sales - a.sales).slice(0, 3),
    featured: getFeaturedCourses()
  },

  onBannerTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) wx.navigateTo({ url: link })
  },

  goQuiz(e) {
    const category = e.currentTarget.dataset.category
    wx.navigateTo({
      url: `/pages/quiz-category/quiz-category?category=${category}`
    })
  },

  goShop() {
    wx.navigateTo({ url: "/pages/shop/shop" })
  },

  goProduct(e) {
    wx.navigateTo({
      url: `/pages/shop-detail/shop-detail?id=${e.currentTarget.dataset.id}`
    })
  },

  goCourse(e) {
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${e.currentTarget.dataset.id}`
    })
  },

  goAnnouncement(e) {
    wx.navigateTo({
      url: `/pages/announcement/announcement?id=${e.currentTarget.dataset.id}`
    })
  },

  callPhone() {
    wx.makePhoneCall({ phoneNumber: contact.phone.replace(/-/g, "") })
  },

  copyWechat() {
    wx.setClipboardData({
      data: contact.wechat,
      success: () => wx.showToast({ title: "微信号已复制", icon: "success" })
    })
  },

  openLocation() {
    wx.openLocation({
      latitude: contact.latitude,
      longitude: contact.longitude,
      name: "圣博培训基地",
      address: contact.address
    })
  }
})
