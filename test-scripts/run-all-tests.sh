#!/usr/bin/env bash
# run-all-tests.sh — 按序跑 0X_*.sh 和 99_*.sh
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色
if [ -t 1 ]; then
  C_RESET='\033[0m'; C_RED='\033[31m'; C_GREEN='\033[32m'
  C_BLUE='\033[34m'; C_BOLD='\033[1m'
else
  C_RESET=''; C_RED=''; C_GREEN=''; C_BLUE=''; C_BOLD=''
fi

export BASE_URL="${BASE_URL:-http://47.114.89.50}"

echo -e "${C_BOLD}${C_BLUE}#### 羊毛梗 API 回归测试套件 ####${C_RESET}"
echo -e "  BASE_URL = ${BASE_URL}"
echo ""

TOTAL=0
FAILED=0
FAILED_SCRIPTS=()

for script in $(ls 0*_*.sh 99_*.sh 2>/dev/null | sort); do
  TOTAL=$((TOTAL + 1))
  echo -e "${C_BOLD}▶ 运行 ${script}${C_RESET}"
  if bash "./${script}"; then
    echo -e "${C_GREEN}✅ ${script} 通过${C_RESET}"
  else
    echo -e "${C_RED}❌ ${script} 失败${C_RESET}"
    FAILED=$((FAILED + 1))
    FAILED_SCRIPTS+=("$script")
  fi
  echo ""
done

echo -e "${C_BOLD}${C_BLUE}#### 总汇 ####${C_RESET}"
echo -e "  套件总数: ${TOTAL}"
echo -e "  通过: ${C_GREEN}$((TOTAL - FAILED))${C_RESET}"
echo -e "  失败: ${C_RED}${FAILED}${C_RESET}"
if [ "$FAILED" -gt 0 ]; then
  echo -e "${C_RED}失败脚本:${C_RESET}"
  for s in "${FAILED_SCRIPTS[@]}"; do
    echo "  - $s"
  done
  exit 1
fi
exit 0
