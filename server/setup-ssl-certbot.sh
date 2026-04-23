#!/bin/bash
# ============================================
# SSL 证书自动申请（Let's Encrypt + certbot）
# 全程命令行，无需阿里云控制台
#
# 前置条件：
#   1) 域名 yangmaogeng.top 已解析到本机公网 IP（ICP 备案通过即说明解析 OK）
#   2) ECS 安全组已放行 80 端口（HTTP-01 challenge 需要）和 443 端口
#   3) 已运行过 bash setup-nginx.sh（HTTP 站点已起来）
#
# 行为：
#   - 安装 certbot
#   - 对 yangmaogeng.top 申请证书（webroot 模式，不中断 Nginx）
#   - 证书放到 /etc/nginx/ssl/yangmaogeng.top.{pem,key}（软链）
#   - 调用 setup-nginx.sh 切 HTTPS 配置
#   - 配置 certbot 自动续期（systemd timer 原生支持，续期后钩子重载 Nginx）
#
# 续期逻辑：
#   certbot 默认装的 systemd timer 每天跑两次 `certbot renew`；
#   证书剩余 < 30 天才真续，续成功后触发 deploy-hook 重载 Nginx。
# ============================================
set -e

DOMAIN="yangmaogeng.top"
EMAIL="admin@${DOMAIN}"   # Let's Encrypt 到期提醒邮箱，按需改
WEBROOT="/opt/yaomaogeng/admin/dist"
SSL_DIR="/etc/nginx/ssl"
SSL_CERT="$SSL_DIR/yangmaogeng.top.pem"
SSL_KEY="$SSL_DIR/yangmaogeng.top.key"

# ---- 1. 安装 certbot ----
echo "[1/5] 安装 certbot..."
if command -v certbot &> /dev/null; then
    echo "  certbot 已安装: $(certbot --version)"
else
    if command -v dnf &> /dev/null; then
        dnf install -y certbot
    elif command -v yum &> /dev/null; then
        yum install -y epel-release && yum install -y certbot
    elif command -v apt &> /dev/null; then
        apt update && apt install -y certbot
    else
        echo "  [错误] 未识别的包管理器"
        exit 1
    fi
fi

# ---- 2. 预检：Nginx 已跑，域名能从外网 80 访问 ----
echo ""
echo "[2/5] 预检 HTTP 可达..."
if ! systemctl is-active nginx &> /dev/null; then
    echo "  [错误] Nginx 未运行，请先跑 bash setup-nginx.sh"
    exit 1
fi
# 让 nginx 能对 /.well-known/acme-challenge/ 返回 webroot 静态文件
# 当前 setup-nginx.sh 的 HTTP 模式下 root 就是 $WEBROOT，webroot 模式能直接跑
if [ ! -d "$WEBROOT" ]; then
    echo "  [错误] webroot 不存在: $WEBROOT"
    echo "         请确认 admin/dist/ 已 pull 到服务器"
    exit 1
fi
mkdir -p "$WEBROOT/.well-known/acme-challenge"

# ---- 3. 申请证书（webroot 模式，Nginx 不需停） ----
echo ""
echo "[3/5] 向 Let's Encrypt 申请证书（域名 $DOMAIN）..."
certbot certonly \
    --webroot -w "$WEBROOT" \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos --no-eff-email \
    --non-interactive \
    --deploy-hook "systemctl reload nginx"

LE_LIVE="/etc/letsencrypt/live/$DOMAIN"
if [ ! -f "$LE_LIVE/fullchain.pem" ]; then
    echo "  [错误] 证书申请失败，检查："
    echo "    - 域名 $DOMAIN 是否解析到本机公网 IP (dig $DOMAIN)"
    echo "    - 安全组 80 端口是否放行"
    echo "    - /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi
echo "  证书签发成功"

# ---- 4. 软链到 /etc/nginx/ssl/ 统一路径 ----
echo ""
echo "[4/5] 配置证书软链..."
mkdir -p "$SSL_DIR"
ln -sf "$LE_LIVE/fullchain.pem" "$SSL_CERT"
ln -sf "$LE_LIVE/privkey.pem"   "$SSL_KEY"
ls -la "$SSL_CERT" "$SSL_KEY"
echo "  软链就绪（续期后 certbot 会更新软链目标，无需手工操作）"

# ---- 5. 切 Nginx HTTPS ----
echo ""
echo "[5/5] 切 Nginx HTTPS 配置..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/setup-nginx.sh"

# ---- 确认 systemd timer 已激活（现代 certbot 默认自带） ----
echo ""
echo "检查自动续期定时器..."
if systemctl list-timers --all 2>/dev/null | grep -q certbot; then
    systemctl enable --now certbot.timer 2>/dev/null || true
    echo "  certbot.timer 已激活：$(systemctl is-active certbot.timer)"
    systemctl list-timers certbot.timer --no-pager | head -n 5
else
    echo "  未检测到 certbot.timer，手动配置 cron..."
    (crontab -l 2>/dev/null | grep -v 'certbot renew'; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    echo "  已写入 crontab：每天 03:00 检查续期"
fi

echo ""
echo "=============================="
echo " HTTPS 部署完成 (Let's Encrypt)"
echo "=============================="
echo ""
echo "  验证："
echo "    curl -I https://$DOMAIN/"
echo "    curl https://$DOMAIN/api/ships | head -c 200"
echo ""
echo "  手动测试续期（不会真续，只试跑）："
echo "    certbot renew --dry-run"
echo ""
