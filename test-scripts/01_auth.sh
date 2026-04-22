#!/usr/bin/env bash
# 01_auth.sh — 管理员登录 + 鉴权边界
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

check_backend
section "01 管理员登录 & 鉴权"

# 1. 正确凭据登录
RESP=$(curl -s -X POST "${BASE_URL}/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
assert_ok "管理员正确凭据登录" "$RESP"
assert_field "返回 username" "$RESP" '.data.username' "$ADMIN_USER"
TOKEN=$(echo "$RESP" | jq -r '.data.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  _fail "token 为空"
else
  _pass "token 非空 (长度 ${#TOKEN})"
fi

# 2. 错误密码
RESP=$(curl -s -X POST "${BASE_URL}/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"wrong_pwd_xxx\"}")
assert_field "错误密码应返回 400" "$RESP" '.code' "400"

# 3. 带合法 token 访问受保护接口
RESP=$(api_call GET /api/admin/stats "$TOKEN")
assert_ok "合法 token 访问 /api/admin/stats" "$RESP"

# 4. 无 token 访问受保护接口（应被 adminAuth 拦截）
CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/admin/stats")
if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
  _pass "未带 token 被拦截 (HTTP ${CODE})"
else
  _fail "未带 token 预期 401/403 实际 ${CODE}"
fi

# 5. 伪造 token
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer not_a_real_token" \
  "${BASE_URL}/api/admin/stats")
if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
  _pass "伪造 token 被拦截 (HTTP ${CODE})"
else
  _fail "伪造 token 预期 401/403 实际 ${CODE}"
fi

print_summary
