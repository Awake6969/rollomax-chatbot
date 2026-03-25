#!/bin/bash
# ============================================================
# RolloMax Chatbot - Status Check
# Ausfuehren auf dem VPS um alle Services zu pruefen.
# ============================================================

echo ""
echo "=== RolloMax Chatbot Status ==="
echo ""

# Docker Container
echo "--- Docker Container ---"
docker compose ps
echo ""

# Logs (letzte 20 Zeilen)
echo "--- N8N Logs (letzte 20 Zeilen) ---"
docker compose logs --tail=20 n8n
echo ""

echo "--- Caddy Logs (letzte 10 Zeilen) ---"
docker compose logs --tail=10 caddy
echo ""

# Webhook erreichbar?
echo "--- Webhook Health Check ---"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS https://chat.rollomax.at/webhook/chat \
  -H "Origin: https://rollomax.at" 2>/dev/null)
if [ "$STATUS" = "204" ]; then
    echo "  CORS preflight: OK (204)"
else
    echo "  CORS preflight: WARNUNG (HTTP $STATUS)"
fi

# Widget erreichbar?
WIDGET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://chat.rollomax.at/widget/rollomax-chat-widget.js 2>/dev/null)
if [ "$WIDGET_STATUS" = "200" ]; then
    echo "  Widget JS:      OK (200)"
else
    echo "  Widget JS:      WARNUNG (HTTP $WIDGET_STATUS)"
fi

echo ""
echo "=== Status Ende ==="
