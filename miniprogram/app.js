App({
  globalData: {
    baseUrl: 'http://47.114.89.50/api',
    userInfo: null,
    token: ''
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  }
})
