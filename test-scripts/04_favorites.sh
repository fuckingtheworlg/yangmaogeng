#!/usr/bin/env bash
# 04_favorites.sh — 用户收藏
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

check_backend
section "04 用户收藏"

ADMIN_TOKEN=$(login_as admin) || { _fail "管理员登录失败"; print_summary; }
USER_TOKEN=$(login_as user) || { _fail "用户登录失败"; print_summary; }
TS=$(date +%s)

# 准备：新建一条测试船舶
RESP=$(api_call POST /api/admin/ships "$ADMIN_TOKEN" "{\"ship_name\":\"fav_test_${TS}\",\"deadweight\":1000,\"status\":1}")
SHIP_ID=$(echo "$RESP" | jq -r '.data.id')
if [ -z "$SHIP_ID" ] || [ "$SHIP_ID" = "null" ]; then
  _fail "前置：新建船舶失败 $RESP"
  print_summary
fi
_pass "准备船舶 id=${SHIP_ID}"

# 1. 收藏前检查：应为 false
RESP=$(api_call GET "/api/favorites/check/${SHIP_ID}" "$USER_TOKEN")
assert_ok "检查收藏状态" "$RESP"
assert_field "初始未收藏" "$RESP" '.data.isFavorited' "false"

# 2. 添加收藏
RESP=$(api_call POST /api/favorites "$USER_TOKEN" "{\"ship_id\":${SHIP_ID}}")
assert_ok "添加收藏" "$RESP"

# 3. 再次检查：应为 true
RESP=$(api_call GET "/api/favorites/check/${SHIP_ID}" "$USER_TOKEN")
assert_field "收藏后状态为 true" "$RESP" '.data.isFavorited' "true"

# 4. 收藏列表应包含
RESP=$(api_call GET /api/favorites "$USER_TOKEN")
assert_ok "查询收藏列表" "$RESP"
FOUND=$(echo "$RESP" | jq -r --argjson id "$SHIP_ID" '.data.list | map(select(.ship_id == $id)) | length')
if [ "$FOUND" = "1" ]; then
  _pass "收藏列表包含 ship_id=${SHIP_ID}"
else
  _fail "收藏列表未命中 ship_id=${SHIP_ID} (命中 ${FOUND})"
fi

# 5. 重复收藏应幂等（INSERT IGNORE）
RESP=$(api_call POST /api/favorites "$USER_TOKEN" "{\"ship_id\":${SHIP_ID}}")
assert_ok "重复收藏幂等" "$RESP"

# 6. 取消收藏
RESP=$(api_call DELETE "/api/favorites/${SHIP_ID}" "$USER_TOKEN")
assert_ok "取消收藏" "$RESP"
RESP=$(api_call GET "/api/favorites/check/${SHIP_ID}" "$USER_TOKEN")
assert_field "取消后状态 false" "$RESP" '.data.isFavorited' "false"

# 清理：删除测试船舶
api_call DELETE "/api/admin/ships/${SHIP_ID}" "$ADMIN_TOKEN" >/dev/null
_pass "清理船舶 id=${SHIP_ID}"

print_summary
