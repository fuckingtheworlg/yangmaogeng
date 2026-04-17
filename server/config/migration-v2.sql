USE yaomaogeng;

-- ships 表新增字段
ALTER TABLE ships ADD COLUMN engine_count INT DEFAULT 1 AFTER engine_power;
ALTER TABLE ships ADD COLUMN description TEXT AFTER contact_phone;

-- commissions 表新增字段
ALTER TABLE commissions ADD COLUMN engine_count INT DEFAULT 1 AFTER engine_power;
ALTER TABLE commissions ADD COLUMN year_start VARCHAR(10) DEFAULT '' AFTER engine_count;
ALTER TABLE commissions ADD COLUMN year_end VARCHAR(10) DEFAULT '' AFTER year_start;

SELECT 'Migration v2 completed' AS status;
