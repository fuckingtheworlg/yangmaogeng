const { get, post, del } = require('../../utils/request')
const { requireLogin } = require('../../utils/auth')
const app = getApp()

Page({
  data: {
    ship: {},
    basicParams: [],
    buildInfo: [],
    engineInfo: [],
    isFavorited: false,
    conditionClass: 'normal',
    unitPrice: '',
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

  formatShip(ship) {
    const serverUrl = app.globalData.serverUrl
    if (typeof ship.images === 'string') {
      try { ship.images = JSON.parse(ship.images) } catch { ship.images = [] }
    }
    if (Array.isArray(ship.images) && ship.images.length > 0) {
      ship.images = ship.images.filter(Boolean).map(img => {
        if (img && img.startsWith('/uploads')) return serverUrl + img
        return img
      })
    } else {
      ship.images = []
    }
    if (typeof ship.certificates === 'string') {
      try { ship.certificates = JSON.parse(ship.certificates) } catch { ship.certificates = [] }
    }
    if (!Array.isArray(ship.certificates)) ship.certificates = []
    if (ship.price) ship.price = parseFloat(ship.price)
    if (ship.total_length) ship.total_length = parseFloat(ship.total_length)
    if (ship.width) ship.width = parseFloat(ship.width)
    if (ship.depth) ship.depth = parseFloat(ship.depth)
    ship.ship_no = ship.ship_no || ''
    return ship
  },

  isVisibleValue(value) {
    if (value === null || value === undefined) return false
    const text = String(value).trim()
    if (!text) return false
    return !/^0(?:\.0+)?$/.test(text)
  },

  makeField(label, value, unit = '') {
    if (!this.isVisibleValue(value)) return null
    return { label, value, unit }
  },

  buildDetailFields(ship) {
    const basicParams = [
      this.makeField('总长', ship.total_length, '米'),
      this.makeField('型宽', ship.width, '米'),
      this.makeField('型深', ship.depth, '米'),
      this.makeField('载重吨', ship.deadweight, '吨'),
      this.makeField('总吨', ship.gross_tonnage, '吨'),
      this.makeField('船型', ship.ship_type),
      this.makeField('水域', ship.water_type)
    ].filter(Boolean)

    const buildInfo = [
      this.makeField('建造时间', ship.build_date),
      this.makeField('建造地点', ship.build_province),
      this.makeField('港籍', ship.port_registry)
    ].filter(Boolean)

    const engineInfo = [
      this.makeField('主机品牌', ship.engine_brand),
      this.makeField('主机型号', ship.engine_power),
      this.makeField('主机数量', ship.engine_count, '台')
    ].filter(Boolean)

    return { basicParams, buildInfo, engineInfo }
  },

  fetchShipDetail(id) {
    get(`/ships/${id}`).then(res => {
      if (res.code === 200 && res.data) {
        this.setShipData(this.formatShip(res.data))
      } else {
        wx.showToast({ title: (res && res.message) || '船舶信息加载失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('[ship detail] 获取船舶详情失败:', err)
      wx.showToast({ title: (err && err.errMsg) || '网络异常，请重试', icon: 'none' })
    })
  },

  setShipData(ship) {
    let conditionClass = 'normal'
    if (ship.ship_condition === '优秀') conditionClass = 'excellent'
    else if (ship.ship_condition === '良好') conditionClass = 'good'
    let unitPrice = ''
    const price = parseFloat(ship.price) || 0
    const dwt = parseFloat(ship.deadweight) || 0
    if (price > 0 && dwt > 0) {
      const unit = (price * 10000 / dwt)
      unitPrice = unit >= 100 ? unit.toFixed(0) : unit.toFixed(1)
    }
    const { basicParams, buildInfo, engineInfo } = this.buildDetailFields(ship)
    this.setData({ ship, basicParams, buildInfo, engineInfo, conditionClass, unitPrice })
  },

  checkFavorite(id) {
    const favList = wx.getStorageSync('favorites') || []
    this.setData({ isFavorited: favList.includes(id) })
    const token = app.globalData.token || wx.getStorageSync('token')
    if (token) {
      get(`/favorites/check/${id}`).then(res => {
        if (res && res.code === 200 && res.data) {
          this.setData({ isFavorited: !!res.data.isFavorited })
        }
      }).catch(() => {})
    }
  },

  goBack() {
    wx.navigateBack()
  },

  toggleFavorite() {
    if (!requireLogin('登录后可收藏船舶')) return
    const id = this.shipId
    const { isFavorited } = this.data
    const syncLocal = (fav) => {
      let favList = wx.getStorageSync('favorites') || []
      if (fav) {
        if (!favList.includes(id)) favList.push(id)
      } else {
        favList = favList.filter(fid => fid !== id)
      }
      wx.setStorageSync('favorites', favList)
    }
    const target = !isFavorited
    this.setData({ isFavorited: target })
    const p = target ? post('/favorites', { ship_id: id }) : del(`/favorites/${id}`)
    p.then(res => {
      if (res && res.code === 200) {
        syncLocal(target)
        wx.showToast({ title: target ? '收藏成功' : '已取消收藏', icon: target ? 'success' : 'none' })
      } else {
        this.setData({ isFavorited: isFavorited })
        wx.showToast({ title: (res && res.message) || '操作失败', icon: 'none' })
      }
    }).catch(() => {
      // 接口失败时回退到本地
      syncLocal(target)
      wx.showToast({ title: target ? '已收藏(本地)' : '已取消(本地)', icon: 'none' })
    })
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
