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
    const ship = mockShips.find(s => s.id === id)
    if (ship) {
      let conditionClass = 'normal'
      if (ship.ship_condition === '优秀') conditionClass = 'excellent'
      else if (ship.ship_condition === '良好') conditionClass = 'good'
      this.setData({ ship, conditionClass })
    }
    const favList = wx.getStorageSync('favorites') || []
    this.setData({ isFavorited: favList.includes(id) })
  },

  goBack() {
    wx.navigateBack()
  },

  toggleFavorite() {
    const { ship, isFavorited } = this.data
    let favList = wx.getStorageSync('favorites') || []
    if (isFavorited) {
      favList = favList.filter(id => id !== ship.id)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      favList.push(ship.id)
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
