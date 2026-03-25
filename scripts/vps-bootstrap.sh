#!/bin/bash
# ============================================================
# RolloMax Chatbot - VPS Bootstrap
# Einmal ausfuehren auf einem frischen Hostinger VPS.
# ============================================================
set -e

REPO_URL="git@github.com:Awake6969/rollomax-chatbot.git"
INSTALL_DIR="/opt/rollomax-chatbot"

echo ""
echo "=================================================="
echo "  RolloMax Chatbot - VPS Setup"
echo "=================================================="
echo ""

# --- 1. System aktualisieren ---
echo "[1/7] System aktualisieren..."
apt-get update -qq && apt-get upgrade -y -qq

# --- 2. Git installieren ---
echo "[2/7] Git installieren..."
if ! command -v git &> /dev/null; then
    apt-get install -y -qq git
fi
echo "      $(git --version)"

# --- 3. Docker installieren ---
echo "[3/7] Docker installieren..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
if ! docker compose version &> /dev/null 2>&1; then
    apt-get install -y -qq docker-compose-plugin
fi
echo "      $(docker --version)"
echo "      $(docker compose version)"

# --- 4. SSH Key fuer GitHub ---
echo "[4/7] SSH Key pruefen..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "rollomax-vps" -f ~/.ssh/id_ed25519 -N ""
    echo ""
    echo "========================================================"
    echo "  GitHub Deploy Key einrichten:"
    echo "  1. Gehe zu: https://github.com/Awake6969/rollomax-chatbot/settings/keys"
    echo "  2. Klicke 'Add deploy key'"
    echo "  3. Titel: 'Hostinger VPS'"
    echo "  4. Key (unten kopieren):"
    echo "========================================================"
    cat ~/.ssh/id_ed25519.pub
    echo "========================================================"
    echo ""
    read -p "  ENTER druecken nachdem Key eingetragen ist..."
fi

# GitHub als known host
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

# --- 5. Repo clonen ---
echo "[5/7] Repository clonen..."
if [ -d "$INSTALL_DIR" ]; then
    echo "      Verzeichnis existiert, fuehre git pull durch..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# --- 6. .env Datei erstellen ---
echo "[6/7] Umgebungsvariablen konfigurieren..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "========================================================"
    echo "  .env Datei erstellt. Jetzt API Keys eintragen:"
    echo ""
    echo "  ANTHROPIC_API_KEY  -> console.anthropic.com/settings/keys"
    echo "  SUPABASE_URL       -> Supabase Dashboard -> Settings -> API"
    echo "  SUPABASE_ANON_KEY  -> Supabase Dashboard -> Settings -> API"
    echo "  SUPABASE_SERVICE_KEY -> Supabase Dashboard -> Settings -> API"
    echo "========================================================"
    nano .env
fi

# Pruefen ob alle Keys eingetragen
if grep -q "HIER_EINFUEGEN" .env; then
    echo "  FEHLER: Noch nicht alle Keys in .env eingetragen."
    echo "  Bitte .env bearbeiten: nano $INSTALL_DIR/.env"
    echo "  Dann erneut starten: $INSTALL_DIR/scripts/deploy.sh"
    exit 1
fi

# --- 7. Deploy ---
echo "[7/7] Container starten..."
chmod +x scripts/*.sh
./scripts/deploy.sh

echo ""
echo "=================================================="
echo "  Setup abgeschlossen!"
echo ""
echo "  Chatbot: https://chat.rollomax.at"
echo "  N8N:     https://chat.rollomax.at (Admin-Login)"
echo ""
echo "  Naechster Schritt:"
echo "  N8N Workflow importieren:"
echo "  n8n-workflows/rollomax-chatbot-workflow.json"
echo "=================================================="
