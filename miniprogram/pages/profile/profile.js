const { mockShips } = require('../../utils/mock')

Page({
  data: {
    userInfo: null,
    isLogin: false,
    currentTab: 0,
    favorites: [],
    commissions: []
  },

  onShow() {
    this.loadUserInfo()
    this.loadFavorites()
    this.loadCommissions()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || null
    this.setData({
      userInfo,
      isLogin: !!userInfo
    })
  },

  loadFavorites() {
    const favIds = wx.getStorageSync('favorites') || []
    const favorites = favIds.map(id => {
      const ship = mockShips.find(s => s.id === id)
      if (ship) {
        return {
          id: ship.id,
          ship_id: ship.id,
          ship_no: ship.ship_no,
          deadweight: ship.deadweight,
          price: ship.price,
          ship_type: ship.ship_type
        }
      }
      return null
    }).filter(Boolean)
    this.setData({ favorites })
  },

  loadCommissions() {
    const commissions = wx.getStorageSync('commissions') || []
    this.setData({ commissions })
  },

  onLogin() {
    if (this.data.isLogin) return
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入您的昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const userInfo = {
            nickName: res.content,
            avatarUrl: ''
          }
          wx.setStorageSync('userInfo', userInfo)
          this.setData({ userInfo, isLogin: true })
          wx.showToast({ title: '登录成功', icon: 'success' })
        }
      }
    })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('token')
          this.setData({
            userInfo: null,
            isLogin: false
          })
          wx.showToast({ title: '已退出登录', icon: 'none' })
        }
      }
    })
  },

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({ currentTab: index })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  removeFavorite(e) {
    const shipId = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定取消收藏？',
      success: (res) => {
        if (res.confirm) {
          let favIds = wx.getStorageSync('favorites') || []
          favIds = favIds.filter(id => id !== shipId)
          wx.setStorageSync('favorites', favIds)
          this.loadFavorites()
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        }
      }
    })
  }
})
