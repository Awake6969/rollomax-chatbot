#!/bin/bash
set -e
echo "=== RolloMax Chatbot Deploy ==="

echo "Pulling latest changes..."
git pull origin main

echo "Restarting containers..."
docker compose down
docker compose up -d --build

sleep 5
echo "Container Status:"
docker compose ps

echo "=== Deploy complete ==="
echo "Chatbot erreichbar unter: https://chat.rollomax.at"
