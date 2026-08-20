const config = require("../config/api")
const { productsApi } = require("./api")
const storage = require("./storage")
const auth = require("./auth")

function getPurchasedIds() {
  return storage.get(storage.KEYS.PURCHASED, [])
}

function getMembership() {
  const user = auth.getUser()
  if (user && user.membershipLabel && user.membershipLabel !== "普通用户") {
    return {
      level: user.membershipLabel,
      expireAt: user.membershipExpire ? new Date(user.membershipExpire).getTime() : -1
    }
  }
  return storage.get(storage.KEYS.MEMBERSHIP, null)
}

function hasMembership() {
  const user = auth.getUser()
  if (user && user.membershipLabel && user.membershipLabel !== "普通用户") {
    if (!user.membershipExpire) return true
    return new Date(user.membershipExpire).getTime() > Date.now()
  }
  const membership = getMembership()
  if (!membership) return false
  if (membership.level === "lifetime" || membership.level === "终身会员") return true
  return membership.expireAt > Date.now()
}

function getMembershipLabel() {
  const user = auth.getUser()
  if (user && user.membershipLabel) return user.membershipLabel
  const membership = getMembership()
  if (!hasMembership()) return "普通用户"
  const labels = {
    month: "月度会员",
    year: "年度会员",
    lifetime: "终身会员"
  }
  return labels[membership.level] || membership.level || "会员"
}

function getMembershipExpireText() {
  const user = auth.getUser()
  if (user && user.membershipExpire) {
    const date = new Date(user.membershipExpire)
    return `有效期至 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }
  if (user && user.membershipLabel && user.membershipLabel !== "普通用户" && !user.membershipExpire) {
    return "永久有效"
  }
  const membership = getMembership()
  if (!membership) return ""
  if (membership.level === "lifetime") return "永久有效"
  if (membership.expireAt <= Date.now()) return "已过期"
  const date = new Date(membership.expireAt)
  return `有效期至 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function hasPurchased(productId) {
  return getPurchasedIds().includes(productId)
}

function hasCategoryAccess(_categoryId) {
  if (hasMembership()) return true
  return getPurchasedIds().length > 0
}

function hasCourseAccess(course) {
  if (!course) return false
  if (course.free) return true
  return hasMembership()
}

function hasQuizAccess(_question) {
  return true
}

function hasSubcategoryAccess(subcategory) {
  if (subcategory.isFree || subcategory.free) return true
  if (subcategory.locked === false) return true
  if (hasMembership()) return true
  return false
}

function grantProduct(product) {
  const purchased = getPurchasedIds()
  if (!purchased.includes(product.id)) {
    purchased.push(product.id)
    storage.set(storage.KEYS.PURCHASED, purchased)
  }
  syncGlobalData()
}

function syncPurchasedFromApi() {
  if (!config.useApi || !auth.getToken()) {
    return Promise.resolve(getPurchasedIds())
  }
  return productsApi.list({ page: 1, pageSize: 100 }).then((data) => {
    const purchased = (data.list || [])
      .filter((item) => item.purchased)
      .map((item) => item.productCode)
    storage.set(storage.KEYS.PURCHASED, purchased)
    syncGlobalData()
    return purchased
  })
}

function syncGlobalData() {
  const app = getApp()
  if (!app) return
  app.globalData.purchasedIds = getPurchasedIds()
  app.globalData.membership = getMembership()
}

module.exports = {
  getPurchasedIds,
  getMembership,
  hasMembership,
  getMembershipLabel,
  getMembershipExpireText,
  hasPurchased,
  hasCategoryAccess,
  hasCourseAccess,
  hasQuizAccess,
  hasSubcategoryAccess,
  grantProduct,
  syncPurchasedFromApi,
  syncGlobalData
}
