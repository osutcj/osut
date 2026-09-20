#!/usr/bin/env bash
# ==============================================================================
# OSUT Web Application - Production Deployment Script
# Repository: https://github.com/osutcj/osut.git
# Architecture:
#   - Public Facing: Nginx Reverse Proxy on Port 80 (HTTP) & Port 443 (HTTPS)
#   - SSL/TLS: Let's Encrypt via Certbot (HTTP-01 Webroot challenge)
#   - Application Engine: Next.js 16 (React 19) bound internally to 127.0.0.1:3000
#   - Process Manager: systemd (osut.service)
# ==============================================================================

set -euo pipefail

# --- COLOR CODES FOR FORMATTED LOGGING ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# --- DEFAULT CONFIGURATION ---
GIT_REPO="${GIT_REPO:-https://github.com/osutcj/osut.git}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
BRANCH="${BRANCH:-main}"
APP_NAME="${APP_NAME:-osut}"
APP_DIR="${APP_DIR:-/var/www/${APP_NAME}}"
APP_USER="${APP_USER:-${APP_NAME}}"
APP_GROUP="${APP_GROUP:-${APP_USER}}"
APP_INTERNAL_PORT="${APP_INTERNAL_PORT:-3000}"
DOMAIN="${DOMAIN:-osut.org}"
SSL_EMAIL="${SSL_EMAIL:-office@osutcluj.com}"
ENABLE_SSL=true
FORCE_SSL=false
SERVICE_NAME="${SERVICE_NAME:-${APP_NAME}}"
NODE_REQUIRED_MAJOR=20
NODE_INSTALL_VERSION=22
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
BLOB_READ_WRITE_TOKEN="${BLOB_READ_WRITE_TOKEN:-}"

# --- USAGE HELP ---
print_usage() {
    cat <<EOF
Usage: sudo $0 [OPTIONS]

Production deployment script for OSUT Next.js web application.
Deploys on Port 80 & Port 443 (SSL) via Nginx reverse proxy to Next.js on 127.0.0.1:3000.

Options:
  --domain <domain>         Domain name to configure (default: osut.org)
  --email <email>           Email address for Let's Encrypt SSL renewal alerts (default: office@osutcluj.com)
  --github-token <token>    GitHub Personal Access Token for authenticated clone/fetch
  --dir <path>              Application installation directory (default: /var/www/osut)
  --user <username>         Dedicated system user for the service (default: osut)
  --branch <branch>         Git branch to deploy (default: main)
  --repo <url>              Git repository URL (default: https://github.com/osutcj/osut.git)
  --admin-password <pass>   Admin dashboard password (auto-generated if omitted)
  --service-name <name>     Systemd service unit name (default: osut)
  --internal-port <port>    Internal Next.js port bound to 127.0.0.1 (default: 3000)
  --skip-ssl, --no-ssl      Deploy on Port 80 only without generating Let's Encrypt SSL
  --force-ssl               Force renewal / reissuance of SSL certificate
  -h, --help                Show this help message and exit

Environment Variables:
  DOMAIN, SSL_EMAIL, GITHUB_TOKEN, APP_DIR, APP_USER, BRANCH, GIT_REPO,
  ADMIN_PASSWORD, BLOB_READ_WRITE_TOKEN, APP_INTERNAL_PORT

EOF
}

# --- PARSE COMMAND LINE ARGUMENTS ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --domain)
            DOMAIN="$2"; shift 2 ;;
        --email|--ssl-email)
            SSL_EMAIL="$2"; shift 2 ;;
        --github-token|--token)
            GITHUB_TOKEN="$2"; shift 2 ;;
        --skip-ssl|--no-ssl)
            ENABLE_SSL=false; shift ;;
        --force-ssl)
            FORCE_SSL=true; shift ;;
        --internal-port)
            APP_INTERNAL_PORT="$2"; shift 2 ;;
        --dir)
            APP_DIR="$2"; shift 2 ;;
        --user)
            APP_USER="$2"; APP_GROUP="$2"; shift 2 ;;
        --branch)
            BRANCH="$2"; shift 2 ;;
        --repo)
            GIT_REPO="$2"; shift 2 ;;
        --admin-password)
            ADMIN_PASSWORD="$2"; shift 2 ;;
        --service-name)
            SERVICE_NAME="$2"; shift 2 ;;
        -h|--help)
            print_usage; exit 0 ;;
        *)
            log_error "Unknown argument: $1"
            print_usage
            exit 1
            ;;
    esac
