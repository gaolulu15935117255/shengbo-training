const { productTypes, getProductsByType } = require("../../data/products")
const { hasPurchased } = require("../../utils/permission")

Page({
  data: {
    types: productTypes,
    activeType: "all",
    list: []
  },

  onLoad(options) {
    const type = options.type || "all"
    this.loadProducts(type)
  },

  onShow() {
    this.refreshPurchased()
  },

  loadProducts(type) {
    const list = getProductsByType(type).map((item) => ({
      ...item,
      purchased: hasPurchased(item.id)
    }))
    this.setData({ activeType: type, list })
  },

  refreshPurchased() {
    const list = this.data.list.map((item) => ({
      ...item,
      purchased: hasPurchased(item.id)
    }))
    this.setData({ list })
  },

  switchType(e) {
    this.loadProducts(e.currentTarget.dataset.id)
  },

  goDetail(e) {
    wx.navigateTo({
      url: `/pages/shop-detail/shop-detail?id=${e.currentTarget.dataset.id}`
    })
  }
})
