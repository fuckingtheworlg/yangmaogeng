const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/admin', require('./routes/admin'))
app.use('/api/wx', require('./routes/wx'))
app.use('/api/ships', require('./routes/ships'))
app.use('/api/favorites', require('./routes/favorites'))
app.use('/api/commissions', require('./routes/commissions'))
app.use('/api/upload', require('./routes/upload'))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ code: 500, message: '服务器内部错误' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
