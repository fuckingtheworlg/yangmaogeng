#!/usr/bin/env bash
# 测试套件共享工具库
# 约定：所有 0X_*.sh 脚本 source 这个文件后即可使用统一的断言、着色、计数器

# BASE_URL 可通过环境变量覆盖，默认指向阿里云线上后端
export BASE_URL="${BASE_URL:-https://yangmaogeng.top}"
export ADMIN_USER="${ADMIN_USER:-admin}"
export ADMIN_PASS="${ADMIN_PASS:-admin123}"

# ---------- 颜色 ----------
if [ -t 1 ]; then
  C_RESET='\033[0m'; C_RED='\033[31m'; C_GREEN='\033[32m'
  C_YELLOW='\033[33m'; C_BLUE='\033[34m'; C_BOLD='\033[1m'
else
  C_RESET=''; C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''; C_BOLD=''
fi

# ---------- 计数器 ----------
PASS_COUNT=0
FAIL_COUNT=0
FAILED_ASSERTIONS=()

# ---------- 依赖检查 ----------
require() {
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo -e "${C_RED}[缺少依赖] 需要安装 $cmd${C_RESET}" >&2
      exit 2
    fi
  done
}

check_backend() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${BASE_URL}/api/ships" || echo "000")
  if [ "$code" = "000" ]; then
    echo -e "${C_RED}[后端不可达] ${BASE_URL}/api/ships 无响应${C_RESET}" >&2
    exit 3
  fi
  if [ "$code" = "404" ] || [ "$code" = "502" ] || [ "$code" = "503" ]; then
    echo -e "${C_RED}[后端异常] ${BASE_URL}/api/ships 返回 ${code}${C_RESET}" >&2
    exit 3
  fi
}

section() {
  echo ""
  echo -e "${C_BOLD}${C_BLUE}=== $* ===${C_RESET}"
}

# ---------- 登录 ----------
# login_as admin  → 返回管理员 JWT
# login_as user [code]  → 走 wx.login mock openid 流程返回用户 JWT
login_as() {
  local kind="${1:-admin}"
  local resp

  if [ "$kind" = "admin" ]; then
    resp=$(curl -s -X POST "${BASE_URL}/api/admin/login" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
    local code
    code=$(echo "$resp" | jq -r '.code // 0')
    if [ "$code" != "200" ]; then
      echo -e "${C_RED}[login_as admin] 登录失败: $resp${C_RESET}" >&2
      return 1
    fi
    echo "$resp" | jq -r '.data.token'
  else
    # 用户（微信小程序）登录：mock openid 基于 code
    # 用固定前缀保证幂等（同一台测试机多次运行指向同一个用户）
    local wx_code="${2:-automation_fixed}"
    resp=$(curl -s -X POST "${BASE_URL}/api/wx/login" \
      -H "Content-Type: application/json" \
      -d "{\"code\":\"${wx_code}\",\"nickname\":\"automation_bot\",\"avatar\":\"\"}")
    local code
    code=$(echo "$resp" | jq -r '.code // 0')
    if [ "$code" != "200" ]; then
      echo -e "${C_RED}[login_as user] 登录失败: $resp${C_RESET}" >&2
      return 1
    fi
    echo "$resp" | jq -r '.data.token'
  fi
}

# login_as_user_id [code] → 返回用户 id（伴随登录，用于校验后续数据归属）
login_as_user_id() {
  local wx_code="${1:-automation_fixed}"
  curl -s -X POST "${BASE_URL}/api/wx/login" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"${wx_code}\",\"nickname\":\"automation_bot\",\"avatar\":\"\"}" \
    | jq -r '.data.userInfo.id // empty'
}

# ---------- 通用 API 调用 ----------
# api_call METHOD PATH TOKEN [BODY_JSON] [extra-curl-args...]
api_call() {
  local method="$1"
  local ppath="$2"
  local token="${3:-}"
  local body="${4:-}"
  # 只 shift 实际传入的数量（<4 时也不报错，剩余 $@ 作为 curl extra args）
  local n=$#
  [ "$n" -gt 4 ] && n=4
  shift "$n"

  local args=(-s -X "$method" "${BASE_URL}${ppath}" -H "Content-Type: application/json")
  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer ${token}")
  fi
  if [ -n "$body" ]; then
    args+=(-d "$body")
  fi
  curl "${args[@]}" "$@"
}

# num_eq a b → 浮点数相等（999 == 999.00）
num_eq() {
  awk -v a="$1" -v b="$2" 'BEGIN{exit !(a+0 == b+0)}'
}

# ---------- 断言 ----------
_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "  ${C_GREEN}✓${C_RESET} $1"
}
_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAILED_ASSERTIONS+=("$1")
  echo -e "  ${C_RED}✗${C_RESET} $1"
  if [ -n "${2:-}" ]; then
    echo -e "      ${C_YELLOW}响应:${C_RESET} $2"
  fi
}

