#!/bin/bash
# ============================================================
# 企业级CRM系统 - 生产部署脚本
# 用法: bash deploy.sh [命令]
#   命令: start | stop | restart | update | logs | status | backup
# ============================================================

set -euo pipefail

# ─── 颜色定义 ─────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

# ─── 配置 ─────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${PROJECT_DIR}/deploy.log"

log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ $*${NC}" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠ $*${NC}" | tee -a "$LOG_FILE"; }
err()  { echo -e "${RED}[$(date +'%H:%M:%S')] ✗ $*${NC}" | tee -a "$LOG_FILE"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ $*${NC}" | tee -a "$LOG_FILE"; }

# ─── 检查依赖 ─────────────────────────────────────────────
check_deps() {
    for dep in docker curl; do
        command -v "$dep" &>/dev/null || { err "缺少依赖: $dep"; exit 1; }
    done
    docker compose version &>/dev/null || docker-compose version &>/dev/null || {
        err "需要 Docker Compose (v2 或 v1)"; exit 1;
    }
}

# ─── Docker Compose 命令适配 ──────────────────────────────
dc() {
    if docker compose version &>/dev/null 2>&1; then
        docker compose -f "$COMPOSE_FILE" "$@"
    else
        docker-compose -f "$COMPOSE_FILE" "$@"
    fi
}

# ─── 检查环境变量 ─────────────────────────────────────────
check_env() {
    [[ -f "${PROJECT_DIR}/.env" ]] || {
        warn ".env 文件不存在，从示例文件创建..."
        cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
        err "请编辑 .env 文件设置必要参数（特别是密码和密钥），然后重新运行"
        exit 1
    }
    source "${PROJECT_DIR}/.env"
    for var in DATABASE_PASSWORD JWT_SECRET MINIO_SECRET_KEY; do
        [[ "${!var:-}" == *"please-change"* || "${!var:-}" == *"2025!"* ]] && \
            warn "请修改 .env 中的默认值: $var"
    done
}

# ─── 等待服务健康 ─────────────────────────────────────────
wait_healthy() {
    local service=$1 max_wait=${2:-120} interval=5
    info "等待 $service 服务就绪..."
    local elapsed=0
    while [[ $elapsed -lt $max_wait ]]; do
        if dc ps "$service" 2>/dev/null | grep -q "(healthy)"; then
            log "$service 已就绪"
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
        echo -n "."
    done
    echo ""
    err "$service 启动超时（${max_wait}s）"
    dc logs --tail=50 "$service"
    return 1
}

# ─── 部署命令 ─────────────────────────────────────────────
cmd_start() {
    info "=== 启动 CRM 系统 ==="
    check_env

    log "拉取/构建镜像..."
    dc build --pull

    log "启动基础服务..."
    dc up -d postgres redis minio

    wait_healthy postgres 60
    wait_healthy redis 30

    log "启动后端服务..."
    dc up -d backend
    wait_healthy backend 120

    log "启动前端服务..."
    dc up -d frontend

    cmd_status
    log "=== 启动完成 ==="
    echo ""
    info "访问地址: http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT:-80}"
    info "默认账号: admin / admin123456"
}

cmd_stop() {
    info "=== 停止 CRM 系统 ==="
    dc down
    log "已停止所有服务"
}

cmd_restart() {
    cmd_stop
    sleep 2
    cmd_start
}

cmd_update() {
    info "=== 更新 CRM 系统 ==="
    check_env

    log "备份数据库..."
    cmd_backup

    log "重新构建镜像..."
    dc build --pull --no-cache

    log "滚动更新服务..."
    dc up -d --force-recreate backend frontend

    wait_healthy backend 120

    cmd_status
    log "=== 更新完成 ==="
}

cmd_logs() {
    local service=${1:-""}
    if [[ -n "$service" ]]; then
        dc logs -f --tail=100 "$service"
    else
        dc logs -f --tail=50
    fi
}

cmd_status() {
    echo ""
    info "=== 服务状态 ==="
    dc ps
    echo ""
    info "=== 资源使用 ==="
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        $(dc ps -q) 2>/dev/null || true
}

cmd_backup() {
    info "=== 备份数据库 ==="
    check_env
    mkdir -p "$BACKUP_DIR"
    source "${PROJECT_DIR}/.env"

    local filename="crm_backup_$(date +'%Y%m%d_%H%M%S').sql.gz"
    local filepath="${BACKUP_DIR}/${filename}"

    dc exec -T postgres pg_dump \
        -U "${DATABASE_USER:-crm_user}" \
        "${DATABASE_NAME:-crm_db}" | gzip > "$filepath"

    log "备份完成: $filepath ($(du -sh "$filepath" | cut -f1))"

    # 保留最近 10 个备份
    ls -t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f
    log "旧备份已清理（保留最近10个）"
}

cmd_restore() {
    local backup_file=${1:-""}
    [[ -z "$backup_file" ]] && { err "请指定备份文件: bash deploy.sh restore <file.sql.gz>"; exit 1; }
    [[ -f "$backup_file" ]] || { err "文件不存在: $backup_file"; exit 1; }

    check_env
    source "${PROJECT_DIR}/.env"
    warn "此操作将覆盖当前数据库！按 Ctrl+C 取消，或按 Enter 继续..."
    read -r

    gunzip -c "$backup_file" | dc exec -T postgres psql \
        -U "${DATABASE_USER:-crm_user}" "${DATABASE_NAME:-crm_db}"
    log "恢复完成"
}

cmd_shell() {
    local service=${1:-backend}
    dc exec "$service" /bin/sh
}

# ─── 主入口 ──────────────────────────────────────────────
check_deps
mkdir -p "$BACKUP_DIR"

case "${1:-help}" in
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    restart) cmd_restart ;;
    update)  cmd_update ;;
    logs)    cmd_logs "${2:-}" ;;
    status)  cmd_status ;;
    backup)  cmd_backup ;;
    restore) cmd_restore "${2:-}" ;;
    shell)   cmd_shell "${2:-backend}" ;;
    *)
        echo "企业级CRM系统部署脚本"
        echo ""
        echo "用法: $0 <命令> [参数]"
        echo ""
        echo "命令:"
        echo "  start          启动所有服务"
        echo "  stop           停止所有服务"
        echo "  restart        重启所有服务"
        echo "  update         更新并重新构建（自动备份）"
        echo "  logs [service] 查看日志（不指定则查看所有）"
        echo "  status         查看服务状态"
        echo "  backup         备份数据库"
        echo "  restore <file> 从备份文件恢复"
        echo "  shell [service] 进入服务容器 (默认 backend)"
        ;;
esac
