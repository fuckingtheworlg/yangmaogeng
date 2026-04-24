const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
require('dotenv').config()

// 通过 code 换取微信 openid。失败时抛出带 errcode/errmsg 的错误，由上层 catch 统一返回
async function exchangeOpenid(code) {
  const appid = process.env.WX_APPID
  const secret = process.env.WX_SECRET
  if (!appid || !secret || appid.startsWith('wx0000') || secret === 'your_wechat_secret') {
    const err = new Error('后端未配置微信 AppID/AppSecret')
    err.errcode = -10001
    throw err
  }
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
  const wxResp = await fetch(url)
  if (!wxResp.ok) {
    const err = new Error(`jscode2session HTTP ${wxResp.status}`)
    err.errcode = wxResp.status
    throw err
  }
  const data = await wxResp.json()
  // 微信官方约定：成功时返回 openid/session_key/unionid（有时无 errcode），失败时返回非 0 的 errcode 和 errmsg
  if (data.errcode && data.errcode !== 0) {
    const err = new Error(data.errmsg || 'jscode2session failed')
    err.errcode = data.errcode
    throw err
  }
  if (!data.openid) {
    const err = new Error('jscode2session 未返回 openid')
    err.errcode = -10002
    throw err
  }
  return data.openid
}

// 微信小程序登录
router.post('/login', async (req, res) => {
  try {
    const { code, nickname, avatar } = req.body
    if (!code) {
      return res.json({ code: 400, message: '缺少code参数' })
    }

    let openid
    try {
      openid = await exchangeOpenid(code)
    } catch (e) {
      console.error(`[${req.method} ${req.originalUrl}] jscode2session failed:`, e.errcode, e.message)
      return res.json({ code: 401, message: `微信登录失败(${e.errcode || 'unknown'}): ${e.message}` })
    }

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
    console.error(`[${req.method} ${req.originalUrl}] error:`, err)
    res.status(500).json({ code: 500, message: err.message })
  }
})

module.exports = router
