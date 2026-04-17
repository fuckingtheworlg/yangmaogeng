const { get } = require('../../utils/request')
const { mockShips } = require('../../utils/mock')
const app = getApp()

Page({
  data: {
    userInfo: null,
    isLogin: false,
    currentTab: 0,
    favorites: [],
    commissions: [],
    showLoginModal: false,
    tempAvatar: '',
    tempNickname: ''
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
    if (favIds.length === 0) {
      this.setData({ favorites: [] })
      return
    }
    const serverUrl = app.globalData.serverUrl
    const promises = favIds.map(id =>
      get(`/ships/${id}`).then(res => {
        if (res.code === 200 && res.data) {
          const ship = res.data
          let image = ''
          if (ship.images && ship.images.length > 0) {
            image = ship.images[0]
            if (image && image.startsWith('/uploads')) image = serverUrl + image
          }
          return {
            id: ship.id,
            ship_id: ship.id,
            ship_no: ship.ship_no,
            deadweight: ship.deadweight,
            price: ship.price,
            ship_type: ship.ship_type,
            image
          }
        }
        return null
      }).catch(() => {
        const ship = mockShips.find(s => s.id === id)
        if (ship) {
          return {
            id: ship.id,
            ship_id: ship.id,
            ship_no: ship.ship_no,
            deadweight: ship.deadweight,
            price: ship.price,
            ship_type: ship.ship_type,
            image: ship.images ? ship.images[0] : ''
          }
        }
        return null
      })
    )
    Promise.all(promises).then(results => {
      this.setData({ favorites: results.filter(Boolean) })
    })
  },

  loadCommissions() {
    const commissions = wx.getStorageSync('commissions') || []
    this.setData({ commissions })
  },

  onLogin() {
    if (this.data.isLogin) return
    this.setData({
      showLoginModal: true,
      tempAvatar: '',
      tempNickname: ''
    })
  },

  closeLoginModal() {
    this.setData({ showLoginModal: false })
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) {
      wx.showToast({ title: '获取头像失败，请手动上传', icon: 'none' })
      return
    }
    this.setData({ tempAvatar: avatarUrl })
  },

  chooseAvatarManually() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          this.setData({ tempAvatar: res.tempFiles[0].tempFilePath })
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择图片失败', icon: 'none' })
        }
      }
    })
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value })
  },

  confirmLogin() {
    const { tempAvatar, tempNickname } = this.data
    if (!tempNickname || !tempNickname.trim()) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    const userInfo = {
      nickName: tempNickname.trim(),
      avatarUrl: tempAvatar || ''
    }
    wx.setStorageSync('userInfo', userInfo)
    this.setData({
      userInfo,
      isLogin: true,
      showLoginModal: false,
      tempAvatar: '',
      tempNickname: ''
    })
    wx.showToast({ title: '登录成功', icon: 'success' })
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
