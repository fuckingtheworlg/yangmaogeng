const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const { userAuth } = require('../middleware/auth')

// 我的收藏列表
router.get('/', userAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT f.id, f.ship_id, f.created_at, s.ship_no, s.deadweight, s.price, s.images FROM favorites f LEFT JOIN ships s ON f.ship_id = s.id WHERE f.user_id = ? ORDER BY f.id DESC',
      [req.userId]
    )
    rows.forEach(row => {
      try { row.images = JSON.parse(row.images || '[]') } catch { row.images = [] }
    })
    res.json({ code: 200, data: { list: rows } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 添加收藏
router.post('/', userAuth, async (req, res) => {
  try {
    const { ship_id } = req.body
    await pool.query('INSERT IGNORE INTO favorites (user_id, ship_id) VALUES (?, ?)', [req.userId, ship_id])
    res.json({ code: 200, message: '收藏成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 取消收藏
router.delete('/:shipId', userAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = ? AND ship_id = ?', [req.userId, req.params.shipId])
    res.json({ code: 200, message: '取消收藏成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 检查是否已收藏
router.get('/check/:shipId', userAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM favorites WHERE user_id = ? AND ship_id = ?', [req.userId, req.params.shipId])
    res.json({ code: 200, data: { isFavorited: rows.length > 0 } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

module.exports = router
