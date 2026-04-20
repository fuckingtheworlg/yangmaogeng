const { post } = require('../../utils/request')
const { uploadImages } = require('../../utils/upload')
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
      width: '',
      depth: '',
      gross_tonnage: '',
      deadweight: '',
      build_date: '',
      build_province: '',
      water_type: '内河',
      ship_type: '',
      engine_brand: '',
      engine_power: '',
      engine_count: ''
    },
    shipTypes: ['干散货船', '甲板船', '集装箱船', '液货船', '客船', '其他'],
    shipTypeIndex: 0,
    servicePhone: '400-888-0000',
    shipImages: [],
    certImages: []
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

  onDateChange(e) {
    this.setData({ 'form.build_date': e.detail.value })
  },

  onShipTypeChange(e) {
    const index = e.detail.value
    this.setData({
      shipTypeIndex: index,
      'form.ship_type': this.data.shipTypes[index]
    })
  },

  chooseShipImage() {
    wx.chooseMedia({
      count: 9 - this.data.shipImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const paths = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ shipImages: this.data.shipImages.concat(paths) })
      }
    })
  },

  chooseCertImage() {
    wx.chooseMedia({
      count: 9 - this.data.certImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const paths = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ certImages: this.data.certImages.concat(paths) })
      }
    })
  },

  deleteShipImage(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '提示',
      content: '确定删除此图片？',
      success: (res) => {
        if (res.confirm) {
          const images = this.data.shipImages
          images.splice(index, 1)
          this.setData({ shipImages: images })
        }
      }
    })
  },

  callService() {
    wx.makePhoneCall({ phoneNumber: this.data.servicePhone })
  },

  deleteCertImage(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '提示',
      content: '确定删除此图片？',
      success: (res) => {
        if (res.confirm) {
          const images = this.data.certImages
          images.splice(index, 1)
          this.setData({ certImages: images })
        }
      }
    })
  },

  async submitForm() {
    const { form, shipImages, certImages } = this.data
    if (!form.contact_name || !form.phone) {
      wx.showToast({ title: '请填写称呼和电话', icon: 'none' })
      return
    }
    if (!form.deadweight) {
      wx.showToast({ title: '请填写载重吨', icon: 'none' })
      return
    }
    if (!requireLogin('登录后可提交委托')) return

    wx.showLoading({ title: '提交中...', mask: true })
    try {
      const ship_images = await uploadImages(shipImages)
      const cert_images = await uploadImages(certImages)

      const payload = {
        type: 'sell',
        contact_name: form.contact_name,
        gender: form.gender,
        phone: form.phone,
        total_length: form.total_length || 0,
        width: form.width || 0,
        depth: form.depth || 0,
        gross_tonnage: form.gross_tonnage || 0,
        deadweight: form.deadweight || 0,
        build_date: form.build_date,
        build_province: form.build_province,
        water_type: form.water_type,
        ship_type: form.ship_type,
        engine_brand: form.engine_brand,
        engine_power: form.engine_power || 0,
        engine_count: form.engine_count || 1,
        ship_images,
        cert_images
      }
      const res = await post('/commissions', payload)
      wx.hideLoading()

      if (res && res.code === 200) {
        // 同步一份到本地作缓存
        const commissions = wx.getStorageSync('commissions') || []
        const now = new Date()
        const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
        commissions.unshift({
          id: res.data.id,
          code: res.data.code || '',
          type: 'sell',
          contact_name: form.contact_name,
          gender: form.gender,
          phone: form.phone,
          deadweight: form.deadweight,
          ship_type: form.ship_type,
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
