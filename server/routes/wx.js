const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
require('dotenv').config()

// 微信小程序登录
router.post('/login', async (req, res) => {
  try {
    const { code, nickname, avatar } = req.body
    if (!code) {
      return res.json({ code: 400, message: '缺少code参数' })
    }

    // 实际项目中需要调用微信接口获取 openid
    // const wxRes = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}&js_code=${code}&grant_type=authorization_code`)
    // const openid = wxRes.data.openid

    // 开发阶段使用模拟 openid
    const openid = `mock_openid_${code}`

    let [users] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])
    let user
    if (users.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
        [openid, nickname || '', avatar || '']
      )
      user = { id: result.insertId, openid, nickname: nickname || '', avatar: avatar || '' }
    } else {
      user = users[0]
      if ((nickname && nickname !== user.nickname) || (avatar && avatar !== user.avatar)) {
        await pool.query(
          'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
          [nickname || user.nickname || '', avatar || user.avatar || '', user.id]
        )
        user.nickname = nickname || user.nickname || ''
        user.avatar = avatar || user.avatar || ''
      }
    }

    const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' })
    res.json({ code: 200, data: { token, userInfo: user } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

module.exports = router
