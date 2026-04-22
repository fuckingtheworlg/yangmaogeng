const { get } = require('../../utils/request')
const { mockShips } = require('../../utils/mock')
const app = getApp()

Page({
  data: {
    banners: [
      { id: 1, image: '/images/banner-1.jpg', title: '专业船舶交易 · 值得信赖' },
      { id: 2, image: '/images/banner-2.jpg', title: '一站式船舶委托服务' },
      { id: 3, image: '/images/banner-3.jpg', title: '全国各类船型 · 实时更新' }
    ],
    filters: [
      { label: '全部', min: 0, max: 0 },
      { label: '3000吨以下', min: 0, max: 3000 },
      { label: '3000-6000吨', min: 3000, max: 6000 },
      { label: '6000-9000吨', min: 6000, max: 9000 },
      { label: '9000-12000吨', min: 9000, max: 12000 },
      { label: '12000-15000吨', min: 12000, max: 15000 },
      { label: '15000吨以上', min: 15000, max: 0 }
    ],
    currentFilter: 0,
    searchKey: '',
    shipList: [],
    loading: false
  },

  onLoad() {
    this.fetchShips()
  },

  onShow() {
    if (this._loaded) this.fetchShips()
    this._loaded = true
  },

  onPullDownRefresh() {
    this.setData({ currentFilter: 0, searchKey: '' })
    this.fetchShips().then(() => wx.stopPullDownRefresh())
  },

  formatShip(ship) {
    const serverUrl = app.globalData.serverUrl
    // 兼容后端偶发返回字符串的情况
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
    if (ship.price) ship.price = parseFloat(ship.price)
    if (ship.total_length) ship.total_length = parseFloat(ship.total_length)
    if (ship.width) ship.width = parseFloat(ship.width)
    if (ship.depth) ship.depth = parseFloat(ship.depth)
    ship.ship_no = ship.ship_no || ''
    return ship
  },

  fetchShips() {
    const { filters, currentFilter, searchKey } = this.data
    const filter = filters[currentFilter]
    const params = {}
    if (filter.min) params.min_deadweight = filter.min
    if (filter.max) params.max_deadweight = filter.max
    if (searchKey) params.keyword = searchKey
    params.pageSize = 50

    this.setData({ loading: true })

    const query = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&')
    return get(`/ships?${query}`).then(res => {
      if (res.code === 200 && res.data && res.data.list) {
        const list = res.data.list.map(s => this.formatShip(s))
        this.setData({ shipList: list, loading: false })
      } else {
        this.setData({ shipList: mockShips, loading: false })
      }
    }).catch(() => {
      console.log('API 请求失败，使用本地数据')
      this.setData({ shipList: mockShips, loading: false })
    })
  },

  onFilterTap(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentFilter: index })
    this.fetchShips()
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
  },

  onSearch() {
    this.fetchShips()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
})
