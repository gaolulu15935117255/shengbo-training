const storage = require("../../utils/storage")

Page({
  data: {
    messages: []
  },

  onShow() {
    const messages = storage.get(storage.KEYS.MESSAGES, [])
    this.setData({ messages })
  },

  readMessage(e) {
    const id = e.currentTarget.dataset.id
    const messages = this.data.messages.map((m) =>
      m.id === id ? { ...m, read: true } : m
    )
    storage.set(storage.KEYS.MESSAGES, messages)
    this.setData({ messages })
    const msg = messages.find((m) => m.id === id)
    if (msg) {
      wx.showModal({
        title: msg.title,
        content: msg.content,
        showCancel: false
      })
    }
  }
})
