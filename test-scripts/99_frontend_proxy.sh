#!/usr/bin/env bash
# 99_frontend_proxy.sh — admin dev server 代理检查（Part B 防护）
#
# 检测到 admin dev server 在运行时才会执行，否则 skip。
# 目的：防止"上传成功但图片不显示"这类 vite proxy 漏配的 bug 再次出现。
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

section "99 admin dev server 代理检查"

DEV_PORT="${ADMIN_DEV_PORT:-5173}"
DEV_URL="http://localhost:${DEV_PORT}"

# 检测 dev server 是否在跑（200/304 才认为存活）
DEV_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "${DEV_URL}/" 2>/dev/null)
[ -z "$DEV_CODE" ] && DEV_CODE="000"
if [ "$DEV_CODE" != "200" ] && [ "$DEV_CODE" != "304" ]; then
  echo "  admin dev server 未运行 (localhost:${DEV_PORT} → ${DEV_CODE})，跳过此套件"
  echo "  如需本地测试代理：cd admin && npm run dev"
  exit 0
fi

check_backend

# 1. 代理 /api
FE_API=$(curl -s -o /dev/null -w "%{http_code}" "${DEV_URL}/api/ships")
if [ "$FE_API" = "200" ]; then
  _pass "/api 代理正常 (${DEV_URL}/api/ships → 200)"
else
  _fail "/api 代理缺失/异常 (${FE_API}) — 请检查 admin/vite.config.js 的 server.proxy"
fi

# 2. 代理 /uploads（上传一个文件，通过 dev server 拉回来）
TMP_PNG="/tmp/proxy_check_$$.png"
base64 -d > "$TMP_PNG" <<'B64'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=
B64
RESP=$(curl -s -X POST "${BASE_URL}/api/upload" -F "file=@${TMP_PNG}")
URL_PATH=$(echo "$RESP" | jq -r '.data.url // empty')
rm -f "$TMP_PNG"

if [ -z "$URL_PATH" ]; then
  _fail "无法上传测试图片，无法验证 /uploads 代理"
  print_summary
fi

FE_UP=$(curl -s -o /dev/null -w "%{http_code}" "${DEV_URL}${URL_PATH}")
if [ "$FE_UP" = "200" ]; then
  _pass "/uploads 代理正常 (${DEV_URL}${URL_PATH} → 200)"
else
  _fail "/uploads 代理缺失！(${FE_UP}) — 这就是 Part B 的典型 bug，请在 admin/vite.config.js 的 server.proxy 添加 /uploads"
fi

# 3. Content-Type 校验（即使 200 也可能被 SPA fallback 成 html）
CT=$(curl -sI "${DEV_URL}${URL_PATH}" | awk -F': ' 'tolower($1)=="content-type"{print $2}' | tr -d '\r\n ')
if [[ "$CT" == image/* ]]; then
  _pass "前端侧 Content-Type=${CT} 为图片"
else
  _fail "前端侧 Content-Type=${CT} 不是图片（SPA fallback 漏洞）"
fi

print_summary
