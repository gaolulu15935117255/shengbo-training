const { getOrders, getOrderStatusLabel, formatOrderTime } = require("../../utils/order")
const { ordersApi } = require("../../utils/api")
const { repayOrder } = require("../../utils/pay")
const auth = require("../../utils/auth")
const config = require("../../config/api")

Page({
  data: {
    orders: [],
    loading: false
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    if (!config.useApi) {
      const orders = getOrders().map((o) => ({
        ...o,
        orderNo: o.id,
        amountYuan: o.price,
        statusLabel: getOrderStatusLabel(o.status),
        timeText: formatOrderTime(o.createdAt),
        canPay: o.status === "pending"
      }))
      this.setData({ orders })
      return
    }

    if (!auth.isLoggedIn()) {
      this.setData({ orders: [] })
      auth
        .requireLogin("登录后查看云端订单")
        .then(() => this.loadOrders())
        .catch(() => {})
      return
    }

    this.setData({ loading: true })
    ordersApi
      .list({ page: 1, pageSize: 50, status: "all" })
      .then((data) => {
        const orders = (data.list || []).map((o) => ({
          ...o,
          id: o.orderNo,
          price: o.amountYuan,
          statusLabel: o.statusLabel || getOrderStatusLabel(o.status),
          timeText: formatOrderTime(o.createdAt),
          canPay: o.status === "pending"
        }))
        this.setData({ orders, loading: false })
      })
      .catch((err) => {
        this.setData({ loading: false })
        wx.showToast({ title: (err && err.message) || "订单加载失败", icon: "none" })
      })
  },

  onRepay(e) {
    const orderNo = e.currentTarget.dataset.orderno
    if (!orderNo) return
    repayOrder(orderNo)
      .then((result) => {
        if (!result || result.status === "paid" || result.mockPaid) {
          wx.showToast({ title: "支付成功", icon: "success" })
        }
        this.loadOrders()
      })
      .catch((err) => {
        if (err && err.code === "PAY_CANCEL") {
          wx.showToast({ title: "已取消支付", icon: "none" })
          return
        }
        wx.showToast({ title: (err && err.message) || "支付失败", icon: "none" })
      })
  }
})