# assert_ok "标签" "$resp"  → 校验 .code == 200
assert_ok() {
  local label="$1"
  local resp="$2"
  local code
  code=$(echo "$resp" | jq -r '.code // "null"' 2>/dev/null || echo "parse_error")
  if [ "$code" = "200" ]; then
    _pass "$label"
    return 0
  else
    _fail "$label" "$resp"
    return 1
  fi
}

# assert_field "标签" "$resp" ".jq.path" "期望值"
assert_field() {
  local label="$1"
  local resp="$2"
  local jq_path="$3"
  local expected="$4"
  local actual
  actual=$(echo "$resp" | jq -r "$jq_path" 2>/dev/null || echo "parse_error")
  if [ "$actual" = "$expected" ]; then
    _pass "$label (${jq_path} = ${expected})"
    return 0
  else
    _fail "$label 期望 ${expected} 实际 ${actual}" "$resp"
    return 1
  fi
}

# assert_gt_zero "标签" "$resp" ".jq.path"
assert_gt_zero() {
  local label="$1"
  local resp="$2"
  local jq_path="$3"
  local actual
  actual=$(echo "$resp" | jq -r "$jq_path // 0" 2>/dev/null || echo "0")
  if [ "$actual" != "null" ] && [ -n "$actual" ] && [ "$(echo "$actual > 0" | bc 2>/dev/null || echo 0)" = "1" ]; then
    _pass "$label (${jq_path} = ${actual} > 0)"
    return 0
  fi
  # 退化：整数直接比较（bc 可能不在）
  if [[ "$actual" =~ ^[0-9]+$ ]] && [ "$actual" -gt 0 ]; then
    _pass "$label (${jq_path} = ${actual} > 0)"
    return 0
  fi
  _fail "$label 期望 ${jq_path} > 0 实际 ${actual}" "$resp"
  return 1
}

# assert_http "标签" 期望状态码 URL [extra-curl-args]
assert_http() {
  local label="$1"
  local expected="$2"
  local url="$3"
  shift 3 || true
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" "$@")
  if [ "$actual" = "$expected" ]; then
    _pass "$label [${url} → ${actual}]"
    return 0
  else
    _fail "$label [${url}] 期望 ${expected} 实际 ${actual}"
    return 1
  fi
}

# ---------- 汇总 ----------
print_summary() {
  echo ""
  echo -e "${C_BOLD}------- 小结 -------${C_RESET}"
  echo -e "  通过: ${C_GREEN}${PASS_COUNT}${C_RESET}"
  echo -e "  失败: ${C_RED}${FAIL_COUNT}${C_RESET}"
  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${C_RED}失败项:${C_RESET}"
    for f in "${FAILED_ASSERTIONS[@]}"; do
      echo -e "  - $f"
    done
    exit 1
  fi
  exit 0
}

# 所有脚本启动时立即检查依赖
require curl jq
