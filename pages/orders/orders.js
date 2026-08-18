const { getOrders, getOrderStatusLabel, formatOrderTime } = require("../../utils/order")

Page({
  data: {
    orders: []
  },

  onShow() {
    const orders = getOrders().map((o) => ({
      ...o,
      statusLabel: getOrderStatusLabel(o.status),
      timeText: formatOrderTime(o.createdAt)
    }))
    this.setData({ orders })
  }
})
