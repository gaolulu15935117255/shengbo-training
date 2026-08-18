App({
  globalData: {
    userInfo: null,
    learnedIds: []
  },

  onLaunch() {
    const learnedIds = wx.getStorageSync("learnedIds") || []
    this.globalData.learnedIds = learnedIds
  },

  markLearned(courseId) {
    const ids = this.globalData.learnedIds
    if (!ids.includes(courseId)) {
      ids.push(courseId)
      this.globalData.learnedIds = ids
      wx.setStorageSync("learnedIds", ids)
    }
  }
})
