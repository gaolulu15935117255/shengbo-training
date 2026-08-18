const { getProductById } = require("../../data/products")
const { hasPurchased } = require("../../utils/permission")
const { mockPay } = require("../../utils/order")

Page({
  data: {
    product: null,
    purchased: false
  },

  onLoad(options) {
    const product = getProductById(options.id)
    if (!product) {
      wx.showToast({ title: "商品不存在", icon: "none" })
      return
    }
    this.setData({
      product,
      purchased: hasPurchased(product.id)
    })
    wx.setNavigationBarTitle({ title: product.title })
  },

  onShow() {
    if (this.data.product) {
      this.setData({ purchased: hasPurchased(this.data.product.id) })
    }
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
      confirmText: "模拟支付",
      success: (res) => {
        if (res.confirm) {
          mockPay(product)
          getApp().refreshUserData()
          this.setData({ purchased: true })
          wx.showToast({ title: "购买成功，权限已开通", icon: "success" })
        }
      }
    })
  },

  goLearn() {
    wx.navigateTo({ url: "/pages/quiz/quiz" })
  }
})
