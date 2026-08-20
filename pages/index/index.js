const { brandInfo, contact } = require("../../data/brand")
const { contentApi, quizApi } = require("../../utils/api")
const config = require("../../config/api")

const BANNER_THEMES = ["blue", "green", "orange", "purple"]

Page({
  data: {
    banners: [],
    brandInfo,
    stats: [],
    announcements: [],
    contact,
    categories: [],
    hotProducts: [],
    featured: [],
    loading: true
  },

  onLoad() {
    this.loadHome()
  },

  loadHome() {
    if (!config.useApi) {
      const { banners, stats, announcements } = require("../../data/brand")
      const { getFeaturedCourses } = require("../../data/courses")
      const { products } = require("../../data/products")
      this.setData({
        banners,
        stats,
        announcements: announcements.slice(0, 3),
        categories: [
          { id: "nanny", name: "育儿嫂专项", icon: "👶", desc: "新生儿护理 · 辅食 · 早教" },
          { id: "housekeeper", name: "保姆家政专项", icon: "🏠", desc: "保洁 · 烹饪 · 礼仪" }
        ],
        hotProducts: products.sort((a, b) => b.sales - a.sales).slice(0, 3),
        featured: getFeaturedCourses(),
        loading: false
      })
      return
    }

    Promise.all([contentApi.home(), quizApi.categories()])
      .then(([home, categories]) => {
        const banners = (home.banners || []).map((item, index) => ({
          id: item.id,
          title: item.title,
          subtitle: item.title,
          tag: "圣博培训",
          theme: BANNER_THEMES[index % BANNER_THEMES.length],
          link: item.linkUrl || ""
        }))

        const hotProducts = (home.hotProducts || []).map((item) => ({
          id: item.productCode,
          title: item.title,
          type: item.type || "course",
          price: item.priceYuan || (item.price / 100).toFixed(2)
        }))

        const featured = (home.featuredCourses || []).map((item) => ({
          id: item.courseCode,
          title: item.title,
          level: item.level,
          duration: item.durationText
        }))

        this.setData({
          banners: banners.length ? banners : this.getFallbackBanners(),
          stats: home.stats || [],
          announcements: home.announcements || [],
          categories: (categories || []).map((cat) => ({
            id: cat.categoryCode,
            name: cat.name,
            icon: cat.icon,
            desc: cat.desc
          })),
          hotProducts,
          featured,
          loading: false
        })
      })
      .catch(() => {
        wx.showToast({ title: "加载失败，请检查后端", icon: "none" })
        this.setData({ loading: false, banners: this.getFallbackBanners() })
      })
  },

  getFallbackBanners() {
    return [
      {
        id: 1,
        title: "圣博育儿保姆培训",
        subtitle: "专业认证 · 系统课程 · 海量题库",
        tag: "圣博培训",
        theme: "blue",
        link: ""
      }
    ]
  },

  onBannerTap(e) {
    const link = e.currentTarget.dataset.link
    if (!link) return
    const tabPaths = ["/pages/index/index", "/pages/quiz/quiz", "/pages/shop/shop", "/pages/mine/mine"]
    const path = link.split("?")[0]
    if (tabPaths.includes(path)) {
      wx.reLaunch({ url: link })
    } else {
      wx.navigateTo({ url: link })
    }
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
