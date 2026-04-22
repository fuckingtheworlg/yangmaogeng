#!/usr/bin/env bash
# 02_ships.sh — 船舶管理 CRUD + 公开接口
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

check_backend
section "02 船舶管理 CRUD"

TOKEN=$(login_as admin) || { _fail "管理员登录失败"; print_summary; }
TS=$(date +%s)

# 1. 新增船舶（测试数据用 test_ 前缀 + 时间戳便于识别清理）
CREATE_BODY=$(cat <<EOF
{
  "ship_name": "test_auto_${TS}",
  "total_length": 80,
  "width": 12,
  "depth": 5,
  "ship_type": "test-bulk",
  "ship_condition": "良好",
  "deadweight": 3000,
  "gross_tonnage": 2000,
  "net_tonnage": 1500,
  "build_date": "2020-01-01",
  "build_province": "江苏",
  "port_registry": "南京",
  "engine_brand": "test_brand",
  "engine_power": 800,
  "engine_count": 1,
  "water_type": "内河",
  "price": 888,
  "base_price": 800,
  "images": [],
  "certificates": [],
  "contact_name": "automation",
  "contact_phone": "13800000000",
  "description": "auto test created",
  "status": 1
}
EOF
)
RESP=$(api_call POST /api/admin/ships "$TOKEN" "$CREATE_BODY")
assert_ok "新增船舶" "$RESP"
SHIP_ID=$(echo "$RESP" | jq -r '.data.id')
SHIP_NO=$(echo "$RESP" | jq -r '.data.ship_no')
if [ -z "$SHIP_ID" ] || [ "$SHIP_ID" = "null" ]; then
  _fail "新增船舶未返回 id: $RESP"
  print_summary
fi
_pass "获得 ship id=${SHIP_ID}, ship_no=${SHIP_NO}"

# 2. 列表 + 筛选（按 ship_no 精确命中自己刚建的）
RESP=$(api_call GET "/api/admin/ships?ship_no=${SHIP_NO}" "$TOKEN")
assert_ok "按 ship_no 查询列表" "$RESP"
assert_field "筛选命中 1 条" "$RESP" '.data.list | length' "1"

# 3. 更新
RESP=$(api_call PUT "/api/admin/ships/${SHIP_ID}" "$TOKEN" '{"price": 999, "description": "updated"}')
assert_ok "更新船舶" "$RESP"
RESP=$(api_call GET "/api/admin/ships?ship_no=${SHIP_NO}" "$TOKEN")
UPDATED_PRICE=$(echo "$RESP" | jq -r '.data.list[0].price')
if num_eq "$UPDATED_PRICE" "999"; then
  _pass "价格已更新为 999（原始值=${UPDATED_PRICE}）"
else
  _fail "价格更新失败 实际=${UPDATED_PRICE}"
fi

# 4. 公开接口：/api/ships 应能看到 status=1 的船
RESP=$(api_call GET "/api/ships?keyword=${SHIP_NO}" "")
assert_ok "公开接口查询船舶列表" "$RESP"
FOUND=$(echo "$RESP" | jq -r --arg no "$SHIP_NO" '.data.list | map(select(.ship_no == $no)) | length')
if [ "$FOUND" = "1" ]; then
  _pass "公开列表能找到新增船舶"
else
  _fail "公开列表找不到 ship_no=${SHIP_NO} (命中 ${FOUND})"
fi

# 5. 公开详情接口
RESP=$(api_call GET "/api/ships/${SHIP_ID}" "")
assert_ok "公开详情接口" "$RESP"
assert_field "详情 ship_no 匹配" "$RESP" '.data.ship_no' "$SHIP_NO"

# 6. 清理：删除
RESP=$(api_call DELETE "/api/admin/ships/${SHIP_ID}" "$TOKEN")
assert_ok "删除船舶（清理）" "$RESP"

# 确认删除
RESP=$(api_call GET "/api/admin/ships?ship_no=${SHIP_NO}" "$TOKEN")
REMAIN=$(echo "$RESP" | jq -r '.data.list | length')
if [ "$REMAIN" = "0" ]; then
  _pass "删除后查询为空"
else
  _fail "删除后仍有 ${REMAIN} 条残留"
fi

print_summary
