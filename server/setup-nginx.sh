#!/bin/bash
# ============================================
# Nginx 配置：管理后台前端 + API 反向代理
# 域名：yangmaogeng.top（已备案 皖ICP备2026010339号-1）
#
# 行为说明（幂等）：
#   - 若 /etc/nginx/ssl/yangmaogeng.top.pem + .key 存在 → 配置 HTTPS，
#     HTTP(80) 强制 301 跳 HTTPS(443)
#   - 否则 → 仅配置 HTTP(80)，仍绑定域名但不启用 SSL（过渡状态）
#
# 首次部署流程：
#   1) bash setup-nginx.sh          # HTTP 先跑起来
#   2) bash setup-ssl.sh            # 上传阿里云证书后，切 HTTPS
# ============================================
set -e

SERVER_NAME="yangmaogeng.top www.yangmaogeng.top"
SSL_CERT="/etc/nginx/ssl/yangmaogeng.top.pem"
SSL_KEY="/etc/nginx/ssl/yangmaogeng.top.key"

echo "安装 Nginx..."
if command -v dnf &> /dev/null; then
    dnf install -y nginx
elif command -v yum &> /dev/null; then
    yum install -y nginx
elif command -v apt &> /dev/null; then
    apt install -y nginx
fi

echo "替换 Nginx 主配置（清除默认 server 冲突）..."
cat > /etc/nginx/nginx.conf << 'MAINCONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 20m;
    include /etc/nginx/conf.d/*.conf;
}
MAINCONF

HAS_SSL=false
if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    HAS_SSL=true
    echo "检测到 SSL 证书，将启用 HTTPS"
else
    echo "未检测到 SSL 证书（$SSL_CERT / $SSL_KEY），仅配置 HTTP"
fi

echo "配置站点..."
if [ "$HAS_SSL" = true ]; then
    cat > /etc/nginx/conf.d/yaomaogeng.conf << EOF
# HTTP → HTTPS 强制跳转
server {
    listen 80;
    server_name $SERVER_NAME;
    return 301 https://\$host\$request_uri;
}

# HTTPS 主站
server {
    listen 443 ssl http2;
    server_name $SERVER_NAME;

    ssl_certificate     $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1h;

    root /opt/yaomaogeng/admin/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }
}
EOF
else
    cat > /etc/nginx/conf.d/yaomaogeng.conf << EOF
server {
    listen 80;
    server_name $SERVER_NAME _;

    root /opt/yaomaogeng/admin/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }
}
EOF
fi

nginx -t && echo "Nginx 配置检查通过"
systemctl enable nginx
systemctl restart nginx

echo ""
echo "配置完成！"
if [ "$HAS_SSL" = true ]; then
    echo "  管理后台: https://yangmaogeng.top/"
    echo "  API 接口: https://yangmaogeng.top/api/ships"
else
    echo "  管理后台: http://yangmaogeng.top/"
    echo "  API 接口: http://yangmaogeng.top/api/ships"
    echo ""
    echo "  [注意] 小程序要求 HTTPS，请按下一步配置 SSL:"
    echo "         bash $(dirname "$0")/setup-ssl.sh"
fi
echo ""
echo "  管理员账号: admin / admin123"
