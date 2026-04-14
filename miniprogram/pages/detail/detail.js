const { get } = require('../../utils/request')
const { mockShips } = require('../../utils/mock')
const app = getApp()

Page({
  data: {
    ship: {},
    isFavorited: false,
    conditionClass: 'normal',
    statusBarHeight: 20,
    navTop: 64
  },

  onLoad(options) {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navTop: app.globalData.navTop
    })
    const id = parseInt(options.id)
    this.shipId = id
    this.fetchShipDetail(id)
    this.checkFavorite(id)
  },

  formatImages(ship) {
    const serverUrl = app.globalData.serverUrl
    if (ship.images && ship.images.length > 0) {
      ship.images = ship.images.map(img => {
        if (img && img.startsWith('/uploads')) return serverUrl + img
        return img
      })
    }
    return ship
  },

  fetchShipDetail(id) {
    get(`/ships/${id}`).then(res => {
      if (res.code === 200 && res.data) {
        this.setShipData(this.formatImages(res.data))
      } else {
        this.loadMockShip(id)
      }
    }).catch(() => {
      console.log('API 请求失败，使用本地数据')
      this.loadMockShip(id)
    })
  },

  loadMockShip(id) {
    const ship = mockShips.find(s => s.id === id)
    if (ship) this.setShipData(ship)
  },

  setShipData(ship) {
    let conditionClass = 'normal'
    if (ship.ship_condition === '优秀') conditionClass = 'excellent'
    else if (ship.ship_condition === '良好') conditionClass = 'good'
    this.setData({ ship, conditionClass })
  },

  checkFavorite(id) {
    const favList = wx.getStorageSync('favorites') || []
    this.setData({ isFavorited: favList.includes(id) })
  },

  goBack() {
    wx.navigateBack()
  },

  toggleFavorite() {
    const id = this.shipId
    const { isFavorited } = this.data
    let favList = wx.getStorageSync('favorites') || []
    if (isFavorited) {
      favList = favList.filter(fid => fid !== id)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      favList.push(id)
      wx.showToast({ title: '收藏成功', icon: 'success' })
    }
    wx.setStorageSync('favorites', favList)
    this.setData({ isFavorited: !isFavorited })
  },

  callPhone() {
    const phone = this.data.ship.contact_phone
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone })
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.ship.images
    })
  }
})
