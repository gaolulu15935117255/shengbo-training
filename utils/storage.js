const KEYS = {
  TOKEN: "sb_token",
  USER: "sb_user",
  PURCHASED: "sb_purchased",
  MEMBERSHIP: "sb_membership",
  ORDERS: "sb_orders",
  WRONG: "sb_wrong",
  FAVORITE: "sb_favorite",
  RECORDS: "sb_records",
  LEARNED: "learnedIds",
  MESSAGES: "sb_messages",
  QUIZ_STATS: "sb_quiz_stats"
}

function get(key, defaultValue) {
  try {
    const value = wx.getStorageSync(key)
    return value !== "" && value !== undefined ? value : defaultValue
  } catch (e) {
    return defaultValue
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (e) {
    return false
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (e) {
    return false
  }
}

module.exports = {
  KEYS,
  get,
  set,
  remove
}
