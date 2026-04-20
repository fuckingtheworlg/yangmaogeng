const { post } = require('../../utils/request')
const { requireLogin } = require('../../utils/auth')
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

  async submitForm() {
    const { form } = this.data
    if (!form.contact_name || !form.phone) {
      wx.showToast({ title: '请填写称呼和电话', icon: 'none' })
      return
    }
    if (!requireLogin('登录后可提交委托')) return

    wx.showLoading({ title: '提交中...', mask: true })
    try {
      const payload = {
        type: 'buy',
        contact_name: form.contact_name,
        gender: form.gender,
        phone: form.phone,
        total_length: form.total_length || 0,
        deadweight: form.deadweight || 0,
        gross_tonnage: form.gross_tonnage || 0,
        build_province: form.build_province,
        ship_type: form.ship_type,
        water_type: form.water_type,
        engine_brand: form.engine_brand,
        engine_power: form.engine_power || 0,
        engine_count: form.engine_count || 1,
        year_start: form.year_start,
        year_end: form.year_end,
        budget: form.budget || null,
        remark: form.remark
      }
      const res = await post('/commissions', payload)
      wx.hideLoading()

      if (res && res.code === 200) {
        const commissions = wx.getStorageSync('commissions') || []
        const now = new Date()
        const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
        commissions.unshift({
          id: res.data.id,
          code: res.data.code || '',
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
      } else {
        wx.showToast({ title: (res && res.message) || '提交失败', icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    }
  }
})
