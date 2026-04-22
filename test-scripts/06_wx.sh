#!/usr/bin/env bash
# 06_wx.sh — 微信小程序登录 & 用户鉴权
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

check_backend
section "06 微信小程序登录"

TS=$(date +%s)

# 1. 缺 code 应报 400
RESP=$(curl -s -X POST "${BASE_URL}/api/wx/login" \
  -H "Content-Type: application/json" -d '{}')
assert_field "缺 code 返回 400" "$RESP" '.code' "400"

# 2. 正常登录（mock openid 机制）
RESP=$(curl -s -X POST "${BASE_URL}/api/wx/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"auto_${TS}\",\"nickname\":\"auto_${TS}\",\"avatar\":\"\"}")
assert_ok "微信登录" "$RESP"
USER_ID=$(echo "$RESP" | jq -r '.data.userInfo.id')
TOKEN=$(echo "$RESP" | jq -r '.data.token')
_pass "新用户 id=${USER_ID}, token 长度 ${#TOKEN}"

# 3. 用 token 访问用户受保护接口（/api/commissions GET 是 userAuth）
RESP=$(api_call GET /api/commissions "$TOKEN")
assert_ok "用户 token 访问 /api/commissions" "$RESP"

# 4. 用户 token 不能当管理员 token（/api/admin/stats 应被拒）
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  "${BASE_URL}/api/admin/stats")
if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
  _pass "用户 token 访问管理员接口被拒 (HTTP ${CODE})"
else
  _fail "用户 token 访问管理员接口预期 401/403 实际 ${CODE}（越权风险）"
fi

# 5. 再次登录同 code，应返回同一用户（openid 去重）
RESP=$(curl -s -X POST "${BASE_URL}/api/wx/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"auto_${TS}\",\"nickname\":\"auto_${TS}\",\"avatar\":\"\"}")
SAME_ID=$(echo "$RESP" | jq -r '.data.userInfo.id')
if [ "$SAME_ID" = "$USER_ID" ]; then
  _pass "同 code 二次登录返回同一 user id"
else
  _fail "同 code 二次登录 id 不同 (首次=${USER_ID} 再次=${SAME_ID})"
fi

# 清理：删除这个测试用户（管理员权限）
ADMIN_TOKEN=$(login_as admin) && [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ] && \
  api_call DELETE "/api/admin/users/${USER_ID}" "$ADMIN_TOKEN" >/dev/null && \
  _pass "清理测试用户 id=${USER_ID}"

print_summary
