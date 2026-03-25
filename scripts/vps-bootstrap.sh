#!/bin/bash
# ============================================================
# RolloMax Chatbot - VPS Bootstrap
# Einmal ausfuehren auf einem frischen Hostinger VPS.
# Installiert Docker, Git, clont das Repo, startet den Bot.
# ============================================================
set -e

echo ""
echo "=================================================="
echo "  RolloMax Chatbot - VPS Setup"
echo "=================================================="
echo ""

# --- 1. Systempakete aktualisieren ---
echo "[1/7] System aktualisieren..."
apt-get update -qq && apt-get upgrade -y -qq

# --- 2. Git installieren ---
echo "[2/7] Git installieren..."
if ! command -v git &> /dev/null; then
    apt-get install -y -qq git
    echo "      Git installiert."
else
    echo "      Git bereits vorhanden: $(git --version)"
fi

# --- 3. Docker installieren ---
echo "[3/7] Docker installieren..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "      Docker installiert."
else
    echo "      Docker bereits vorhanden: $(docker --version)"
fi

# Docker Compose (V2) pruefen
if ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi
echo "      Docker Compose: $(docker compose version)"

# --- 4. SSH Key fuer GitHub ---
echo "[4/7] SSH Key pruefen..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "      Generiere neuen SSH Key..."
    ssh-keygen -t ed25519 -C "rollomax-vps" -f ~/.ssh/id_ed25519 -N ""
    echo ""
    echo "========================================================"
    echo "  WICHTIG: Folgenden SSH Public Key bei GitHub"
    echo "  unter Settings -> Deploy keys -> Add deploy key"
    echo "  eintragen (Read access reicht):"
    echo "========================================================"
    cat ~/.ssh/id_ed25519.pub
    echo "========================================================"
    echo ""
    read -p "  Druecke ENTER nachdem du den Key bei GitHub eingetragen hast..."
else
    echo "      SSH Key bereits vorhanden."
fi

# --- 5. Repo clonen ---
echo "[5/7] Repository clonen..."
mkdir -p /opt
cd /opt

if [ -d "rollomax-chatbot" ]; then
    echo "      Verzeichnis existiert bereits, ueberspringe clone."
else
    echo ""
    echo "  Gib deine GitHub Repository URL ein."
    echo "  Format: git@github.com:DEIN-USERNAME/rollomax-chatbot.git"
    read -p "  GitHub URL: " REPO_URL
    git clone "$REPO_URL" rollomax-chatbot
    echo "      Repository geclont."
fi

cd /opt/rollomax-chatbot

# --- 6. .env Datei erstellen ---
echo "[6/7] Umgebungsvariablen konfigurieren..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "========================================================"
    echo "  Die .env Datei wurde aus .env.example erstellt."
    echo "  Jetzt die fehlenden API Keys eintragen:"
    echo "========================================================"
    echo ""
    echo "  ANTHROPIC_API_KEY   -> https://console.anthropic.com/settings/keys"
    echo "  SUPABASE_URL        -> Supabase Dashboard -> Settings -> API"
    echo "  SUPABASE_ANON_KEY   -> Supabase Dashboard -> Settings -> API"
    echo "  SUPABASE_SERVICE_KEY -> Supabase Dashboard -> Settings -> API"
    echo ""
    nano .env
else
    echo "      .env Datei bereits vorhanden."
fi

# Pruefen ob Pflichtfelder ausgefuellt sind
if grep -q "HIER_EINFUEGEN" .env; then
    echo ""
    echo "  WARNUNG: Noch nicht alle Keys in .env eingetragen!"
    echo "  Bitte .env vervollstaendigen und dann erneut starten:"
    echo "  nano /opt/rollomax-chatbot/.env"
    echo "  ./scripts/deploy.sh"
    exit 1
fi

# --- 7. Deploy ---
echo "[7/7] Container starten..."
chmod +x scripts/deploy.sh
./scripts/deploy.sh

echo ""
echo "=================================================="
echo "  Setup abgeschlossen!"
echo "  Chatbot laeuft unter: https://chat.rollomax.at"
echo ""
echo "  N8N Login:"
echo "  URL:      https://chat.rollomax.at"
echo "  User:     admin"
echo "  Passwort: (aus .env N8N_BASIC_AUTH_PASSWORD)"
echo "=================================================="
