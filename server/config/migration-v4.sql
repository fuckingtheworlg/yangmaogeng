USE yaomaogeng;

-- ships: 新增船号/净吨/起价
ALTER TABLE ships ADD COLUMN ship_name VARCHAR(100) DEFAULT '' COMMENT '船号名称' AFTER ship_no;
ALTER TABLE ships ADD COLUMN net_tonnage INT DEFAULT 0 COMMENT '净吨' AFTER gross_tonnage;
ALTER TABLE ships ADD COLUMN base_price DECIMAL(10,2) DEFAULT 0 COMMENT '起价' AFTER price;

-- commissions: 新增编号/港籍/出售报价
ALTER TABLE commissions ADD COLUMN code VARCHAR(30) DEFAULT '' COMMENT '显示编号 GM/CS+年+序号' AFTER id;
ALTER TABLE commissions ADD COLUMN port_registry VARCHAR(50) DEFAULT '' COMMENT '港籍' AFTER build_province;
ALTER TABLE commissions ADD COLUMN price DECIMAL(10,2) DEFAULT NULL COMMENT '出售报价，购买用 budget' AFTER budget;

-- transactions: 新增编号
ALTER TABLE transactions ADD COLUMN code VARCHAR(30) DEFAULT '' COMMENT '显示编号 CJ+年+序号' AFTER id;

-- 为已有数据回填 code（避免空 code 导致排序/唯一性冲突）
UPDATE commissions SET code = CONCAT(
  IF(type='buy','GM','CS'),
  YEAR(IFNULL(created_at, NOW())),
  LPAD(id, 4, '0')
) WHERE code = '';

UPDATE transactions SET code = CONCAT(
  'CJ',
  YEAR(IFNULL(deal_date, NOW())),
  LPAD(id, 4, '0')
) WHERE code = '';

-- 加索引（可选）
CREATE INDEX idx_commissions_code ON commissions(code);
CREATE INDEX idx_transactions_code ON transactions(code);

SELECT 'Migration v4 completed' AS status;
