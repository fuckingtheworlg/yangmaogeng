const jwt = require('jsonwebtoken')
require('dotenv').config()

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限' })
    }
    req.adminId = decoded.id
    next()
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token无效' })
  }
}

function userAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token无效' })
  }
}

module.exports = { adminAuth, userAuth }
