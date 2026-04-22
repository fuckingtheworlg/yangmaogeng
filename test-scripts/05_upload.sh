#!/usr/bin/env bash
# 05_upload.sh — 文件上传 + /uploads 静态回链校验（同时是 Part B 的最小验证）
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

check_backend
section "05 文件上传 & 静态资源回链"

# 生成一张最小合法 PNG（8x8 灰图）。不依赖外部图形库。
TMP_PNG="/tmp/auto_test_$$.png"
# base64 是一张 1x1 透明 png
base64 -d > "$TMP_PNG" <<'B64'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=
B64

if [ ! -s "$TMP_PNG" ]; then
  _fail "临时 PNG 生成失败"
  print_summary
fi

# 1. 上传（upload 路由不鉴权，任何请求都可以上传，这是现有设计）
RESP=$(curl -s -X POST "${BASE_URL}/api/upload" -F "file=@${TMP_PNG}")
assert_ok "上传 PNG" "$RESP"
URL_PATH=$(echo "$RESP" | jq -r '.data.url')
if [ -z "$URL_PATH" ] || [ "$URL_PATH" = "null" ]; then
  _fail "未返回 url"
  rm -f "$TMP_PNG"
  print_summary
fi
_pass "返回相对 URL: ${URL_PATH}"

# 2. 非图片类型应被拒（按 fileFilter 限制 .txt 被拒）
TMP_TXT="/tmp/auto_test_$$.txt"
echo "not an image" > "$TMP_TXT"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/upload" -F "file=@${TMP_TXT}")
# multer 抛错后 express 统一处理为 500，按 app.js 现状是 500；若改过可能是 400。两者都算拒绝
if [ "$CODE" = "500" ] || [ "$CODE" = "400" ]; then
  _pass "非法格式被拒 (HTTP ${CODE})"
else
  _fail "非法格式未被拒 (HTTP ${CODE})"
fi
rm -f "$TMP_TXT"

# 3. 后端静态服务：直接请求 /uploads/<filename>，应 200
BACKEND_URL="${BASE_URL}${URL_PATH}"
assert_http "后端直接访问上传文件" "200" "$BACKEND_URL"

# 4. Content-Type 校验
CT=$(curl -sI "$BACKEND_URL" | awk -F': ' 'tolower($1)=="content-type"{print $2}' | tr -d '\r\n ')
if [[ "$CT" == image/* ]]; then
  _pass "Content-Type=${CT} 为图片类型"
else
  _fail "Content-Type=${CT} 不是图片类型（可能被 SPA fallback 成 html，典型 Part B bug）"
fi

# 5. Part B 轻量版：若本地 admin dev server 在跑（5173），验证代理
DEV_PORT="${ADMIN_DEV_PORT:-5173}"
if curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://localhost:${DEV_PORT}/" | grep -q "200"; then
  echo "  检测到 admin dev server 在 localhost:${DEV_PORT}，进行代理检查"
  FE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${DEV_PORT}${URL_PATH}")
  if [ "$FE_CODE" = "200" ]; then
    _pass "admin dev server 代理 /uploads → 200"
  else
    _fail "admin dev server 未正确代理 /uploads（HTTP ${FE_CODE}，请检查 admin/vite.config.js 的 server.proxy）"
  fi
else
  echo "  admin dev server 未运行，跳过前端代理检查（设置 ADMIN_DEV_PORT 可覆盖）"
fi

rm -f "$TMP_PNG"
print_summary
