const express = require('express')
const router = express.Router()
const pool = require('../config/db')

// 船舶列表（公开接口，小程序首页使用）
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, min_deadweight, max_deadweight, keyword } = req.query
    let sql = 'SELECT * FROM ships WHERE status = 1'
    const params = []
    if (min_deadweight) { sql += ' AND deadweight >= ?'; params.push(Number(min_deadweight)) }
    if (max_deadweight) { sql += ' AND deadweight < ?'; params.push(Number(max_deadweight)) }
    if (keyword) {
      sql += ' AND (ship_no LIKE ? OR ship_type LIKE ? OR build_province LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))
    const [rows] = await pool.query(sql, params)

    rows.forEach(row => {
      try { row.images = JSON.parse(row.images || '[]') } catch { row.images = [] }
      try { row.certificates = JSON.parse(row.certificates || '[]') } catch { row.certificates = [] }
    })

    res.json({ code: 200, data: { list: rows } })
  } catch (err) {
    console.error(`[${req.method} ${req.originalUrl}] error:`, err)
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 船舶详情
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ships WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.json({ code: 404, message: '船舶不存在' })
    }
    const ship = rows[0]
    try { ship.images = JSON.parse(ship.images || '[]') } catch { ship.images = [] }
    try { ship.certificates = JSON.parse(ship.certificates || '[]') } catch { ship.certificates = [] }
    res.json({ code: 200, data: ship })
  } catch (err) {
    console.error(`[${req.method} ${req.originalUrl}] error:`, err)
    res.status(500).json({ code: 500, message: err.message })
  }
})

module.exports = router
