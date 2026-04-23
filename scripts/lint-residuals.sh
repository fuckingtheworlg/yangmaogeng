#!/usr/bin/env bash
# ============================================
# 残留/硬编码扫描
# 涉及后端地址、mock 数据、临时常量的修改后必跑一遍。
#
# 用法：
#   bash scripts/lint-residuals.sh
#   bash scripts/lint-residuals.sh --fix   # 只打印，不对应修复策略（未实现，占位）
#
# 退出码：
#   0 - 无残留
#   1 - 有残留（CI/pre-commit 应拒绝）
# ============================================
set -u

RED='\033[31m'; YELLOW='\033[33m'; GREEN='\033[32m'; BOLD='\033[1m'; RESET='\033[0m'
FAIL=0

cd "$(git rev-parse --show-toplevel 2>/dev/null || dirname "$0")/.."

check() {
    local label="$1"
    local pattern="$2"
    shift 2
    local found
    found=$(rg -l "$pattern" "$@" 2>/dev/null)
    if [ -n "$found" ]; then
        echo -e "${RED}✗ $label${RESET}"
        echo "$found" | sed 's/^/    /'
        FAIL=1
    else
        echo -e "${GREEN}✓ $label${RESET}"
    fi
}

echo -e "${BOLD}扫描生产代码残留...${RESET}"
echo ""

# 1. 硬编码的旧 IP（迁移域名后任何地方都不应再出现）
check "硬编码 IP 47.114.89.50（应全部改为域名或相对路径）" \
    '47\.114\.89\.50' \
    --glob '!scripts/**' --glob '!docs/**' --glob '!node_modules' --glob '!admin/dist/**'

# 2. localhost:3000 不应出现在生产端代码（开发覆盖走环境变量/默认值）
check "localhost:3000 硬编码（仅允许出现在 default 值或测试脚本）" \
    'http://localhost:3000' \
    --glob '!scripts/**' --glob '!docs/**' --glob '!test-scripts/**' \
    --glob '!node_modules' --glob '!admin/dist/**' \
    --glob '!server/**'

# 3. mock 残留（规则第 1 条：Mock-to-API 清零检查）
check "前端 mock 标记残留（确认是否已替换为真实 API）" \
    '\b(mockData|mock_data|MOCK|使用 ?mock)\b' \
    --glob '*.{vue,js,ts,wxml,wxss}' \
    --glob '!node_modules' --glob '!admin/dist/**'

# 4. 空 catch（规则第 4.4 条：错误必须可见）
check "空 catch 块（错误被吞）" \
    'catch\s*\([^)]*\)\s*\{\s*\}' \
    --glob '*.{vue,js,ts}' \
    --glob '!node_modules' --glob '!admin/dist/**'

# 5. 常见调试残留
check "console.log 残留（生产代码建议移除；测试/脚本不检查）" \
    'console\.log\(' \
    --glob '*.{vue,js,ts}' \
    --glob 'admin/src/**' --glob 'miniprogram/**' \
    --glob '!admin/dist/**' || true   # 这条只告警，不影响退出码

echo ""
if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}所有残留检查通过${RESET}"
    exit 0
else
    echo -e "${RED}${BOLD}发现残留，请逐条处理后重跑${RESET}"
    exit 1
fi
