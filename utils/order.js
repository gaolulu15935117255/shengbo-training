const storage = require("./storage")
const { grantProduct } = require("./permission")

function generateOrderNo() {
  const now = Date.now()
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `SB${now}${rand}`
}

function getOrders() {
  return storage.get(storage.KEYS.ORDERS, [])
}

function createOrder(product) {
  const order = {
    id: generateOrderNo(),
    productId: product.id,
    productTitle: product.title,
    price: product.price,
    status: "pending",
    createdAt: Date.now(),
    paidAt: null
  }
  const orders = getOrders()
  orders.unshift(order)
  storage.set(storage.KEYS.ORDERS, orders)
  return order
}

function payOrder(orderId) {
  const orders = getOrders()
  const index = orders.findIndex((o) => o.id === orderId)
  if (index < 0) return null
  const order = orders[index]
  if (order.status === "paid") return order

  const { getProductById } = require("../data/products")
  const product = getProductById(order.productId)
  if (!product) return null

  order.status = "paid"
  order.paidAt = Date.now()
  orders[index] = order
  storage.set(storage.KEYS.ORDERS, orders)

  grantProduct(product)
  return order
}

function mockPay(product) {
  const order = createOrder(product)
  return payOrder(order.id)
}

function getOrderStatusLabel(status) {
  const map = {
    pending: "待支付",
    paid: "已支付",
    expired: "已过期",
    refunded: "已退款"
  }
  return map[status] || status
}

function formatOrderTime(timestamp) {
  if (!timestamp) return ""
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

module.exports = {
  getOrders,
  createOrder,
  payOrder,
  mockPay,
  getOrderStatusLabel,
  formatOrderTime
}
