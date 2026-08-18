const { brandInfo, contact, announcements } = require("../../data/brand")

Page({
  data: {
    brandInfo,
    contact,
    honors: brandInfo.honors
  },

  callPhone() {
    wx.makePhoneCall({ phoneNumber: contact.phone.replace(/-/g, "") })
  },

  openLocation() {
    wx.openLocation({
      latitude: contact.latitude,
      longitude: contact.longitude,
      name: "圣博培训基地",
      address: contact.address
    })
  }
})
