#!/bin/bash
# ============================================
# SSL 证书安装：把从阿里云下载的 Nginx 版证书
# 部署到 /etc/nginx/ssl/，然后重新生成 Nginx 配置（HTTP→HTTPS）
#
# 前置条件：你已在阿里云 SSL 证书控制台申请 yangmaogeng.top 免费证书，
# 并下载 "Nginx 版"，得到两个文件：
#   - yangmaogeng.top.pem (或 xxxx.pem / fullchain.pem)
#   - yangmaogeng.top.key (或 xxxx.key / private.key)
#
# 使用方式：
#   方式 A：把两个文件 scp 到服务器任意位置，然后运行：
#     bash setup-ssl.sh /path/to/yangmaogeng.top.pem /path/to/yangmaogeng.top.key
#
#   方式 B：把两个文件直接放到 /root/，然后运行：
#     bash setup-ssl.sh
#     （脚本会自动在 /root/ 下查找 *.pem / *.key）
# ============================================
set -e

SSL_DIR="/etc/nginx/ssl"
SSL_CERT="$SSL_DIR/yangmaogeng.top.pem"
SSL_KEY="$SSL_DIR/yangmaogeng.top.key"

SRC_CERT="$1"
SRC_KEY="$2"

if [ -z "$SRC_CERT" ] || [ -z "$SRC_KEY" ]; then
    echo "未提供证书参数，尝试从 /root/ 自动查找..."
    SRC_CERT=$(ls /root/*.pem 2>/dev/null | head -n 1)
    SRC_KEY=$(ls /root/*.key 2>/dev/null | head -n 1)
fi

if [ ! -f "$SRC_CERT" ] || [ ! -f "$SRC_KEY" ]; then
    echo "[错误] 找不到证书文件"
    echo ""
    echo "  用法："
    echo "    bash setup-ssl.sh /path/to/cert.pem /path/to/cert.key"
    echo ""
    echo "  或者把 pem/key 放到 /root/ 后直接运行："
    echo "    bash setup-ssl.sh"
    exit 1
fi

echo "证书来源："
echo "  证书: $SRC_CERT"
echo "  私钥: $SRC_KEY"

echo ""
echo "[1/3] 拷贝证书到 $SSL_DIR ..."
mkdir -p "$SSL_DIR"
cp "$SRC_CERT" "$SSL_CERT"
cp "$SRC_KEY"  "$SSL_KEY"
chmod 600 "$SSL_KEY"
chmod 644 "$SSL_CERT"
echo "  完成"

echo ""
echo "[2/3] 校验证书..."
openssl x509 -in "$SSL_CERT" -noout -subject -dates
openssl x509 -in "$SSL_CERT" -noout -modulus | openssl md5 > /tmp/cert.md5
openssl rsa  -in "$SSL_KEY"  -noout -modulus | openssl md5 > /tmp/key.md5
if ! diff -q /tmp/cert.md5 /tmp/key.md5 > /dev/null; then
    echo "  [错误] 证书和私钥不匹配，请检查文件是否对应"
    exit 1
fi
echo "  证书/私钥匹配 OK"

echo ""
echo "[3/3] 重新生成 Nginx HTTPS 配置..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/setup-nginx.sh"

echo ""
echo "=============================="
echo " HTTPS 部署完成"
echo "=============================="
echo ""
echo "  验证命令："
echo "    curl -I https://yangmaogeng.top/"
echo "    curl https://yangmaogeng.top/api/ships | head -c 200"
echo ""
echo "  防火墙检查（如在阿里云 ECS，安全组必须放行 443）："
echo "    控制台 → ECS → 安全组 → 入方向 → 添加规则 → TCP:443 放行"
echo ""
