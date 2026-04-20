/**
 * 编号生成工具
 * - 船舶：YYYYMMDD + 4位当日序号，例 202604180001
 * - 委托购买：GM + YYYY + 4位当年序号，例 GM20260001
 * - 委托出售：CS + YYYY + 4位当年序号，例 CS20260001
 * - 交易：CJ + YYYY + 4位当年序号，例 CJ20260001
 */

function padYMD(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

async function generateShipNo(pool) {
  const ymd = padYMD(new Date())
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS c FROM ships WHERE DATE(created_at) = CURDATE()"
  )
  return ymd + String((rows[0]?.c || 0) + 1).padStart(4, '0')
}

async function generateCommissionCode(pool, type) {
  const year = new Date().getFullYear()
  const prefix = type === 'buy' ? 'GM' : 'CS'
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS c FROM commissions WHERE type = ? AND YEAR(created_at) = ?",
    [type, year]
  )
  return `${prefix}${year}${String((rows[0]?.c || 0) + 1).padStart(4, '0')}`
}

async function generateTransactionCode(pool) {
  const year = new Date().getFullYear()
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS c FROM transactions WHERE YEAR(created_at) = ?",
    [year]
  )
  return `CJ${year}${String((rows[0]?.c || 0) + 1).padStart(4, '0')}`
}

module.exports = {
  generateShipNo,
  generateCommissionCode,
  generateTransactionCode
}
