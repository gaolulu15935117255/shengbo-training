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
    goQuiz() {
      if (this.data.active === "quiz") return
      wx.reLaunch({ url: "/pages/quiz/quiz" })
    },
    goShop() {
      if (this.data.active === "shop") return
      wx.reLaunch({ url: "/pages/shop/shop" })
    },
    goMine() {
      if (this.data.active === "mine") return
      wx.reLaunch({ url: "/pages/mine/mine" })
    }
  }
})
