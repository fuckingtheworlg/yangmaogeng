const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 jpg/jpeg/png/gif/webp 格式'))
    }
  }
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ code: 400, message: '未选择文件' })
  }
  const url = `/uploads/${req.file.filename}`
  res.json({ code: 200, data: { url }, message: '上传成功' })
})

module.exports = router
