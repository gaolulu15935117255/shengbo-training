Component({
  properties: {
    active: {
      type: String,
      value: "index"
    }
  },
  methods: {
    goIndex() {
      if (this.data.active === "index") return
      wx.reLaunch({ url: "/pages/index/index" })
    },
    goCourses() {
      if (this.data.active === "courses") return
      wx.reLaunch({ url: "/pages/courses/courses" })
    },
    goMine() {
      if (this.data.active === "mine") return
      wx.reLaunch({ url: "/pages/mine/mine" })
    }
  }
})