done

# If GitHub Token is supplied, inject it securely into GIT_REPO URL
if [ -n "$GITHUB_TOKEN" ]; then
    if [[ "$GIT_REPO" =~ ^https://github\.com/ ]]; then
        GIT_REPO="https://x-access-token:${GITHUB_TOKEN}@github.com/${GIT_REPO#https://github.com/}"
    elif [[ "$GIT_REPO" =~ ^https:// ]]; then
        # Strip any existing user credentials and insert token
        GIT_REPO="https://x-access-token:${GITHUB_TOKEN}@${GIT_REPO#https://*@}"
    fi
fi

# Mask any token in log output
LOG_REPO_URL=$(echo "$GIT_REPO" | sed -E 's#https://[^@]+@#https://***@#')

echo -e "${BLUE}============================================================${NC}"
echo -e "${BOLD}${CYAN}      OSUT Next.js Production Deployment Script        ${NC}"
echo -e "${BLUE}============================================================${NC}"
log_info "Repository:        ${LOG_REPO_URL}"
log_info "Branch:            ${BRANCH}"
log_info "Target Directory:  ${APP_DIR}"
log_info "Target Domain:     ${DOMAIN}"
log_info "SSL Email:         ${SSL_EMAIL}"
log_info "Public Web Ports:  80 (HTTP) and 443 (HTTPS via Nginx)"
log_info "Internal App Port: 127.0.0.1:${APP_INTERNAL_PORT} (${SERVICE_NAME}.service)"
log_info "System User:       ${APP_USER}"

# --- PRE-FLIGHT PRIVILEGE & INIT SYSTEM CHECKS ---
if [ "${EUID}" -ne 0 ]; then
    log_error "This deployment script must be run with root privileges (sudo)."
    echo -e "Please re-run: ${BOLD}sudo $0${NC}"
    exit 1
fi

if ! pidof systemd >/dev/null 2>&1 && [ ! -d /run/systemd/system ]; then
    log_error "Systemd is not running as init on this machine. This script requires systemd."
    exit 1
fi

# Synchronize system time if timedatectl is available
if command -v timedatectl >/dev/null 2>&1; then
    timedatectl set-ntp true 2>/dev/null || true
fi

# --- STEP 1: INSTALL SYSTEM DEPENDENCIES ---
install_dependencies() {
    log_info "Installing core system packages..."
    if command -v apt-get >/dev/null 2>&1; then
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -y
        local pkgs="curl git ca-certificates gnupg build-essential psmisc nginx dnsutils"
        if [ "$ENABLE_SSL" = true ]; then
            pkgs="${pkgs} certbot python3-certbot-nginx"
        fi
        apt-get install -y $pkgs
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y epel-release || true
        local pkgs="curl git ca-certificates gcc-c++ make psmisc nginx bind-utils"
        if [ "$ENABLE_SSL" = true ]; then
            pkgs="${pkgs} certbot python3-certbot-nginx"
        fi
        dnf install -y $pkgs
    elif command -v yum >/dev/null 2>&1; then
        yum install -y epel-release || true
        local pkgs="curl git ca-certificates gcc-c++ make psmisc nginx bind-utils"
        if [ "$ENABLE_SSL" = true ]; then
            pkgs="${pkgs} certbot python3-certbot-nginx"
        fi
        yum install -y $pkgs
    elif command -v pacman >/dev/null 2>&1; then
        local pkgs="curl git base-devel psmisc nginx bind"
        if [ "$ENABLE_SSL" = true ]; then
            pkgs="${pkgs} certbot certbot-nginx"
        fi
        pacman -Sy --noconfirm $pkgs
    else
        log_warn "Unrecognized package manager. Please ensure curl, git, build-essential, and nginx are installed."
    fi
}

install_node() {
    log_info "Node.js (>= ${NODE_REQUIRED_MAJOR}) is required. Installing Node.js ${NODE_INSTALL_VERSION}.x..."
    if command -v apt-get >/dev/null 2>&1; then
        curl -fsSL "https://deb.nodesource.com/setup_${NODE_INSTALL_VERSION}.x" | bash -
        apt-get install -y nodejs
    elif command -v dnf >/dev/null 2>&1; then
        curl -fsSL "https://rpm.nodesource.com/setup_${NODE_INSTALL_VERSION}.x" | bash -
        dnf install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        curl -fsSL "https://rpm.nodesource.com/setup_${NODE_INSTALL_VERSION}.x" | bash -
        yum install -y nodejs
    elif command -v pacman >/dev/null 2>&1; then
        pacman -S --noconfirm nodejs npm
    else
        log_error "Cannot automatically install Node.js. Please install Node.js >= 20 manually."
        exit 1
    fi
}

# Ensure prerequisites are installed
if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1 || ! command -v nginx >/dev/null 2>&1 || \
   ([ "$ENABLE_SSL" = true ] && ! command -v certbot >/dev/null 2>&1); then
    install_dependencies
fi

# Ensure Node.js is installed and meets version requirement
if ! command -v node >/dev/null 2>&1; then
    install_node
else
    NODE_VERSION_CURRENT=$(node -v | sed 's/^v//' | cut -d '.' -f 1)
    if [ "$NODE_VERSION_CURRENT" -lt "$NODE_REQUIRED_MAJOR" ]; then
        log_warn "Node.js v${NODE_VERSION_CURRENT} is below required v${NODE_REQUIRED_MAJOR}."
        install_node
    else
        log_success "Node.js $(node -v) is installed and meets requirement."
    fi
fi

if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is not installed. Please install npm."
    exit 1
fi

NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"
log_info "Node binary: ${NODE_BIN}"
log_info "NPM binary:  ${NPM_BIN}"

# --- STEP 2: CREATE DEDICATED SYSTEM USER ---
if ! getent group "$APP_GROUP" >/dev/null 2>&1; then
    log_info "Creating group '${APP_GROUP}'..."
    groupadd -r "$APP_GROUP" || true
fi

if ! id -u "$APP_USER" >/dev/null 2>&1; then
    log_info "Creating system user '${APP_USER}'..."
    useradd -r -g "$APP_GROUP" -d "$APP_DIR" -s /bin/bash -c "OSUT Service User" "$APP_USER" || \
    useradd -r -g "$APP_GROUP" -s /bin/bash "$APP_USER"
fi

# --- STEP 3: CLONE OR UPDATE REPOSITORY ---
mkdir -p "$APP_DIR"

# Prevent git "dubious ownership" fatal errors when running under sudo
git config --system --add safe.directory "*" 2>/dev/null || true
git config --global --add safe.directory "*" 2>/dev/null || true
git config --system --add safe.directory "$APP_DIR" 2>/dev/null || true

safe_git() {
    git -c safe.directory=* -c "safe.directory=${APP_DIR}" "$@"
}

CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# If running directly inside a cloned copy not yet at APP_DIR, sync files
if [ "$CURRENT_SCRIPT_DIR" != "$APP_DIR" ] && [ -f "${CURRENT_SCRIPT_DIR}/package.json" ] && [ ! -d "$APP_DIR/.git" ]; then
    log_info "Syncing local repository files from ${CURRENT_SCRIPT_DIR} to ${APP_DIR}..."
    cp -a "${CURRENT_SCRIPT_DIR}/." "$APP_DIR/"
fi

if [ ! -d "$APP_DIR/.git" ]; then
    log_info "Cloning repository ${LOG_REPO_URL} into ${APP_DIR}..."
    safe_git clone --branch "$BRANCH" "$GIT_REPO" "$APP_DIR"
    log_success "Repository cloned."
else
    log_info "Updating repository in ${APP_DIR} to branch ${BRANCH}..."
    cd "$APP_DIR"
    safe_git remote set-url origin "$GIT_REPO"
    safe_git fetch origin "$BRANCH"
    safe_git checkout "$BRANCH"
    safe_git reset --hard "origin/$BRANCH"
    log_success "Repository updated."
fi

cd "$APP_DIR"

# --- STEP 4: PREPARE LOCAL DATA & UPLOAD DIRECTORIES ---
# Required for posts and file uploads when running without Vercel Blob
mkdir -p "$APP_DIR/public/assets/data"
mkdir -p "$APP_DIR/public/assets/uploads"

if [ ! -f "$APP_DIR/public/assets/data/posts.json" ] || [ ! -s "$APP_DIR/public/assets/data/posts.json" ] || grep -q '^\s*\[\]\s*$' "$APP_DIR/public/assets/data/posts.json" 2>/dev/null; then
    if [ -f "$APP_DIR/posts.json" ]; then
        log_info "Initializing posts.json from repository template..."
        cp "$APP_DIR/posts.json" "$APP_DIR/public/assets/data/posts.json"
    else
        echo "[]" > "$APP_DIR/public/assets/data/posts.json"
    fi
fi

# --- STEP 5: CONFIGURE ENVIRONMENT VARIABLES ---
ENV_FILE="$APP_DIR/.env.local"
CURRENT_ADMIN_PASS=""

if [ -f "$ENV_FILE" ]; then
    CURRENT_ADMIN_PASS=$(grep -E '^ADMIN_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi

if [ -n "$ADMIN_PASSWORD" ]; then
    FINAL_ADMIN_PASS="$ADMIN_PASSWORD"
elif [ -n "$CURRENT_ADMIN_PASS" ]; then
    FINAL_ADMIN_PASS="$CURRENT_ADMIN_PASS"
else
    FINAL_ADMIN_PASS=$(openssl rand -hex 16 2>/dev/null || tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
fi

log_info "Writing production environment configuration to ${ENV_FILE}..."
cat > "$ENV_FILE" <<EOF
# OSUT Next.js Production Configuration
NODE_ENV=production
PORT=${APP_INTERNAL_PORT}

# Secure password for /admin dashboard
ADMIN_PASSWORD=${FINAL_ADMIN_PASS}
EOF

if [ -n "$BLOB_READ_WRITE_TOKEN" ]; then
    echo "BLOB_READ_WRITE_TOKEN=${BLOB_READ_WRITE_TOKEN}" >> "$ENV_FILE"
elif [ -f "$APP_DIR/.env.local.bak" ] && grep -q '^BLOB_READ_WRITE_TOKEN=' "$APP_DIR/.env.local.bak"; then
    grep '^BLOB_READ_WRITE_TOKEN=' "$APP_DIR/.env.local.bak" >> "$ENV_FILE"
else
    echo "# BLOB_READ_WRITE_TOKEN=" >> "$ENV_FILE"
fi

chmod 600 "$ENV_FILE"
chown "$APP_USER:$APP_GROUP" "$ENV_FILE"

# Helper function to run commands as APP_USER
run_as_app_user() {
    if command -v sudo >/dev/null 2>&1; then
        sudo -u "$APP_USER" "$@"
    else
        su -s /bin/bash "$APP_USER" -c "$*"
    fi
}

# --- STEP 6: INSTALL DEPENDENCIES & BUILD NEXT.JS ---
log_info "Setting directory permissions for ${APP_USER}:${APP_GROUP}..."
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

log_info "Installing npm dependencies..."
run_as_app_user npm ci || run_as_app_user npm install

log_info "Compiling Next.js production build..."
run_as_app_user npm run build
log_success "Next.js production build completed successfully."

# Re-apply permissions after build
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

# --- STEP 7: CONFIGURE SYSTEMD SERVICE (127.0.0.1:3000) ---
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
log_info "Setting up systemd service unit at ${SERVICE_PATH}..."

systemctl stop "${SERVICE_NAME}.service" 2>/dev/null || true
if command -v fuser >/dev/null 2>&1; then
    fuser -k "${APP_INTERNAL_PORT}/tcp" 2>/dev/null || true
fi

cat > "$SERVICE_PATH" <<EOF
[Unit]
Description=OSUT Next.js Web Application
Documentation=https://github.com/osutcj/osut
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${APP_INTERNAL_PORT}
Environment=PATH=/usr/local/bin:/usr/bin:/bin:${APP_DIR}/node_modules/.bin
EnvironmentFile=-${APP_DIR}/.env.local
ExecStart=${NODE_BIN} ${APP_DIR}/node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${APP_INTERNAL_PORT}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$SERVICE_PATH"

log_info "Reloading systemd and enabling ${SERVICE_NAME}.service..."
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}.service"
systemctl restart "${SERVICE_NAME}.service"

# Verify local Next.js service health
log_info "Waiting for Next.js application to respond on 127.0.0.1:${APP_INTERNAL_PORT}..."
HEALTHY=false
for attempt in {1..30}; do
    if curl -s -f -o /dev/null "http://127.0.0.1:${APP_INTERNAL_PORT}" 2>/dev/null; then
        HEALTHY=true
        break
    fi
    sleep 1
done

if [ "$HEALTHY" != true ]; then
    echo -e "${RED}============================================================${NC}"
    echo -e "${BOLD}${RED}  Application did not respond on 127.0.0.1:${APP_INTERNAL_PORT} within 30s ${NC}"
    echo -e "${RED}============================================================${NC}"
    log_error "Service Status:"
    systemctl status "${SERVICE_NAME}.service" --no-pager || true
    echo ""
    log_error "Recent Logs:"
    journalctl -u "${SERVICE_NAME}.service" -n 30 --no-pager || true
    exit 1
fi
log_success "Next.js application is running healthy on 127.0.0.1:${APP_INTERNAL_PORT}."

# --- STEP 8: CONFIGURE NGINX & REVERSE PROXY ON PORT 80 ---
log_info "Configuring Nginx reverse proxy..."

# 1. Clean up any conflicting default configurations or old osut configs across both directories
log_info "Removing any conflicting or duplicate Nginx virtual hosts..."
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
rm -f /etc/nginx/conf.d/${APP_NAME}.conf /etc/nginx/conf.d/${APP_NAME}*.conf 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/${APP_NAME}.conf 2>/dev/null || true
rm -f /etc/nginx/sites-available/${APP_NAME}.conf 2>/dev/null || true

# Remove any old legacy configs referencing osut.org or 1.osut.org that cause 502/expired certs
grep -rlE "(1\.osut\.org|osut\.org)" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | while read -r legacy_conf; do
    log_warn "Removing legacy Nginx virtual host: $legacy_conf"
    rm -f "$legacy_conf" 2>/dev/null || true
done

# Strip default_server from any remaining configurations to prevent conflict
grep -rl "default_server" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | while read -r conf_file; do
    sed -i 's/default_server//g' "$conf_file" 2>/dev/null || true
done

# 2. Determine target Nginx configuration file
if [ -d /etc/nginx/sites-available ] && [ -d /etc/nginx/sites-enabled ]; then
    NGINX_AVAILABLE="/etc/nginx/sites-available/${APP_NAME}.conf"
    NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}.conf"
else
    mkdir -p /etc/nginx/conf.d
    NGINX_AVAILABLE="/etc/nginx/conf.d/${APP_NAME}.conf"
    NGINX_ENABLED="/etc/nginx/conf.d/${APP_NAME}.conf"
fi

# ACME challenge webroot directory for Certbot HTTP-01 challenges
ACME_WEBROOT="/var/www/certbot"
mkdir -p "${ACME_WEBROOT}/.well-known/acme-challenge"
chmod -R 755 "${ACME_WEBROOT}"
chown -R www-data:www-data "${ACME_WEBROOT}" 2>/dev/null || chown -R nginx:nginx "${ACME_WEBROOT}" 2>/dev/null || true

# Check if www subdomain also resolves to avoid Certbot failure if not in DNS
DOMAINS_LIST=("$DOMAIN")
if [ "$DOMAIN" != "localhost" ] && ! [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    WWW_RESOLVES=false
    if command -v host >/dev/null 2>&1; then
        if host "www.${DOMAIN}" >/dev/null 2>&1; then WWW_RESOLVES=true; fi
    elif command -v nslookup >/dev/null 2>&1; then
        if nslookup "www.${DOMAIN}" >/dev/null 2>&1; then WWW_RESOLVES=true; fi
    elif command -v dig >/dev/null 2>&1; then
        if [ -n "$(dig +short "www.${DOMAIN}")" ]; then WWW_RESOLVES=true; fi
    fi

    if [ "$WWW_RESOLVES" = true ]; then
        DOMAINS_LIST+=("www.${DOMAIN}")
        log_info "Detected active DNS for www.${DOMAIN} - will include in SSL certificate."
    else
        log_info "www.${DOMAIN} has no DNS record - configuring SSL for ${DOMAIN} only."
    fi
fi
SERVER_NAMES="${DOMAINS_LIST[*]}"

# Write clean Port 80 Nginx configuration (without duplicate default_server keyword)
write_http_only_nginx() {
    cat > "$NGINX_AVAILABLE" <<EOF
# OSUT Application - HTTP Configuration
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAMES} _;

    client_max_body_size 50M;

    # Certbot ACME challenge handler
    location ^~ /.well-known/acme-challenge/ {
        root ${ACME_WEBROOT};
        default_type "text/plain";
        try_files \$uri =404;
    }

    # Reverse proxy to local Next.js instance
    location / {
        proxy_pass http://127.0.0.1:${APP_INTERNAL_PORT};
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # Forwarded client headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
}

# Write full HTTP + HTTPS Nginx configuration with 301 redirection
write_ssl_nginx() {
    local cert_dir="/etc/letsencrypt/live/${DOMAIN}"
    cat > "$NGINX_AVAILABLE" <<EOF
# OSUT Application - HTTP to HTTPS Redirect & ACME Challenge
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAMES} _;

    location ^~ /.well-known/acme-challenge/ {
        root ${ACME_WEBROOT};
        default_type "text/plain";
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# OSUT Application - HTTPS SSL Server
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${SERVER_NAMES};

    ssl_certificate ${cert_dir}/fullchain.pem;
    ssl_certificate_key ${cert_dir}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${APP_INTERNAL_PORT};
        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port 443;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
}

# Initial Port 80 activation
log_info "Writing initial Port 80 Nginx reverse proxy configuration..."
write_http_only_nginx

if [ "$NGINX_AVAILABLE" != "$NGINX_ENABLED" ]; then
    ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
fi

log_info "Testing Nginx configuration syntax..."
nginx -t

log_info "Starting Nginx web server on Port 80..."
systemctl enable nginx
systemctl restart nginx
log_success "Nginx is active and reverse-proxying Port 80."

# --- STEP 9: SSL CERTIFICATE ISSUANCE VIA CERTBOT ---
SSL_SUCCESS=false
if [ "$ENABLE_SSL" = true ] && [ "$DOMAIN" != "localhost" ] && ! [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_info "Requesting Let's Encrypt SSL certificate for: ${SERVER_NAMES}..."
    
    CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
    CERTBOT_DOMAIN_ARGS=""
    for d in "${DOMAINS_LIST[@]}"; do
        CERTBOT_DOMAIN_ARGS="${CERTBOT_DOMAIN_ARGS} -d ${d}"
    done

    CERTBOT_EXTRA_FLAGS=""
    if [ "$FORCE_SSL" = true ]; then
        CERTBOT_EXTRA_FLAGS="--force-renewal"
    else
        CERTBOT_EXTRA_FLAGS="--keep-until-expiring"
    fi

    # Execute certbot
    if certbot certonly --webroot -w "${ACME_WEBROOT}" \
        ${CERTBOT_DOMAIN_ARGS} \
        --non-interactive \
        --agree-tos \
        --email "${SSL_EMAIL}" \
        --no-eff-email \
        ${CERTBOT_EXTRA_FLAGS}; then

        if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
            log_success "Let's Encrypt SSL certificate successfully obtained!"
            log_info "Upgrading Nginx to HTTPS with Port 80 redirect..."
            write_ssl_nginx
            nginx -t
            systemctl restart nginx
            SSL_SUCCESS=true
            log_success "HTTPS reverse proxy active on Port 443."
            
            # Enable Certbot systemd timer if available
            if systemctl list-unit-files | grep -q 'certbot.timer'; then
                systemctl enable --now certbot.timer 2>/dev/null || true
            fi
        fi
    else
        log_warn "SSL certificate issuance could not complete right now."
        log_warn "Port 80 remains active and fully functional. You can re-run the script later to retry SSL."
    fi
fi

# --- STEP 10: FIREWALL CONFIGURATION ---
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    log_info "Configuring UFW firewall rules for web ports..."
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
elif command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld; then
    log_info "Configuring firewalld rules for web services..."
    firewall-cmd --permanent --add-service=http || true
    firewall-cmd --permanent --add-service=https || true
    firewall-cmd --reload || true
fi

# Detect public IP for summary
SERVER_IP=$(curl -s --max-time 2 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}' || echo "164.92.128.118")

# --- FINAL LOCAL HEALTH CHECK ---
log_info "Verifying local web proxy response..."
if curl -s -f -o /dev/null -H "Host: ${DOMAIN}" "http://127.0.0.1:80" 2>/dev/null || \
   curl -s -k -f -o /dev/null -H "Host: ${DOMAIN}" "https://127.0.0.1:443" 2>/dev/null; then
    log_success "Web proxy is responding to HTTP requests."
fi

# --- DEPLOYMENT SUMMARY ---
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${BOLD}${GREEN}   ✓ OSUT APPLICATION SUCCESSFULLY DEPLOYED!              ${NC}"
echo -e "${GREEN}============================================================${NC}"
echo -e "Status:               ${BOLD}${GREEN}Active & Running${NC}"
if [ "$SSL_SUCCESS" = true ]; then
    echo -e "Public URL:           ${BOLD}${CYAN}https://${DOMAIN}${NC} (or http://${SERVER_IP})"
    echo -e "Admin Panel:          ${BOLD}${CYAN}https://${DOMAIN}/admin${NC}"
    echo -e "SSL Certificate:      ${BOLD}${GREEN}Enabled (Let's Encrypt / ${SSL_EMAIL})${NC}"
else
    echo -e "Public URL:           ${BOLD}${CYAN}http://${DOMAIN}${NC} (or http://${SERVER_IP})"
    echo -e "Admin Panel:          ${BOLD}${CYAN}http://${DOMAIN}/admin${NC}"
    echo -e "SSL Certificate:      ${BOLD}${YELLOW}Port 80 HTTP Only (Run again to retry SSL)${NC}"
fi
echo -e "Admin Password:       ${BOLD}${YELLOW}${FINAL_ADMIN_PASS}${NC}"
echo -e "Systemd Service:      ${BOLD}${SERVICE_NAME}.service${NC}"
echo -e "Application Path:     ${BOLD}${APP_DIR}${NC}"
echo -e "Internal Next.js:     ${BOLD}127.0.0.1:${APP_INTERNAL_PORT}${NC}"
echo -e "Application User:     ${BOLD}${APP_USER}${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "${BOLD}Management Commands:${NC}"
echo -e "  • Check app service:  ${CYAN}sudo systemctl status ${SERVICE_NAME}${NC}"
echo -e "  • Check Nginx status: ${CYAN}sudo systemctl status nginx${NC}"
echo -e "  • View live app logs: ${CYAN}sudo journalctl -u ${SERVICE_NAME} -f${NC}"
echo -e "  • View Nginx logs:    ${CYAN}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "  • Restart app:        ${CYAN}sudo systemctl restart ${SERVICE_NAME}${NC}"
echo -e "  • Reload Nginx:       ${CYAN}sudo systemctl reload nginx${NC}"
echo -e "  • Re-run deploy:      ${CYAN}sudo $0${NC}"
echo ""
