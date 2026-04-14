const { mockShips } = require('../../utils/mock')

Page({
  data: {
    banners: [
      { id: 1, image: '/images/ship-placeholder.png' },
      { id: 2, image: '/images/ship-placeholder.png' },
      { id: 3, image: '/images/ship-placeholder.png' }
    ],
    filters: [
      { label: '全部', min: 0, max: 999999 },
      { label: '0-3000吨', min: 0, max: 3000 },
      { label: '3000-6000吨', min: 3000, max: 6000 },
      { label: '6000-12000吨', min: 6000, max: 12000 },
      { label: '12000吨以上', min: 12000, max: 999999 }
    ],
    currentFilter: 0,
    searchKey: '',
    shipList: [],
    allShips: []
  },

  onLoad() {
    this.setData({ allShips: mockShips, shipList: mockShips })
  },

  onFilterTap(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentFilter: index })
    this.applyFilter()
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
  },

  onSearch() {
    this.applyFilter()
  },

  applyFilter() {
    const { allShips, filters, currentFilter, searchKey } = this.data
    const filter = filters[currentFilter]
    let list = allShips.filter(ship => {
      const inRange = ship.deadweight >= filter.min && ship.deadweight < filter.max
      if (searchKey) {
        const key = searchKey.toLowerCase()
        return inRange && (
          ship.ship_no.includes(key) ||
          ship.ship_type.includes(key) ||
          ship.build_province.includes(key)
        )
      }
      return inRange
    })
    this.setData({ shipList: list })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onPullDownRefresh() {
    this.setData({ shipList: this.data.allShips, currentFilter: 0, searchKey: '' })
    wx.stopPullDownRefresh()
  }
})
