#!/bin/bash
# ============================================
# Nginx 配置：管理后台前端 + API 反向代理
# ============================================
set -e

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

echo "配置站点..."
cat > /etc/nginx/conf.d/yaomaogeng.conf << 'EOF'
server {
    listen 80;
    server_name _;

    # 管理后台前端（Vue3 SPA）
    root /opt/yaomaogeng/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理（禁用缓存）
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
    }

    # 上传文件静态访问
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
EOF

nginx -t && echo "Nginx 配置检查通过"
systemctl enable nginx
systemctl restart nginx

PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "配置完成！"
echo "  管理后台: http://$PUBLIC_IP/"
echo "  API 接口: http://$PUBLIC_IP/api/ships"
echo ""
echo "  管理员账号: admin / admin123"
