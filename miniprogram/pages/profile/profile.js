const { get, post, del, uploadFile } = require('../../utils/request')
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
    const token = app.globalData.token || wx.getStorageSync('token')
    const serverUrl = app.globalData.serverUrl
    if (token) {
      get('/favorites').then(res => {
        if (res && res.code === 200 && res.data && res.data.list) {
          const list = res.data.list.map(row => {
            let image = ''
            if (row.images && row.images.length > 0) {
              image = row.images[0]
              if (image && image.startsWith('/uploads')) image = serverUrl + image
            }
            return {
              id: row.ship_id,
              ship_id: row.ship_id,
              ship_no: row.ship_no,
              deadweight: row.deadweight,
              price: row.price,
              ship_type: row.ship_type || '',
              image
            }
          })
          // 同步一份到本地作为离线缓存
          wx.setStorageSync('favorites', list.map(x => x.ship_id))
          this.setData({ favorites: list })
        } else {
          this.loadFavoritesFromLocal()
        }
      }).catch(() => this.loadFavoritesFromLocal())
    } else {
      this.loadFavoritesFromLocal()
    }
  },

  loadFavoritesFromLocal() {
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
      }).catch(err => {
        console.error(`[favorites] 拉取船舶 ${id} 详情失败:`, err)
        return null
      })
    )
    Promise.all(promises).then(results => {
      this.setData({ favorites: results.filter(Boolean) })
    })
  },

  loadCommissions() {
    const token = app.globalData.token || wx.getStorageSync('token')
    if (token) {
      get('/commissions').then(res => {
        if (res && res.code === 200 && res.data && res.data.list) {
          const list = res.data.list.map(row => ({
            id: row.id,
            code: row.code || '',
            type: row.type,
            contact_name: row.contact_name,
            gender: row.gender,
            phone: row.phone,
            deadweight: row.deadweight,
            ship_type: row.ship_type,
            create_time: this.formatTime(row.created_at),
            status: row.status
          }))
          this.setData({ commissions: list })
        } else {
          this.setData({ commissions: wx.getStorageSync('commissions') || [] })
        }
      }).catch(() => {
        this.setData({ commissions: wx.getStorageSync('commissions') || [] })
      })
    } else {
      this.setData({ commissions: wx.getStorageSync('commissions') || [] })
    }
  },

  formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return String(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
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

    // 注意：不清空 tempAvatar / tempNickname，避免用户误触重开弹窗时清掉已选内容
    if (privacyCheck) {
      wx.getPrivacySetting({
        success: (res) => {
          // #region agent log
          console.log('[DEBUG-3ffe2d] [H-C] getPrivacySetting result:', JSON.stringify(res))
          // #endregion
          this.setData({
            showLoginModal: true,
            privacyAgreed: res.needAuthorization === false
          })
        },
        fail: () => {
          this.setData({
            showLoginModal: true,
            privacyAgreed: true
          })
        }
      })
    } else {
      this.setData({
        showLoginModal: true,
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

  noop() {},

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

  // 头像选择返回的是 wxfile:// 或 http://tmp/ 本地临时路径，必须先上传到服务器换成永久 URL
  _uploadAvatarIfLocal(localPath) {
    if (!localPath) return Promise.resolve('')
    const isLocalTemp = localPath.startsWith('wxfile://') || localPath.startsWith('http://tmp/')
    if (!isLocalTemp) {
      // 已是服务器 URL（例如用户之前登录过的 https://yangmaogeng.top/uploads/xxx）
      return Promise.resolve(localPath)
    }
    return uploadFile('/upload', localPath).then(res => {
      if (res && res.code === 200 && res.data && res.data.url) {
        return app.globalData.serverUrl + res.data.url
      }
      throw new Error((res && res.message) || '头像上传失败')
    })
  },

  confirmLogin() {
    const { tempAvatar, tempNickname } = this.data
    // #region agent log
    console.log('[DEBUG-3ffe2d] [CONFIRM-1] confirmLogin called, tempAvatar=', tempAvatar ? 'yes' : 'no', 'tempNickname=', tempNickname)
    // #endregion
    if (!tempAvatar) {
      wx.showToast({ title: '请先选择头像', icon: 'none', duration: 2500 })
      return
    }
    if (!tempNickname || !tempNickname.trim()) {
      wx.showToast({ title: '请填写/选择昵称', icon: 'none', duration: 2500 })
      return
    }
    const nickname = tempNickname.trim()
    wx.showLoading({ title: '登录中...', mask: true })

    this._uploadAvatarIfLocal(tempAvatar)
      .then(avatarUrl => {
        // #region agent log
        console.log('[DEBUG-3ffe2d] [CONFIRM-A] avatar uploaded, url=', avatarUrl)
        // #endregion
        return new Promise((resolve, reject) => {
          wx.login({
            success: (wxRes) => {
              // #region agent log
              console.log('[DEBUG-3ffe2d] [CONFIRM-2] wx.login success, code=', wxRes.code ? 'got' : 'empty')
              // #endregion
              if (!wxRes.code) return reject(new Error('wx.login 未返回 code'))
              resolve({ code: wxRes.code, avatarUrl })
            },
            fail: (err) => {
              // #region agent log
              console.error('[DEBUG-3ffe2d] [CONFIRM-E] wx.login fail:', err)
              // #endregion
              reject(err)
            }
          })
        })
      })
      .then(({ code, avatarUrl }) => {
        return post('/wx/login', { code, nickname, avatar: avatarUrl })
          .then(res => ({ res, avatarUrl }))
      })
      .then(({ res, avatarUrl }) => {
        // #region agent log
        console.log('[DEBUG-3ffe2d] [CONFIRM-3] POST /wx/login response:', JSON.stringify(res))
        // #endregion
        wx.hideLoading()
        if (res && res.code === 200 && res.data) {
          const token = res.data.token
          const userInfo = {
            id: res.data.userInfo && res.data.userInfo.id,
            nickName: nickname,
            avatarUrl
          }
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', userInfo)
          app.globalData.token = token
          app.globalData.userInfo = userInfo
          this.setData({
            userInfo,
            isLogin: true,
            showLoginModal: false,
            tempAvatar: '',
            tempNickname: ''
          })
          wx.showToast({ title: '登录成功', icon: 'success' })
          this.loadFavorites()
          this.loadCommissions()
        } else {
          wx.showToast({ title: (res && res.message) || '登录失败', icon: 'none' })
        }
      })
      .catch(err => {
        // #region agent log
        console.error('[DEBUG-3ffe2d] [CONFIRM-E] login flow failed:', err)
        // #endregion
        wx.hideLoading()
        const msg = (err && err.message) || '登录失败，请重试'
        wx.showToast({ title: msg, icon: 'none', duration: 2500 })
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
          app.globalData.token = ''
          app.globalData.userInfo = null
          this.setData({
            userInfo: null,
            isLogin: false,
            tempAvatar: '',
            tempNickname: ''
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
        if (!res.confirm) return
        const token = app.globalData.token || wx.getStorageSync('token')
        const syncLocal = () => {
          let favIds = wx.getStorageSync('favorites') || []
          favIds = favIds.filter(id => id !== shipId)
          wx.setStorageSync('favorites', favIds)
        }
        if (token) {
          del(`/favorites/${shipId}`).then(r => {
            if (r && r.code === 200) {
              syncLocal()
              this.loadFavorites()
              wx.showToast({ title: '已取消收藏', icon: 'none' })
            } else {
              wx.showToast({ title: (r && r.message) || '操作失败', icon: 'none' })
            }
          }).catch(() => {
            syncLocal()
            this.loadFavorites()
            wx.showToast({ title: '已取消收藏(本地)', icon: 'none' })
          })
        } else {
          syncLocal()
          this.loadFavorites()
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        }
      }
    })
  }
})
