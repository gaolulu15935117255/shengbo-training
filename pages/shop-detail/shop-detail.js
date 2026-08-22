const { productsApi } = require("../../utils/api")
const { hasPurchased, syncPurchasedFromApi } = require("../../utils/permission")
const { mockPay } = require("../../utils/order")
const { payProduct } = require("../../utils/pay")
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
    purchased: !!item.purchased,
    rating: item.rating
  }
}

Page({
  data: {
    product: null,
    purchased: false,
    loading: true,
    paying: false
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
      return productsApi.detail(this.productCode)
    }).then((item) => {
      if (!item) return
      this.setData({ purchased: !!item.purchased })
    }).catch(() => {})
  },

  buyNow() {
    const product = this.data.product
    if (!product || this.data.paying) return
    if (this.data.purchased) {
      wx.showToast({ title: "您已购买", icon: "none" })
      return
    }

    wx.showModal({
      title: "确认购买",
      content: `确定购买「${product.title}」？价格 ¥${product.price}`,
      confirmText: "立即支付",
      success: (res) => {
        if (!res.confirm) return
        if (!config.useApi) {
          mockPay(product)
          getApp().refreshUserData()
          this.setData({ purchased: true })
          wx.showToast({ title: "购买成功，权限已开通", icon: "success" })
          return
        }
        this.setData({ paying: true })
        payProduct(product.productCode || product.id)
          .then(() => {
            this.setData({ purchased: true })
            wx.showToast({ title: "购买成功，权限已开通", icon: "success" })
          })
          .catch((err) => {
            if (err && (err.code === "PAY_CANCEL" || err.code === "LOGIN_CANCEL" || err.code === "AUTH_CANCEL")) {
              wx.showToast({ title: err.message || "已取消", icon: "none" })
              return
            }
            wx.showToast({ title: (err && err.message) || "支付失败", icon: "none" })
          })
          .finally(() => {
            this.setData({ paying: false })
          })
      }
    })
  },

  goLearn() {
    wx.navigateTo({ url: "/pages/quiz/quiz" })
  }
})
