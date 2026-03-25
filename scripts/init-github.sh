#!/bin/bash
echo "=== GitHub Repo initialisieren ==="
echo "WICHTIG: Erstelle zuerst ein PRIVATES Repo auf github.com"
echo "Repo-Name: rollomax-chatbot"
echo ""

git init
git add .
git commit -m "Initial commit: RolloMax KI-Chatbot"
git branch -M main

echo ""
echo "Jetzt ausfuehren:"
echo "  git remote add origin git@github.com:DEIN-USERNAME/rollomax-chatbot.git"
echo "  git push -u origin main"
echo ""
echo "Danach auf dem VPS:"
echo "  cd /opt"
echo "  git clone git@github.com:DEIN-USERNAME/rollomax-chatbot.git"
echo "  cd rollomax-chatbot"
echo "  cp .env.example .env"
echo "  nano .env  # API-Keys eintragen"
echo "  chmod +x scripts/deploy.sh"
echo "  ./scripts/deploy.sh"
