const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const { userAuth } = require('../middleware/auth')
const { generateCommissionCode } = require('../utils/code')

// 提交委托（用户端）
router.post('/', userAuth, async (req, res) => {
  try {
    const data = req.body
    const type = data.type === 'buy' ? 'buy' : 'sell'
    const code = await generateCommissionCode(pool, type)
    const fields = ['code', 'user_id', 'type', 'contact_name', 'gender', 'phone', 'total_length', 'width', 'depth', 'deadweight', 'gross_tonnage', 'build_date', 'build_province', 'port_registry', 'water_type', 'ship_type', 'engine_brand', 'engine_power', 'engine_count', 'year_start', 'year_end', 'budget', 'price', 'ship_images', 'cert_images', 'remark']
    const values = fields.map(f => {
      if (f === 'code') return code
      if (f === 'type') return type
      if (f === 'user_id') return req.userId
      if (f === 'ship_images' || f === 'cert_images') return JSON.stringify(data[f] || [])
      const v = data[f]
      if (v === undefined || v === null) return null
      if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v)
      return v
    })
    const sql = `INSERT INTO commissions (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`
    const [result] = await pool.query(sql, values)
    res.json({ code: 200, data: { id: result.insertId, code }, message: '委托提交成功' })
  } catch (err) {
    console.error(`[${req.method} ${req.originalUrl}] error:`, err)
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 我的委托列表（用户端）
router.get('/', userAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM commissions WHERE user_id = ? ORDER BY id DESC',
      [req.userId]
    )
    res.json({ code: 200, data: { list: rows } })
  } catch (err) {
    console.error(`[${req.method} ${req.originalUrl}] error:`, err)
    res.status(500).json({ code: 500, message: err.message })
  }
})

module.exports = router
