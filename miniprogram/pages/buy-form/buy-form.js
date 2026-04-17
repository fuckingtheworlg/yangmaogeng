const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navTop: 64,
    form: {
      contact_name: '',
      gender: '先生',
      phone: '',
      total_length: '',
      deadweight: '',
      gross_tonnage: '',
      year_start: '',
      year_end: '',
      build_province: '',
      ship_type: '',
      water_type: '内河',
      engine_power: '',
      engine_brand: '',
      engine_count: '',
      budget: '',
      remark: ''
    },
    shipTypes: ['干散货船', '甲板船', '集装箱船', '液货船', '客船', '其他'],
    shipTypeIndex: 0,
    servicePhone: '400-888-0000'
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navTop: app.globalData.navTop
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  setGender(e) {
    this.setData({ 'form.gender': e.currentTarget.dataset.val })
  },

  setWaterType(e) {
    this.setData({ 'form.water_type': e.currentTarget.dataset.val })
  },

  onShipTypeChange(e) {
    const index = e.detail.value
    this.setData({
      shipTypeIndex: index,
      'form.ship_type': this.data.shipTypes[index]
    })
  },

  callService() {
    wx.makePhoneCall({ phoneNumber: this.data.servicePhone })
  },

  submitForm() {
    const { form } = this.data
    if (!form.contact_name || !form.phone) {
      wx.showToast({ title: '请填写称呼和电话', icon: 'none' })
      return
    }

    const commissions = wx.getStorageSync('commissions') || []
    const now = new Date()
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    commissions.unshift({
      id: Date.now(),
      type: 'buy',
      contact_name: form.contact_name,
      gender: form.gender,
      phone: form.phone,
      deadweight: form.deadweight || '',
      ship_type: form.ship_type || '',
      budget: form.budget || '',
      create_time: timeStr,
      status: 0
    })
    wx.setStorageSync('commissions', commissions)

    wx.showToast({ title: '委托提交成功', icon: 'success' })
    setTimeout(() => { wx.navigateBack() }, 1500)
  }
})
