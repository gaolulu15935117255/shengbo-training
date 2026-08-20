const { contentApi } = require("../../utils/api")
const config = require("../../config/api")

Page({
  data: {
    announcement: null,
    loading: true
  },

  onLoad(options) {
    if (!config.useApi) {
      const { announcements } = require("../../data/brand")
      const announcement = announcements.find((a) => String(a.id) === String(options.id))
      if (!announcement) {
        wx.showToast({ title: "公告不存在", icon: "none" })
        return
      }
      this.setData({ announcement, loading: false })
      wx.setNavigationBarTitle({ title: "公告详情" })
      return
    }

    contentApi
      .announcement(options.id)
      .then((item) => {
        this.setData({
          announcement: {
            id: item.id,
            title: item.title,
            content: item.content,
            date: item.createdAt ? String(item.createdAt).slice(0, 10) : ""
          },
          loading: false
        })
        wx.setNavigationBarTitle({ title: "公告详情" })
      })
      .catch(() => {
        wx.showToast({ title: "公告不存在", icon: "none" })
        this.setData({ loading: false })
      })
  }
})
