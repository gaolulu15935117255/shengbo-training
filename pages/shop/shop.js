const { productTypes } = require("../../data/products")
const { productsApi } = require("../../utils/api")
const { hasPurchased, syncPurchasedFromApi } = require("../../utils/permission")
const config = require("../../config/api")

function mapProduct(item) {
  return {
    id: item.productCode || item.id,
    productCode: item.productCode || item.id,
    type: item.type,
    title: item.title,
    desc: item.desc || item.description || "",
    price: item.priceYuan || item.price,
    originalPrice: item.originalPrice
      ? (item.originalPrice / 100).toFixed(2)
      : item.originalPrice,
    sales: item.salesCount || item.sales || 0,
    purchased: !!item.purchased
  }
}

Page({
  data: {
    types: productTypes,
    activeType: "all",
    list: [],
    loading: true
  },

  onLoad(options) {
    this.initialType = options.type || "all"
    this.loadProducts(this.initialType)
  },

  onShow() {
    this.loadProducts(this.data.activeType || this.initialType || "all")
  },

  loadProducts(type) {
    if (!config.useApi) {
      const { getProductsByType } = require("../../data/products")
      const list = getProductsByType(type).map((item) => ({
        ...item,
        purchased: hasPurchased(item.id)
      }))
      this.setData({ activeType: type, list, loading: false })
      return
    }

    this.setData({ loading: true })
    const params = { page: 1, pageSize: 50 }
    if (type && type !== "all") params.type = type

    productsApi
      .list(params)
      .then((data) => {
        const list = (data.list || []).map(mapProduct)
        this.setData({ activeType: type, list, loading: false })
      })
      .catch(() => {
        wx.showToast({ title: "商品加载失败", icon: "none" })
        this.setData({ loading: false })
      })
  },

  refreshPurchased() {
    if (!config.useApi) {
      const list = this.data.list.map((item) => ({
        ...item,
        purchased: hasPurchased(item.id)
      }))
      this.setData({ list })
      return
    }
    syncPurchasedFromApi().then(() => {
      const purchased = require("../../utils/permission").getPurchasedIds()
      const list = this.data.list.map((item) => ({
        ...item,
        purchased: purchased.includes(item.id) || purchased.includes(item.productCode)
      }))
      this.setData({ list })
    })
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
