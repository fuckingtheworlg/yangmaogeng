const { mockFavorites, mockCommissions } = require('../../utils/mock')

Page({
  data: {
    userInfo: {},
    currentTab: 0,
    favorites: [],
    commissions: []
  },

  onLoad() {
    this.setData({
      favorites: mockFavorites,
      commissions: mockCommissions
    })
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })
  },

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({ currentTab: index })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
})
