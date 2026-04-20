/**
 * 登录校验：若未登录，弹 toast 并跳转到"我的"标签
 * @param {string} tipMsg
 * @returns {boolean} 已登录返回 true，未登录返回 false（并触发跳转）
 */
function requireLogin(tipMsg) {
  const app = getApp()
  const token = (app && app.globalData && app.globalData.token) || wx.getStorageSync('token')
  if (!token) {
    wx.showToast({ title: tipMsg || '请先登录', icon: 'none' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/profile/profile' })
    }, 800)
    return false
  }
  return true
}

function isLoggedIn() {
  const app = getApp()
  const token = (app && app.globalData && app.globalData.token) || wx.getStorageSync('token')
  return !!token
}

module.exports = { requireLogin, isLoggedIn }
