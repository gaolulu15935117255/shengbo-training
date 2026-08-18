const storage = require("./storage")

function getPurchasedIds() {
  return storage.get(storage.KEYS.PURCHASED, [])
}

function getMembership() {
  return storage.get(storage.KEYS.MEMBERSHIP, null)
}

function hasMembership() {
  const membership = getMembership()
  if (!membership) return false
  if (membership.level === "lifetime") return true
  return membership.expireAt > Date.now()
}

function getMembershipLabel() {
  const membership = getMembership()
  if (!hasMembership()) return "普通用户"
  const labels = {
    month: "月度会员",
    year: "年度会员",
    lifetime: "终身会员"
  }
  return labels[membership.level] || "会员"
}

function getMembershipExpireText() {
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

function hasCategoryAccess(categoryId) {
  if (hasMembership()) return true
  const purchased = getPurchasedIds()
  const { products } = require("../data/products")
  return purchased.some((pid) => {
    const product = products.find((p) => p.id === pid)
    return product && (
      product.unlockAll ||
      (product.unlockCategories && product.unlockCategories.includes(categoryId))
    )
  })
}

function hasCourseAccess(course) {
  if (!course) return false
  if (course.free) return true
  if (hasMembership()) return true
  const purchased = getPurchasedIds()
  const { products } = require("../data/products")
  return purchased.some((pid) => {
    const product = products.find((p) => p.id === pid)
    return product && (
      product.unlockAll ||
      (product.unlockCourses && product.unlockCourses.includes(course.id))
    )
  })
}

function hasQuizAccess(question) {
  if (!question) return false
  if (question.free) return true
  if (hasMembership()) return true
  return hasCategoryAccess(question.category)
}

function hasSubcategoryAccess(subcategory, categoryId) {
  if (subcategory.free) return true
  if (hasMembership()) return true
  return hasCategoryAccess(categoryId)
}

function grantProduct(product) {
  const purchased = getPurchasedIds()
  if (!purchased.includes(product.id)) {
    purchased.push(product.id)
    storage.set(storage.KEYS.PURCHASED, purchased)
  }
  if (product.type === "membership") {
    const now = Date.now()
    const current = getMembership()
    let expireAt = now
    if (current && current.expireAt > now && current.level !== "lifetime") {
      expireAt = current.expireAt
    }
    if (product.membershipDays > 0) {
      expireAt += product.membershipDays * 24 * 60 * 60 * 1000
    } else {
      expireAt = -1
    }
    storage.set(storage.KEYS.MEMBERSHIP, {
      level: product.membershipLevel,
      expireAt: product.membershipDays < 0 ? -1 : expireAt,
      productId: product.id
    })
  }
  syncGlobalData()
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
  syncGlobalData
}
