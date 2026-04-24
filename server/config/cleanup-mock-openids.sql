-- ============================================================
-- 一次性脚本：清理早期 wx.js 使用 `mock_openid_${code}` 造成的脏用户数据
-- 背景：
--   修复前 server/routes/wx.js 用 mock_openid_${code} 伪造 openid，每次登录 code 不同
--   会插入新用户。切换到真实 jscode2session 之后，这些 mock 用户应清理。
-- 影响：
--   favorites.user_id ON DELETE CASCADE  → 对应收藏会被自动删除（本就是测试数据）
--   commissions.user_id ON DELETE SET NULL → 委托记录保留，只是 user_id 变为 NULL
-- 执行：
--   mysql -u root -p yaomaogeng < server/config/cleanup-mock-openids.sql
-- ============================================================

-- 1. 先查受影响的行数（只读，先确认规模再决定是否继续）
SELECT COUNT(*) AS mock_user_count FROM users WHERE openid LIKE 'mock_openid_%';

SELECT COUNT(*) AS affected_favorites
FROM favorites f JOIN users u ON f.user_id = u.id
WHERE u.openid LIKE 'mock_openid_%';

SELECT COUNT(*) AS affected_commissions
FROM commissions c JOIN users u ON c.user_id = u.id
WHERE u.openid LIKE 'mock_openid_%';

-- 2. 确认规模可接受后，执行删除（级联生效）
DELETE FROM users WHERE openid LIKE 'mock_openid_%';

-- 3. 复查（应为 0）
SELECT COUNT(*) AS remaining_mock_users FROM users WHERE openid LIKE 'mock_openid_%';
