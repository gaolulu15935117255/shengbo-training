const storage = require("./storage")

function getUser() {
  return storage.get(storage.KEYS.USER, null)
}

function setUser(user) {
  storage.set(storage.KEYS.USER, user)
  const app = getApp()
  if (app) app.globalData.userInfo = user
}

function isLoggedIn() {
  return !!getUser()
}

function login(userInfo) {
  const user = {
    nickName: userInfo.nickName || "圣博学员",
    avatarUrl: userInfo.avatarUrl || "",
    loginTime: Date.now()
  }
  setUser(user)
  initDefaultMessages()
  return user
}

function logout() {
  storage.remove(storage.KEYS.USER)
  const app = getApp()
  if (app) app.globalData.userInfo = null
}

function initDefaultMessages() {
  const existing = storage.get(storage.KEYS.MESSAGES, [])
  if (existing.length > 0) return
  storage.set(storage.KEYS.MESSAGES, [
    {
      id: "m1",
      title: "欢迎使用圣博培训",
      content: "感谢您选择圣博培训，开始您的学习之旅吧！",
      time: formatDate(new Date()),
      read: false
    },
    {
      id: "m2",
      title: "免费题库已开放",
      content: "基础章节题库免费开放，快来刷题吧！",
      time: formatDate(new Date()),
      read: false
    }
  ])
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

module.exports = {
  getUser,
  setUser,
  isLoggedIn,
  login,
  logout,
  initDefaultMessages
}
