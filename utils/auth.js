const storage = require("./storage")
const { authApi } = require("./api")
const config = require("../config/api")

function getUser() {
  return storage.get(storage.KEYS.USER, null)
}

function getToken() {
  return storage.get(storage.KEYS.TOKEN, "")
}

function setUser(user) {
  storage.set(storage.KEYS.USER, user)
  const app = getApp()
  if (app) app.globalData.userInfo = user
}

function isLoggedIn() {
  return !!getToken() && !!getUser()
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) resolve(res.code)
        else reject(new Error("微信登录失败"))
      },
      fail: reject
    })
  })
}

function loginWithWechat() {
  if (!config.useApi) {
    return wxLogin().then((code) => {
      const user = {
        nickName: "微信用户",
        avatarUrl: "",
        wxCode: code,
        loginTime: Date.now()
      }
      setUser(user)
      initDefaultMessages()
      return user
    })
  }

  return wxLogin()
    .then((code) => authApi.login({ code }))
    .then((data) => {
      storage.set(storage.KEYS.TOKEN, data.token)
      const user = {
        id: data.user.id,
        nickName: data.user.nickName,
        avatarUrl: data.user.avatarUrl || "",
        membershipLabel: data.user.membershipLabel,
        membershipExpire: data.user.membershipExpire,
        loginTime: Date.now()
      }
      setUser(user)
      initDefaultMessages()
      return user
    })
}

function refreshProfile() {
  if (!config.useApi || !getToken()) {
    return Promise.resolve(getUser())
  }
  return authApi.profile().then((profile) => {
    const user = {
      ...getUser(),
      id: profile.id,
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl || "",
      membershipLabel: profile.membership?.label || "普通用户",
      membershipExpire: profile.membership?.expireAt || null,
      stats: profile.stats
    }
    setUser(user)
    return user
  })
}

function logout() {
  const token = getToken()
  storage.remove(storage.KEYS.TOKEN)
  storage.remove(storage.KEYS.USER)
  const app = getApp()
  if (app) app.globalData.userInfo = null
  if (config.useApi && token) {
    authApi.logout().catch(() => {})
  }
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
  getToken,
  setUser,
  isLoggedIn,
  loginWithWechat,
  refreshProfile,
  logout,
  initDefaultMessages
}
