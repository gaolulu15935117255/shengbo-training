const { announcements } = require("../../data/brand")

Page({
  data: {
    announcement: null
  },

  onLoad(options) {
    const announcement = announcements.find((a) => a.id === options.id)
    if (!announcement) {
      wx.showToast({ title: "公告不存在", icon: "none" })
      return
    }
    this.setData({ announcement })
    wx.setNavigationBarTitle({ title: "公告详情" })
  }
})
