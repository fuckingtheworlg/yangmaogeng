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
      engine_power: '',
      engine_brand: '',
      budget: '',
      remark: ''
    }
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

  submitForm() {
    const { form } = this.data
    if (!form.contact_name || !form.phone) {
      wx.showToast({ title: '请填写称呼和电话', icon: 'none' })
      return
    }

    wx.showToast({ title: '委托提交成功', icon: 'success' })
    setTimeout(() => { wx.navigateBack() }, 1500)
  }
})
