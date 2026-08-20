const { productsApi } = require("../../utils/api")
const { hasPurchased, syncPurchasedFromApi } = require("../../utils/permission")
const { mockPay } = require("../../utils/order")
const config = require("../../config/api")

function mapProduct(item) {
  return {
    id: item.productCode || item.id,
    productCode: item.productCode || item.id,
    type: item.type,
    title: item.title,
    desc: item.desc || item.detail || "",
    price: item.priceYuan || item.price,
    originalPrice: item.originalPrice
      ? (item.originalPrice / 100).toFixed(2)
      : item.originalPrice,
    benefits: item.benefits || [],
    target: item.target || item.targetAudience || "",
    purchased: !!item.purchased
  }
}

Page({
  data: {
    product: null,
    purchased: false,
    loading: true
  },

  onLoad(options) {
    this.productCode = options.id
    this.loadProduct()
  },

  onShow() {
    if (this.data.product) {
      this.refreshPurchased()
    }
  },

  loadProduct() {
    if (!config.useApi) {
      const { getProductById } = require("../../data/products")
      const product = getProductById(this.productCode)
      if (!product) {
        wx.showToast({ title: "商品不存在", icon: "none" })
        return
      }
      this.setData({
        product,
        purchased: hasPurchased(product.id),
        loading: false
      })
      wx.setNavigationBarTitle({ title: product.title })
      return
    }

    productsApi
      .detail(this.productCode)
      .then((item) => {
        const product = mapProduct(item)
        this.setData({
          product,
          purchased: product.purchased,
          loading: false
        })
        wx.setNavigationBarTitle({ title: product.title })
      })
      .catch(() => {
        wx.showToast({ title: "商品不存在", icon: "none" })
        this.setData({ loading: false })
      })
  },

  refreshPurchased() {
    if (!config.useApi) {
      this.setData({ purchased: hasPurchased(this.data.product.id) })
      return
    }
    syncPurchasedFromApi().then(() => {
      const purchased = require("../../utils/permission").getPurchasedIds()
      this.setData({
        purchased:
          purchased.includes(this.data.product.id) ||
          purchased.includes(this.data.product.productCode)
      })
    })
  },

  buyNow() {
    const product = this.data.product
    if (!product) return
    if (this.data.purchased) {
      wx.showToast({ title: "您已购买", icon: "none" })
      return
    }

    wx.showModal({
      title: "确认购买",
      content: `确定购买「${product.title}」？价格 ¥${product.price}`,
      confirmText: config.useApi ? "暂不支持在线支付" : "模拟支付",
      success: (res) => {
        if (!res.confirm) return
        if (config.useApi) {
          wx.showToast({ title: "支付接口开发中", icon: "none" })
          return
        }
        mockPay(product)
        getApp().refreshUserData()
        this.setData({ purchased: true })
        wx.showToast({ title: "购买成功，权限已开通", icon: "success" })
      }
    })
  },

  goLearn() {
    wx.navigateTo({ url: "/pages/quiz/quiz" })
  }
})
