#!/bin/bash
# ============================================
# 羊毛梗船舶服务中心 - 一键部署脚本
# 服务器: 阿里云 ECS
# 代码来源: GitHub
# ============================================
set -e

REPO_URL="https://github.com/fuckingtheworlg/yangmaogeng.git"
REPO_MIRRORS=(
  "https://ghfast.top/https://github.com/fuckingtheworlg/yangmaogeng.git"
  "https://mirror.ghproxy.com/https://github.com/fuckingtheworlg/yangmaogeng.git"
  "https://gh-proxy.com/https://github.com/fuckingtheworlg/yangmaogeng.git"
)
APP_DIR="/opt/yaomaogeng"
SERVER_DIR="$APP_DIR/server"

echo "=============================="
echo " 羊毛梗船舶服务中心 部署脚本"
echo "=============================="

# ---- 1. 检测系统 ----
echo ""
echo "[1/8] 检测系统环境..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "  系统: $PRETTY_NAME"
fi

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

# ---- 2. 安装 Git ----
echo ""
echo "[2/8] 检查 Git..."
if ! command -v git &> /dev/null; then
    echo "  安装 Git..."
    $PKG install -y git
fi
echo "  Git: $(git --version)"

# ---- 3. 从 GitHub 克隆代码 ----
echo ""
echo "[3/8] 从 GitHub 获取代码..."
if [ -d "$APP_DIR/.git" ]; then
    echo "  代码已存在，执行 git pull..."
    cd "$APP_DIR"
    git pull || echo "  [提示] pull 失败，尝试镜像..."
else
    echo "  克隆仓库..."
    CLONED=false

    git clone "$REPO_URL" "$APP_DIR" 2>/dev/null && CLONED=true

    if [ "$CLONED" = false ]; then
        echo "  直连 GitHub 失败，尝试国内镜像..."
        for MIRROR in "${REPO_MIRRORS[@]}"; do
            echo "  尝试: $MIRROR"
            git clone "$MIRROR" "$APP_DIR" 2>/dev/null && CLONED=true && break
        done
    fi

    if [ "$CLONED" = false ]; then
        echo "  [错误] 所有镜像均失败，请手动克隆"
        echo "  手动执行: git clone $REPO_URL $APP_DIR"
        exit 1
    fi
    echo "  代码克隆成功"
fi

cd "$SERVER_DIR"

# ---- 4. 安装 Node.js ----
echo ""
echo "[4/8] 安装 Node.js 20..."
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

# ---- 5. 安装 MySQL ----
echo ""
echo "[5/8] 安装 MySQL..."
if command -v mysql &> /dev/null; then
    echo "  MySQL 已安装: $(mysql --version)"
else
    if [ "$PKG" = "apt" ]; then
        apt update && apt install -y mysql-server
    else
        $PKG install -y mysql-server
    fi
    systemctl enable mysqld 2>/dev/null || systemctl enable mysql 2>/dev/null
    systemctl start mysqld 2>/dev/null || systemctl start mysql 2>/dev/null
    echo "  MySQL 安装并启动完成"
fi

systemctl start mysqld 2>/dev/null || systemctl start mysql 2>/dev/null || true
echo "  MySQL 状态: $(systemctl is-active mysqld 2>/dev/null || systemctl is-active mysql 2>/dev/null || echo '未知')"

# ---- 6. 初始化数据库 ----
echo ""
echo "[6/8] 初始化数据库..."
echo "  请输入 MySQL root 密码（新安装可能为空，直接回车）:"
read -s MYSQL_ROOT_PWD

if [ -z "$MYSQL_ROOT_PWD" ]; then
    mysql < "$SERVER_DIR/config/init.sql" 2>/dev/null && echo "  数据库初始化成功" || echo "  [提示] 数据库可能已存在，跳过"
else
    mysql -u root -p"$MYSQL_ROOT_PWD" < "$SERVER_DIR/config/init.sql" 2>/dev/null && echo "  数据库初始化成功" || echo "  [提示] 数据库可能已存在，跳过"
fi

# ---- 7. 安装依赖 + 配置环境 ----
echo ""
echo "[7/8] 安装项目依赖..."
cd "$SERVER_DIR"
npm install --production
echo "  依赖安装完成"

echo ""
echo "  配置环境变量..."
if [ ! -f .env ]; then
    DB_PWD="${MYSQL_ROOT_PWD}"
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

mkdir -p uploads

# ---- 8. 配置 Systemd 服务 ----
echo ""
echo "[8/8] 配置系统服务..."
NODE_PATH=$(which node)
cat > /etc/systemd/system/yaomaogeng.service << EOF
[Unit]
Description=YaoMaoGeng Ship Service Backend
After=network.target mysqld.service

[Service]
Type=simple
User=root
WorkingDirectory=$SERVER_DIR
ExecStart=$NODE_PATH app.js
Environment=NODE_ENV=production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable yaomaogeng
systemctl restart yaomaogeng

sleep 2

echo ""
echo "=============================="
echo " 部署完成！"
echo "=============================="
echo ""
echo "  服务状态: $(systemctl is-active yaomaogeng)"
echo "  本地测试: curl http://127.0.0.1:3000/api/ships"
echo ""
echo "  管理命令:"
echo "    查看状态:  systemctl status yaomaogeng"
echo "    查看日志:  journalctl -u yaomaogeng -f"
echo "    重启服务:  systemctl restart yaomaogeng"
echo ""
echo "  下一步: 运行 bash $SERVER_DIR/setup-nginx.sh 配置 Nginx"
