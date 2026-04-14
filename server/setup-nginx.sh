#!/bin/bash
# ============================================
# Nginx 反向代理配置
# ============================================
set -e

echo "安装 Nginx..."
if command -v dnf &> /dev/null; then
    dnf install -y nginx
elif command -v apt &> /dev/null; then
    apt install -y nginx
fi

echo "配置反向代理..."
cat > /etc/nginx/conf.d/yaomaogeng.conf << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
EOF

nginx -t && echo "Nginx 配置检查通过"
systemctl enable nginx
systemctl restart nginx

echo ""
echo "Nginx 配置完成！"
echo "现在可以通过 http://47.114.89.50/api/ships 访问 API"
echo ""
echo "[提示] 域名备案完成后，修改 server_name 为你的域名"
