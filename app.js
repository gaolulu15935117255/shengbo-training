const storage = require("./utils/storage")
const auth = require("./utils/auth")
const permission = require("./utils/permission")

App({
  globalData: {
    userInfo: null,
    learnedIds: [],
    purchasedIds: [],
    membership: null
  },

  onLaunch() {
    this.globalData.learnedIds = storage.get(storage.KEYS.LEARNED, [])
    this.globalData.userInfo = auth.getUser()
    this.globalData.purchasedIds = permission.getPurchasedIds()
    this.globalData.membership = permission.getMembership()
    auth.initDefaultMessages()
  },

  markLearned(courseId) {
    const ids = this.globalData.learnedIds
    if (!ids.includes(courseId)) {
      ids.push(courseId)
      this.globalData.learnedIds = ids
      storage.set(storage.KEYS.LEARNED, ids)
    }
  },

  refreshUserData() {
    this.globalData.purchasedIds = permission.getPurchasedIds()
    this.globalData.membership = permission.getMembership()
  }
})
