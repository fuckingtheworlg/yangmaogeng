Page({
  data: {
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
      engine_power: ''
    },
    shipTypes: ['川船', '海船', '集装箱船', '散货船', '油船', '其他'],
    shipTypeIndex: 0,
    shipImages: [],
    certImages: []
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

  submitForm() {
    const { form, shipImages } = this.data
    if (!form.contact_name || !form.phone) {
      wx.showToast({ title: '请填写称呼和电话', icon: 'none' })
      return
    }
    if (!form.deadweight) {
      wx.showToast({ title: '请填写载重吨', icon: 'none' })
      return
    }

    wx.showToast({ title: '委托提交成功', icon: 'success' })
    setTimeout(() => { wx.navigateBack() }, 1500)
  }
})
