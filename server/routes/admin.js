const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const { adminAuth } = require('../middleware/auth')
require('dotenv').config()

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.json({ code: 400, message: '请输入用户名和密码' })
    }
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username])
    if (rows.length === 0) {
      return res.json({ code: 400, message: '用户名或密码错误' })
    }
    const admin = rows[0]
    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      return res.json({ code: 400, message: '用户名或密码错误' })
    }
    const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ code: 200, data: { token, username: admin.username } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// ========== 船舶管理 ==========
router.get('/ships', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, ship_no, deadweight, gross_tonnage, build_date, price } = req.query
    let sql = 'SELECT * FROM ships WHERE 1=1'
    const params = []
    if (ship_no) { sql += ' AND ship_no LIKE ?'; params.push(`%${ship_no}%`) }
    if (deadweight) { sql += ' AND deadweight >= ?'; params.push(Number(deadweight)) }
    if (gross_tonnage) { sql += ' AND gross_tonnage >= ?'; params.push(Number(gross_tonnage)) }
    if (build_date) { sql += ' AND build_date = ?'; params.push(build_date) }
    if (price) { sql += ' AND price >= ?'; params.push(Number(price)) }
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))
    const [rows] = await pool.query(sql, params)

    let countSql = 'SELECT COUNT(*) as total FROM ships WHERE 1=1'
    const countParams = []
    if (ship_no) { countSql += ' AND ship_no LIKE ?'; countParams.push(`%${ship_no}%`) }
    if (deadweight) { countSql += ' AND deadweight >= ?'; countParams.push(Number(deadweight)) }
    const [countRows] = await pool.query(countSql, countParams)

    res.json({ code: 200, data: { list: rows, total: countRows[0].total } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.post('/ships', adminAuth, async (req, res) => {
  try {
    const data = req.body
    const fields = ['ship_no', 'total_length', 'width', 'depth', 'ship_type', 'ship_condition', 'deadweight', 'gross_tonnage', 'build_date', 'build_province', 'port_registry', 'engine_brand', 'engine_power', 'engine_count', 'water_type', 'price', 'images', 'certificates', 'contact_name', 'contact_phone', 'description', 'status', 'is_carousel']
    const values = fields.map(f => data[f] !== undefined ? (typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f]) : null)
    const sql = `INSERT INTO ships (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`
    const [result] = await pool.query(sql, values)
    res.json({ code: 200, data: { id: result.insertId }, message: '新增成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.put('/ships/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    const fields = ['ship_no', 'total_length', 'width', 'depth', 'ship_type', 'ship_condition', 'deadweight', 'gross_tonnage', 'build_date', 'build_province', 'port_registry', 'engine_brand', 'engine_power', 'engine_count', 'water_type', 'price', 'images', 'certificates', 'contact_name', 'contact_phone', 'description', 'status', 'is_carousel']
    const sets = []
    const values = []
    fields.forEach(f => {
      if (data[f] !== undefined) {
        sets.push(`${f} = ?`)
        values.push(typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f])
      }
    })
    if (sets.length === 0) return res.json({ code: 400, message: '无更新字段' })
    values.push(id)
    await pool.query(`UPDATE ships SET ${sets.join(',')} WHERE id = ?`, values)
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.delete('/ships/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM ships WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 成交：创建交易记录并把 ship 标记为 status=2（已售）
router.post('/ships/:id/finalize', adminAuth, async (req, res) => {
  try {
    const shipId = Number(req.params.id)
    const { price, buyer_name, buyer_phone, seller_name, seller_phone, commission_id, remark } = req.body
    if (!price || !buyer_name) {
      return res.json({ code: 400, message: '请填写买家和成交价' })
    }
    const today = new Date().toISOString().split('T')[0]
    const [result] = await pool.query(
      'INSERT INTO transactions (ship_id, commission_id, price, buyer_name, buyer_phone, seller_name, seller_phone, remark, deal_date) VALUES (?,?,?,?,?,?,?,?,?)',
      [shipId, commission_id || null, price, buyer_name, buyer_phone || '', seller_name || '', seller_phone || '', remark || '', today]
    )
    await pool.query('UPDATE ships SET status = 2 WHERE id = ?', [shipId])
    if (commission_id) {
      await pool.query('UPDATE commissions SET status = 2 WHERE id = ?', [commission_id])
    }
    res.json({ code: 200, data: { id: result.insertId }, message: '成交成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// ========== 用户管理 ==========
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, id: userId, phone } = req.query
    let sql = 'SELECT u.*, GROUP_CONCAT(DISTINCT c.id) as commission_ids, GROUP_CONCAT(DISTINCT f.ship_id) as favorite_ids FROM users u LEFT JOIN commissions c ON u.id = c.user_id LEFT JOIN favorites f ON u.id = f.user_id WHERE 1=1'
    const params = []
    if (userId) { sql += ' AND u.id = ?'; params.push(Number(userId)) }
    if (phone) { sql += ' AND u.phone LIKE ?'; params.push(`%${phone}%`) }
    sql += ' GROUP BY u.id ORDER BY u.id DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))
    const [rows] = await pool.query(sql, params)
    res.json({ code: 200, data: { list: rows } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { nickname, phone } = req.body
    await pool.query('UPDATE users SET nickname = ?, phone = ? WHERE id = ?', [nickname, phone, req.params.id])
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// ========== 委托管理 ==========
router.get('/commissions', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, status, keyword } = req.query
    let sql = 'SELECT * FROM commissions WHERE 1=1'
    const params = []
    if (type) { sql += ' AND type = ?'; params.push(type) }
    if (status !== undefined && status !== '') { sql += ' AND status = ?'; params.push(Number(status)) }
    if (keyword) { sql += ' AND (CAST(id AS CHAR) LIKE ? OR phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))
    const [rows] = await pool.query(sql, params)
    res.json({ code: 200, data: { list: rows } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.put('/commissions/:id', adminAuth, async (req, res) => {
  try {
    const { status, matched_ship_ids } = req.body
    const sets = []
    const values = []
    if (status !== undefined) { sets.push('status = ?'); values.push(status) }
    if (matched_ship_ids !== undefined) { sets.push('matched_ship_ids = ?'); values.push(matched_ship_ids) }
    if (sets.length === 0) return res.json({ code: 400, message: '无更新字段' })
    values.push(req.params.id)
    await pool.query(`UPDATE commissions SET ${sets.join(',')} WHERE id = ?`, values)
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 出售委托 → 导入船舶库
router.post('/commissions/:id/import-ship', adminAuth, async (req, res) => {
  try {
    const commissionId = Number(req.params.id)
    const [rows] = await pool.query('SELECT * FROM commissions WHERE id = ?', [commissionId])
    if (rows.length === 0) return res.json({ code: 404, message: '委托不存在' })
    const c = rows[0]
    if (c.type !== 'sell') return res.json({ code: 400, message: '仅出售委托可导入' })
    const override = req.body || {}
    const now = new Date()
    const shipNo = override.ship_no || `CS${now.getFullYear()}${String(commissionId).padStart(4, '0')}`
    const [result] = await pool.query(
      `INSERT INTO ships (ship_no, total_length, width, depth, ship_type, ship_condition, deadweight, gross_tonnage, build_date, build_province, engine_brand, engine_power, engine_count, water_type, price, images, certificates, contact_name, contact_phone, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        shipNo,
        override.total_length || c.total_length || 0,
        override.width || c.width || 0,
        override.depth || c.depth || 0,
        override.ship_type || c.ship_type || '',
        override.ship_condition || '良好',
        override.deadweight || c.deadweight || 0,
        override.gross_tonnage || c.gross_tonnage || 0,
        override.build_date || c.build_date || '',
        override.build_province || c.build_province || '',
        override.engine_brand || c.engine_brand || '',
        override.engine_power || c.engine_power || 0,
        override.engine_count || c.engine_count || 1,
        override.water_type || c.water_type || '内河',
        override.price || override.budget || 0,
        c.ship_images || '[]',
        c.cert_images || '[]',
        c.contact_name || '',
        c.phone || '',
        1
      ]
    )
    await pool.query('UPDATE commissions SET status = 1 WHERE id = ?', [commissionId])
    res.json({ code: 200, data: { ship_id: result.insertId, ship_no: shipNo }, message: '已导入船舶库' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// ========== 交易记录 ==========
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, id: txId, build_date, price } = req.query
    let sql = 'SELECT t.*, s.ship_no, s.total_length, s.width, s.depth, s.deadweight, s.gross_tonnage, s.build_date as ship_build_date, s.engine_brand, s.engine_power, s.water_type FROM transactions t LEFT JOIN ships s ON t.ship_id = s.id WHERE 1=1'
    const params = []
    if (txId) { sql += ' AND t.id = ?'; params.push(Number(txId)) }
    if (build_date) { sql += ' AND s.build_date = ?'; params.push(build_date) }
    if (price) { sql += ' AND t.price >= ?'; params.push(Number(price)) }
    sql += ' ORDER BY t.id DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))
    const [rows] = await pool.query(sql, params)
    res.json({ code: 200, data: { list: rows } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.post('/transactions', adminAuth, async (req, res) => {
  try {
    const { ship_id, commission_id, price, buyer_name, buyer_phone, seller_name, seller_phone, remark, deal_date } = req.body
    const [result] = await pool.query(
      'INSERT INTO transactions (ship_id, commission_id, price, buyer_name, buyer_phone, seller_name, seller_phone, remark, deal_date) VALUES (?,?,?,?,?,?,?,?,?)',
      [ship_id, commission_id, price, buyer_name, buyer_phone, seller_name, seller_phone, remark, deal_date]
    )
    res.json({ code: 200, data: { id: result.insertId }, message: '新增成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.put('/transactions/:id', adminAuth, async (req, res) => {
  try {
    const fields = ['price', 'buyer_name', 'buyer_phone', 'seller_name', 'seller_phone', 'remark', 'deal_date']
    const data = req.body
    const sets = []
    const values = []
    fields.forEach(f => {
      if (data[f] !== undefined) { sets.push(`${f} = ?`); values.push(data[f]) }
    })
    if (sets.length === 0) return res.json({ code: 400, message: '无更新字段' })
    values.push(req.params.id)
    await pool.query(`UPDATE transactions SET ${sets.join(',')} WHERE id = ?`, values)
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

router.delete('/transactions/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// ========== 统计 ==========
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [shipCount] = await pool.query('SELECT COUNT(*) as count FROM ships')
    const today = new Date().toISOString().split('T')[0]
    const [commissionCount] = await pool.query('SELECT COUNT(*) as count FROM commissions WHERE DATE(created_at) = ?', [today])
    res.json({
      code: 200,
      data: {
        shipCount: shipCount[0].count,
        todayCommissions: commissionCount[0].count
      }
    })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

module.exports = router
