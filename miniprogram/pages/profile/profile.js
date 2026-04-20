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
    tempNickname: '',
    privacyAgreed: false
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
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-A] onLogin called, isLogin=', this.data.isLogin, 'userInfo=', this.data.userInfo)
    // #endregion
    if (this.data.isLogin) return

    const privacyCheck = wx.getPrivacySetting ? true : false
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-C] privacyAPI available=', privacyCheck)
    // #endregion

    if (privacyCheck) {
      wx.getPrivacySetting({
        success: (res) => {
          // #region agent log
          console.log('[DEBUG-3ffe2d] [H-C] getPrivacySetting result:', JSON.stringify(res))
          // #endregion
          this.setData({
            showLoginModal: true,
            tempAvatar: '',
            tempNickname: '',
            privacyAgreed: res.needAuthorization === false
          })
        },
        fail: () => {
          this.setData({
            showLoginModal: true,
            tempAvatar: '',
            tempNickname: '',
            privacyAgreed: true
          })
        }
      })
    } else {
      this.setData({
        showLoginModal: true,
        tempAvatar: '',
        tempNickname: '',
        privacyAgreed: true
      })
    }
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-A] showLoginModal set to true')
    // #endregion
  },

  closeLoginModal() {
    this.setData({ showLoginModal: false })
  },

  onAgreePrivacy() {
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-C] onAgreePrivacy called - user agreed to privacy')
    // #endregion
    this.setData({ privacyAgreed: true })
    wx.showToast({ title: '已同意隐私协议', icon: 'success', duration: 1000 })
  },

  onChooseAvatar(e) {
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-B/E] onChooseAvatar fired, e.detail=', JSON.stringify(e.detail))
    // #endregion
    const { avatarUrl } = e.detail
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-E] avatarUrl=', avatarUrl)
    // #endregion
    this.setData({ tempAvatar: avatarUrl })
  },

  onNicknameInput(e) {
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-D] onNicknameInput fired, value=', e.detail.value)
    // #endregion
    this.setData({ tempNickname: e.detail.value })
  },

  onNicknameBlur(e) {
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-D] onNicknameBlur fired, value=', e.detail.value)
    // #endregion
    if (e.detail.value) {
      this.setData({ tempNickname: e.detail.value })
    }
  },

  onNicknameConfirm(e) {
    // #region agent log
    console.log('[DEBUG-3ffe2d] [FIX] onNicknameConfirm fired, value=', e.detail.value)
    // #endregion
    if (e.detail.value) {
      this.setData({ tempNickname: e.detail.value })
    }
  },

  confirmLogin() {
    const { tempAvatar, tempNickname } = this.data
    // #region agent log
    console.log('[DEBUG-3ffe2d] [H-ALL] confirmLogin called, tempAvatar=', tempAvatar, 'tempNickname=', tempNickname)
    // #endregion
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
