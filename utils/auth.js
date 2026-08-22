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

function needsProfile(user) {
  const current = user || getUser()
  if (!current) return true
  const nick = (current.nickName || "").trim()
  return !current.avatarUrl || !nick || nick === "微信用户" || isAnonymousProfile(current)
}

function isAnonymousProfile(info) {
  if (!info) return true
  const nick = String(info.nickName || "").trim()
  const avatar = String(info.avatarUrl || "")
  if (!nick || nick === "微信用户") return true
  if (!avatar) return true
  if (avatar.indexOf("icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg") !== -1) {
    return true
  }
  return false
}

function applyServerUser(data, extra) {
  const prev = getUser() || {}
  const user = {
    ...prev,
    id: data.id,
    nickName: data.nickName,
    avatarUrl: data.avatarUrl || "",
    gender: data.gender != null ? data.gender : prev.gender,
    membershipLabel: data.membershipLabel || prev.membershipLabel || "普通用户",
    membershipExpire: data.membershipExpire !== undefined ? data.membershipExpire : prev.membershipExpire,
    loginTime: prev.loginTime || Date.now(),
    ...(extra || {})
  }
  setUser(user)
  return user
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

function syncQuizAfterLogin() {
  try {
    const quiz = require("./quiz")
    if (quiz.syncAllUserData) {
      return quiz.syncAllUserData().catch(() => {})
    }
  } catch (e) {
    // ignore circular load
  }
  return Promise.resolve()
}

function requestWeChatProfile() {
  return new Promise((resolve, reject) => {
    const fail = (err) => {
      const msg = (err && (err.errMsg || err.message)) || ""
      if (msg.indexOf("cancel") !== -1 || msg.indexOf("deny") !== -1) {
        const cancel = new Error("您取消了授权")
        cancel.code = "AUTH_CANCEL"
        reject(cancel)
        return
      }
      reject(err || new Error("未获得微信授权"))
    }

    if (typeof wx.getUserProfile === "function") {
      wx.getUserProfile({
        desc: "用于完善会员头像和昵称",
        success(res) {
          resolve(res.userInfo || {})
        },
        fail
      })
      return
    }

    wx.getUserInfo({
      success(res) {
        resolve(res.userInfo || {})
      },
      fail
    })
  })
}

function completeLogin(code, profile) {
  const info = profile || {}
  const nickName = info.nickName
  const avatarUrl = info.avatarUrl
  const gender = info.gender

  if (!config.useApi) {
    const user = {
      nickName: nickName || "微信用户",
      avatarUrl: avatarUrl || "",
      gender: gender || 0,
      wxCode: code,
      loginTime: Date.now()
    }
    setUser(user)
    initDefaultMessages()
    return Promise.resolve(user)
  }

  return authApi.login({ code, nickName, avatarUrl, gender }).then((data) => {
    storage.set(storage.KEYS.TOKEN, data.token)
    const user = {
      id: data.user.id,
      nickName: data.user.nickName,
      avatarUrl: data.user.avatarUrl || "",
      gender: data.user.gender || gender || 0,
      membershipLabel: data.user.membershipLabel,
      membershipExpire: data.user.membershipExpire,
      loginTime: Date.now()
    }
    setUser(user)
    initDefaultMessages()
    return syncQuizAfterLogin().then(() => user)
  })
}

function loginWithWechat(profile) {
  return wxLogin().then((code) => completeLogin(code, profile || {}))
}

function authorizeAndLogin() {
  return requestWeChatProfile().then((info) => {
    wx.showLoading({ title: "登录中", mask: true })
    return loginWithWechat(info).finally(() => {
      wx.hideLoading()
    })
  })
}

function requireLogin(tips) {
  if (isLoggedIn()) return Promise.resolve(getUser())
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: "需要登录",
      content: tips || "登录后做题记录、错题和收藏会保存到您的微信账号",
      confirmText: "微信授权",
      success(res) {
        if (!res.confirm) {
          const err = new Error("未登录")
          err.code = "LOGIN_CANCEL"
          reject(err)
          return
        }
        authorizeAndLogin()
          .catch((err) => {
            if (err && err.code === "AUTH_CANCEL") throw err
            wx.showLoading({ title: "登录中", mask: true })
            return loginWithWechat().finally(() => wx.hideLoading())
          })
          .then((user) => {
            wx.showToast({ title: "登录成功", icon: "success" })
            resolve(user)
          })
          .catch(reject)
      },
      fail: reject
    })
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
      gender: profile.gender || 0,
      membershipLabel: profile.membership?.label || "普通用户",
      membershipExpire: profile.membership?.expireAt || null,
      stats: profile.stats
    }
    setUser(user)
    return user
  })
}

function updateProfile(payload) {
  if (!config.useApi) {
    const user = { ...getUser(), ...payload }
    setUser(user)
    return Promise.resolve(user)
  }
  return authApi.updateProfile(payload).then((data) => applyServerUser(data))
}

function uploadAvatar(filePath) {
  if (!config.useApi) {
    const user = { ...getUser(), avatarUrl: filePath }
    setUser(user)
    return Promise.resolve(filePath)
  }
  return authApi.uploadAvatar(filePath).then((data) => {
    const avatarUrl = data.avatarUrl
    setUser({ ...getUser(), avatarUrl })
    return avatarUrl
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
  needsProfile,
  isAnonymousProfile,
  loginWithWechat,
  authorizeAndLogin,
  requireLogin,
  refreshProfile,
  updateProfile,
  uploadAvatar,
  logout,
  initDefaultMessages
}
