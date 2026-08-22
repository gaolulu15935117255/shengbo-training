const storage = require("../../utils/storage")
const config = require("../../config/api")
const auth = require("../../utils/auth")
const { userApi } = require("../../utils/api")

function formatTime(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function mapMessage(item) {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    read: !!item.read,
    time: item.time || formatTime(item.createdAt)
  }
}

Page({
  data: {
    messages: [],
    loading: false
  },

  onShow() {
    this.loadMessages()
  },

  loadMessages() {
    if (!config.useApi) {
      this.setData({
        messages: (storage.get(storage.KEYS.MESSAGES, []) || []).map(mapMessage)
      })
      return
    }
    if (!auth.isLoggedIn()) {
      this.setData({ messages: [] })
      wx.showToast({ title: "登录后查看消息", icon: "none" })
      return
    }
    this.setData({ loading: true })
    userApi
      .messages({ page: 1, pageSize: 50 })
      .then((data) => {
        this.setData({
          messages: (data.list || []).map(mapMessage),
          loading: false
        })
      })
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || "加载失败", icon: "none" })
        this.setData({ loading: false })
      })
  },

  readMessage(e) {
    const id = Number(e.currentTarget.dataset.id)
    const current = this.data.messages.find((m) => m.id === id)
    if (!current) return

    const show = () => {
      wx.showModal({
        title: current.title,
        content: current.content,
        showCancel: false
      })
    }

    if (current.read) {
      show()
      return
    }

    const messages = this.data.messages.map((m) => (m.id === id ? { ...m, read: true } : m))
    this.setData({ messages })

    if (!config.useApi) {
      storage.set(storage.KEYS.MESSAGES, messages)
      show()
      return
    }
    userApi.readMessage(id).catch(() => {})
    show()
  }
})
