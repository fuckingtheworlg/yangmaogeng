App({
  globalData: {
    baseUrl: 'https://yangmaogeng.top/api',
    serverUrl: 'https://yangmaogeng.top',
    userInfo: null,
    token: '',
    statusBarHeight: 20,
    navBarHeight: 44,
    navTop: 64
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }

    const sysInfo = wx.getSystemInfoSync()
    this.globalData.statusBarHeight = sysInfo.statusBarHeight || 20
    this.globalData.navBarHeight = 44
    this.globalData.navTop = this.globalData.statusBarHeight + this.globalData.navBarHeight
  }
})
