/**
 * 幂等数据库迁移脚本（可重复执行）
 * 用法：node server/scripts/migrate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mysql = require('mysql2/promise')

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'yaomaogeng',
    waitForConnections: true
  })

  async function columnExists(table, column) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [table, column]
    )
    return rows[0].c > 0
  }

  async function indexExists(table, index) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS c FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
      [table, index]
    )
    return rows[0].c > 0
  }

  async function addColumn(table, column, definition) {
    if (await columnExists(table, column)) {
      console.log(`  [skip] ${table}.${column} already exists`)
    } else {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
      console.log(`  [added] ${table}.${column}`)
    }
  }

  async function addIndex(table, name, cols) {
    if (await indexExists(table, name)) {
      console.log(`  [skip] index ${name} already exists`)
    } else {
      await pool.query(`CREATE INDEX ${name} ON ${table}(${cols})`)
      console.log(`  [added] index ${name}`)
    }
  }

  console.log('== migration v2 (engine_count / description) ==')
  await addColumn('ships', 'engine_count', "INT DEFAULT 1 AFTER engine_power")
  await addColumn('ships', 'description', "TEXT AFTER contact_phone")
  await addColumn('commissions', 'engine_count', "INT DEFAULT 1 AFTER engine_power")
  await addColumn('commissions', 'year_start', "VARCHAR(10) DEFAULT '' AFTER engine_count")
  await addColumn('commissions', 'year_end', "VARCHAR(10) DEFAULT '' AFTER year_start")

  console.log('== migration v3 (is_carousel / matched_ship_ids) ==')
  await addColumn('ships', 'is_carousel', "TINYINT DEFAULT 0 COMMENT '0不参与 1参与首页轮播' AFTER status")
  await addColumn('commissions', 'matched_ship_ids', "VARCHAR(255) DEFAULT '' COMMENT '匹配船舶ID，逗号分隔' AFTER status")

  console.log('== migration v4 (ship_name / net_tonnage / base_price / code / port_registry / price) ==')
  await addColumn('ships', 'ship_name', "VARCHAR(100) DEFAULT '' COMMENT '船号名称' AFTER ship_no")
  await addColumn('ships', 'net_tonnage', "INT DEFAULT 0 COMMENT '净吨' AFTER gross_tonnage")
  await addColumn('ships', 'base_price', "DECIMAL(10,2) DEFAULT 0 COMMENT '起价' AFTER price")
  await addColumn('commissions', 'code', "VARCHAR(30) DEFAULT '' COMMENT '显示编号' AFTER id")
  await addColumn('commissions', 'port_registry', "VARCHAR(50) DEFAULT '' COMMENT '港籍' AFTER build_province")
  await addColumn('commissions', 'price', "DECIMAL(10,2) DEFAULT NULL COMMENT '出售报价' AFTER budget")
  await addColumn('transactions', 'code', "VARCHAR(30) DEFAULT '' COMMENT '显示编号' AFTER id")

  console.log('== backfill code for commissions / transactions ==')
  await pool.query(`
    UPDATE commissions SET code = CONCAT(
      IF(type='buy','GM','CS'),
      YEAR(IFNULL(created_at, NOW())),
      LPAD(id, 4, '0')
    ) WHERE code = '' OR code IS NULL
  `)
  await pool.query(`
    UPDATE transactions SET code = CONCAT(
      'CJ',
      YEAR(IFNULL(deal_date, NOW())),
      LPAD(id, 4, '0')
    ) WHERE code = '' OR code IS NULL
  `)

  console.log('== indexes ==')
  await addIndex('commissions', 'idx_commissions_code', 'code')
  await addIndex('transactions', 'idx_transactions_code', 'code')

  console.log('\nAll migrations completed successfully.')
  await pool.end()
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
