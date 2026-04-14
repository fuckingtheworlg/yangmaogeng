#!/bin/bash
# ============================================
# 羊毛梗船舶服务中心 - 一键部署脚本
# 服务器: 阿里云 ECS (CentOS/Alibaba Linux)
# ============================================
set -e

echo "=============================="
echo " 羊毛梗船舶服务中心 部署脚本"
echo "=============================="

# ---- 1. 检测系统 ----
echo ""
echo "[1/7] 检测系统环境..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "  系统: $PRETTY_NAME"
fi

# 判断包管理器
if command -v dnf &> /dev/null; then
    PKG="dnf"
elif command -v yum &> /dev/null; then
    PKG="yum"
elif command -v apt &> /dev/null; then
    PKG="apt"
else
    echo "  [错误] 无法识别包管理器"
    exit 1
fi
echo "  包管理器: $PKG"

# ---- 2. 安装 Node.js ----
echo ""
echo "[2/7] 安装 Node.js 20..."
if command -v node &> /dev/null; then
    NODE_VER=$(node -v)
    echo "  Node.js 已安装: $NODE_VER"
else
    if [ "$PKG" = "apt" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        $PKG install -y nodejs
    fi
    echo "  Node.js 安装完成: $(node -v)"
fi

# ---- 3. 安装 MySQL ----
echo ""
echo "[3/7] 安装 MySQL..."
if command -v mysql &> /dev/null; then
    echo "  MySQL 已安装: $(mysql --version)"
else
    if [ "$PKG" = "apt" ]; then
        apt update
        apt install -y mysql-server
    else
        $PKG install -y mysql-server
    fi
    systemctl enable mysqld
    systemctl start mysqld
    echo "  MySQL 安装并启动完成"
fi

# 确保 MySQL 正在运行
systemctl start mysqld 2>/dev/null || systemctl start mysql 2>/dev/null || true
echo "  MySQL 状态: $(systemctl is-active mysqld 2>/dev/null || systemctl is-active mysql 2>/dev/null || echo '未知')"

# ---- 4. 初始化数据库 ----
echo ""
echo "[4/7] 初始化数据库..."
echo "  请输入 MySQL root 密码（新安装可能为空，直接回车）:"
read -s MYSQL_ROOT_PWD

if [ -z "$MYSQL_ROOT_PWD" ]; then
    mysql < /opt/yaomaogeng-server/config/init.sql 2>/dev/null && echo "  数据库初始化成功" || echo "  [提示] 数据库可能已存在，跳过"
else
    mysql -u root -p"$MYSQL_ROOT_PWD" < /opt/yaomaogeng-server/config/init.sql 2>/dev/null && echo "  数据库初始化成功" || echo "  [提示] 数据库可能已存在，跳过"
fi

# ---- 5. 安装项目依赖 ----
echo ""
echo "[5/7] 安装项目依赖..."
cd /opt/yaomaogeng-server
npm install --production
echo "  依赖安装完成"

# ---- 6. 配置环境变量 ----
echo ""
echo "[6/7] 配置环境变量..."
if [ ! -f .env ] || grep -q "DB_PASSWORD=root" .env; then
    echo "  请输入 MySQL root 密码（用于 .env 配置）:"
    read -s DB_PWD
    cat > .env << EOF
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=$DB_PWD
DB_NAME=yaomaogeng
JWT_SECRET=ymg_ship_$(openssl rand -hex 16)
WX_APPID=wx0000000000000000
WX_SECRET=your_wechat_secret
EOF
    echo "  .env 已生成"
else
    echo "  .env 已存在，跳过"
fi

# ---- 7. 配置 Systemd 服务 ----
echo ""
echo "[7/7] 配置系统服务..."
cat > /etc/systemd/system/yaomaogeng.service << 'EOF'
[Unit]
Description=YaoMaoGeng Ship Service Backend
After=network.target mysqld.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/yaomaogeng-server
ExecStart=/usr/bin/node app.js
Environment=NODE_ENV=production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable yaomaogeng
systemctl restart yaomaogeng

echo ""
echo "=============================="
echo " 部署完成！"
echo "=============================="
echo ""
echo "  服务状态: $(systemctl is-active yaomaogeng)"
echo "  本地测试: curl http://127.0.0.1:3000/api/ships"
echo "  外网访问: http://47.114.89.50:3000/api/ships"
echo ""
echo "  管理命令:"
echo "    查看状态: systemctl status yaomaogeng"
echo "    查看日志: journalctl -u yaomaogeng -f"
echo "    重启服务: systemctl restart yaomaogeng"
echo ""
echo "  [注意] 请在阿里云安全组中开放 3000 端口（或配置 Nginx 用 80 端口代理）"
