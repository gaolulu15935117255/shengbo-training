const { ordersApi, payApi } = require("./api")
const auth = require("./auth")
const permission = require("./permission")

function requestWechatPay(params) {
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      timeStamp: String(params.timeStamp),
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType || "RSA",
      paySign: params.paySign,
      success: resolve,
      fail(err) {
        const msg = err.errMsg || ""
        if (msg.indexOf("cancel") !== -1) {
          const cancel = new Error("已取消支付")
          cancel.code = "PAY_CANCEL"
          reject(cancel)
          return
        }
        reject(new Error(msg || "支付失败"))
      }
    })
  })
}

function pollPaid(orderNo, remain = 6) {
  return ordersApi.status(orderNo).then((data) => {
    if (data.status === "paid") return data
    if (remain <= 1) return data
    return new Promise((resolve) => {
      setTimeout(() => resolve(pollPaid(orderNo, remain - 1)), 1000)
    })
  })
}

function afterPaid() {
  return Promise.all([
    auth.refreshProfile().catch(() => {}),
    permission.syncPurchasedFromApi().catch(() => {})
  ]).then(() => {
    const app = getApp()
    if (app && app.refreshUserData) app.refreshUserData()
  })
}

function payProduct(productCode) {
  return auth.requireLogin("登录后才能购买课程和会员").then(() => {
    wx.showLoading({ title: "正在下单", mask: true })
    return ordersApi
      .create({ productCode })
      .then((order) => payApi.prepay({ orderNo: order.orderNo }))
      .then((pay) => {
        wx.hideLoading()
        if (pay.mockPaid || pay.status === "paid") {
          return afterPaid().then(() => pay)
        }
        return requestWechatPay(pay)
          .then(() => {
            wx.showLoading({ title: "确认支付中", mask: true })
            return pollPaid(pay.orderNo)
          })
          .then((result) => {
            wx.hideLoading()
            if (result.status !== "paid") {
              throw new Error("支付结果确认中，请稍后在订单页查看")
            }
            return afterPaid().then(() => result)
          })
      })
      .catch((err) => {
        wx.hideLoading()
        throw err
      })
  })
}

function repayOrder(orderNo) {
  wx.showLoading({ title: "正在支付", mask: true })
  return ordersApi
    .repay(orderNo)
    .then((pay) => {
      wx.hideLoading()
      if (pay.mockPaid || pay.status === "paid") {
        return afterPaid().then(() => pay)
      }
      return requestWechatPay(pay)
        .then(() => {
          wx.showLoading({ title: "确认支付中", mask: true })
          return pollPaid(pay.orderNo || orderNo)
        })
        .then((result) => {
          wx.hideLoading()
          return afterPaid().then(() => result)
        })
    })
    .catch((err) => {
      wx.hideLoading()
      throw err
    })
}

module.exports = { payProduct, repayOrder, pollPaid, afterPaid }
