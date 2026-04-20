USE yaomaogeng;

-- ships 表：新增是否参与首页轮播
ALTER TABLE ships ADD COLUMN is_carousel TINYINT DEFAULT 0 COMMENT '0不参与 1参与首页轮播' AFTER status;

-- commissions 表：新增匹配的船舶 ID 集合（逗号分隔）；扩展 status 至 4（拒绝/处理中/达成/成交/失效）
ALTER TABLE commissions ADD COLUMN matched_ship_ids VARCHAR(255) DEFAULT '' COMMENT '匹配的船舶ID，逗号分隔' AFTER status;

SELECT 'Migration v3 completed' AS status;
