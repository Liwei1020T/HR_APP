#!/bin/bash

# ========================================
# HR App Docker 一键部署脚本
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_success "Docker 环境检查通过"
}

# 检查并创建 .env 文件
setup_env() {
    if [ ! -f .env ]; then
        if [ -f .env.docker.example ]; then
            cp .env.docker.example .env
            print_warning "已从 .env.docker.example 创建 .env 文件"
            print_warning "请编辑 .env 文件配置您的环境变量（特别是 JWT_SECRET）"
        else
            print_error ".env.docker.example 文件不存在"
            exit 1
        fi
    else
        print_info "使用现有的 .env 文件"
    fi
}

# 使用正确的 docker-compose 命令
docker_compose_cmd() {
    if docker compose version &> /dev/null; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
}

# 构建镜像
build() {
    print_info "正在构建 Docker 镜像..."
    docker_compose_cmd build
    print_success "镜像构建完成"
}

# 启动服务
start() {
    print_info "正在启动服务..."
    docker_compose_cmd up -d postgres

    print_info "等待数据库就绪..."
    sleep 5

    print_info "运行数据库迁移..."
    docker_compose_cmd run --rm migrate

    print_info "启动后端和前端服务..."
    docker_compose_cmd up -d backend frontend

    print_success "所有服务已启动"
}

# 停止服务
stop() {
    print_info "正在停止服务..."
    docker_compose_cmd down
    print_success "服务已停止"
}

# 重启服务
restart() {
    stop
    start
}

# 查看日志
logs() {
    docker_compose_cmd logs -f "$@"
}

# 查看状态
status() {
    docker_compose_cmd ps
}

# 运行数据库 seed
seed() {
    print_info "正在运行数据库 seed..."
    docker_compose_cmd run --rm seed
    print_success "数据库 seed 完成"
}

# 清理所有数据（危险操作）
clean() {
    print_warning "这将删除所有容器、镜像和数据卷！"
    read -p "确定要继续吗？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker_compose_cmd down -v --rmi all
        print_success "清理完成"
    else
        print_info "操作已取消"
    fi
}

# 显示帮助
help() {
    echo ""
    echo "HR App Docker 部署工具"
    echo ""
    echo "用法: ./deploy.sh [命令]"
    echo ""
    echo "可用命令:"
    echo "  build     构建 Docker 镜像"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  logs      查看日志 (可选参数: backend, frontend, postgres)"
    echo "  status    查看服务状态"
    echo "  seed      运行数据库 seed（创建测试数据）"
    echo "  clean     清理所有容器、镜像和数据（危险操作）"
    echo "  help      显示此帮助信息"
    echo ""
    echo "快速开始:"
    echo "  1. 复制并编辑环境变量: cp .env.docker.example .env"
    echo "  2. 构建并启动: ./deploy.sh build && ./deploy.sh start"
    echo "  3. (可选) 运行 seed: ./deploy.sh seed"
    echo ""
    echo "服务访问地址:"
    echo "  前端: http://localhost:80"
    echo "  后端 API: http://localhost:8000"
    echo "  数据库: localhost:5432"
    echo ""
}

# 主入口
main() {
    cd "$(dirname "$0")"

    case "$1" in
        build)
            check_docker
            setup_env
            build
            ;;
        start)
            check_docker
            setup_env
            start
            ;;
        stop)
            check_docker
            stop
            ;;
        restart)
            check_docker
            setup_env
            restart
            ;;
        logs)
            check_docker
            shift
            logs "$@"
            ;;
        status)
            check_docker
            status
            ;;
        seed)
            check_docker
            seed
            ;;
        clean)
            check_docker
            clean
            ;;
        help|--help|-h)
            help
            ;;
        *)
            print_info "欢迎使用 HR App Docker 一键部署"
            echo ""
            check_docker
            setup_env

            echo ""
            print_info "开始部署..."
            build
            start

            echo ""
            print_success "部署完成！"
            echo ""
            echo "服务访问地址:"
            echo "  前端: http://localhost:80"
            echo "  后端 API: http://localhost:8000/api/v1"
            echo ""
            echo "默认管理员账户:"
            echo "  用户名: admin@example.com"
            echo "  密码: admin123"
            echo ""
            echo "如需创建测试数据，请运行: ./deploy.sh seed"
            echo "查看日志: ./deploy.sh logs"
            echo "查看帮助: ./deploy.sh help"
            ;;
    esac
}

main "$@"
