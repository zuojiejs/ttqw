//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      wx.showModal({
        title: "提示",
        content: "当前微信版本过低，请升级微信",
        showCancel: false
      })
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }
    this.globalData = {}
  }
})
