#!/usr/bin/env bash
# 03_commissions.sh — 委托（后台管理 + 用户提交）
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

check_backend
section "03 委托管理（管理员 + 小程序用户）"

ADMIN_TOKEN=$(login_as admin) || { _fail "管理员登录失败"; print_summary; }
USER_TOKEN=$(login_as user) || { _fail "用户登录失败"; print_summary; }
TS=$(date +%s)

# ========== 管理员侧 ==========
# 1. 管理员创建出售委托
SELL_BODY=$(cat <<EOF
{
  "type": "sell",
  "contact_name": "auto_seller_${TS}",
  "gender": "男",
  "phone": "13900000001",
  "total_length": 70,
  "width": 11,
  "depth": 4,
  "deadweight": 2500,
  "gross_tonnage": 1800,
  "build_date": "2019-06-01",
  "build_province": "浙江",
  "port_registry": "宁波",
  "water_type": "内河",
  "ship_type": "test-sell",
  "engine_brand": "auto_brand",
  "engine_power": 600,
  "engine_count": 1,
  "price": 666,
  "ship_images": [],
  "cert_images": [],
  "remark": "auto test"
}
EOF
)
RESP=$(api_call POST /api/admin/commissions "$ADMIN_TOKEN" "$SELL_BODY")
assert_ok "管理员创建出售委托" "$RESP"
SELL_ID=$(echo "$RESP" | jq -r '.data.id')
SELL_CODE=$(echo "$RESP" | jq -r '.data.code')
_pass "出售委托 id=${SELL_ID}, code=${SELL_CODE}"

# 2. 查询列表：按 code 关键字过滤
RESP=$(api_call GET "/api/admin/commissions?keyword=${SELL_CODE}" "$ADMIN_TOKEN")
assert_ok "按 code 筛选委托" "$RESP"
assert_field "筛选命中 1 条" "$RESP" '.data.list | length' "1"

# 3. 更新委托状态
RESP=$(api_call PUT "/api/admin/commissions/${SELL_ID}" "$ADMIN_TOKEN" '{"remark":"reviewed"}')
assert_ok "更新委托" "$RESP"

# 4. 出售委托导入船舶库
RESP=$(api_call POST "/api/admin/commissions/${SELL_ID}/import-ship" "$ADMIN_TOKEN" \
  "{\"ship_name\":\"auto_imported_${TS}\"}")
assert_ok "出售委托导入船舶库" "$RESP"
IMPORTED_SHIP_ID=$(echo "$RESP" | jq -r '.data.ship_id')
IMPORTED_SHIP_NO=$(echo "$RESP" | jq -r '.data.ship_no')
_pass "已导入船舶 id=${IMPORTED_SHIP_ID}, ship_no=${IMPORTED_SHIP_NO}"

# ========== 用户侧 ==========
# 5. 用户提交买入委托
BUY_BODY=$(cat <<EOF
{
  "type": "buy",
  "contact_name": "auto_buyer_${TS}",
  "gender": "男",
  "phone": "13900000002",
  "total_length": 60,
  "deadweight": 2000,
  "budget": 500,
  "ship_type": "test-buy",
  "water_type": "内河",
  "ship_images": [],
  "cert_images": [],
  "remark": "auto test buy"
}
EOF
)
RESP=$(api_call POST /api/commissions "$USER_TOKEN" "$BUY_BODY")
assert_ok "用户提交买入委托" "$RESP"
BUY_ID=$(echo "$RESP" | jq -r '.data.id')
_pass "用户委托 id=${BUY_ID}"

# 6. 我的委托列表应包含刚提交的
RESP=$(api_call GET /api/commissions "$USER_TOKEN")
assert_ok "用户查询我的委托" "$RESP"
FOUND=$(echo "$RESP" | jq -r --argjson id "$BUY_ID" '.data.list | map(select(.id == $id)) | length')
if [ "$FOUND" = "1" ]; then
  _pass "我的委托列表包含 id=${BUY_ID}"
else
  _fail "我的委托列表未命中 (id=${BUY_ID})"
fi

# ========== 清理 ==========
# 删除委托（管理员没有直接 DELETE 委托的路由，但导入后出售委托 status=1，基本不会干扰下次测试）
# 清理导入的船舶，防止堆积
if [ -n "$IMPORTED_SHIP_ID" ] && [ "$IMPORTED_SHIP_ID" != "null" ]; then
  api_call DELETE "/api/admin/ships/${IMPORTED_SHIP_ID}" "$ADMIN_TOKEN" >/dev/null
  _pass "清理导入的船舶 id=${IMPORTED_SHIP_ID}"
fi

print_summary
