#!/bin/bash
# ============================================================
# RolloMax Chatbot - Webhook Test
# Ausfuehren nachdem N8N Workflow aktiv ist.
# ============================================================

# Config
TOKEN="eac10535d2bbaaa3e3aedda46b556db6"
BASE_URL="${1:-https://chat.rollomax.at}"
SESSION_ID="test-$(date +%s)"

echo ""
echo "=== RolloMax Chatbot Webhook Test ==="
echo "URL: $BASE_URL"
echo "Session: $SESSION_ID"
echo ""

# Test 1: Normaler Chat
echo "--- Test 1: Normaler Chat (Rolllaeden) ---"
curl -s -X POST "$BASE_URL/webhook/chat" \
  -H "Content-Type: application/json" \
  -H "X-Widget-Token: $TOKEN" \
  -H "X-Session-ID: $SESSION_ID" \
  -d "{
    \"session_id\": \"00000000-0000-0000-0000-$(printf '%012d' $RANDOM)\",
    \"message\": \"Welche Rolllaeden bietet ihr an?\",
    \"consent\": true,
    \"page_url\": \"https://rollomax.at\"
  }" | python3 -m json.tool 2>/dev/null || echo "(Rohantwort:)" && \
curl -s -X POST "$BASE_URL/webhook/chat" \
  -H "Content-Type: application/json" \
  -H "X-Widget-Token: $TOKEN" \
  -H "X-Session-ID: $SESSION_ID" \
  -d "{\"session_id\":\"00000000-0000-0000-0000-$(printf '%012d' $RANDOM)\",\"message\":\"Welche Rolllaeden bietet ihr an?\",\"consent\":true,\"page_url\":\"https://rollomax.at\"}"

echo ""
echo ""

# Test 2: Off-topic (sollte abgelehnt werden)
echo "--- Test 2: Off-topic (sollte abgelehnt werden) ---"
curl -s -X POST "$BASE_URL/webhook/chat" \
  -H "Content-Type: application/json" \
  -H "X-Widget-Token: $TOKEN" \
  -H "X-Session-ID: $SESSION_ID" \
  -d "{\"session_id\":\"00000000-0000-0000-0000-$(printf '%012d' $RANDOM)\",\"message\":\"Wie wird das Wetter morgen?\",\"consent\":true,\"page_url\":\"https://rollomax.at\"}"

echo ""
echo ""

# Test 3: Falscher Token (sollte 500 zurueckgeben)
echo "--- Test 3: Falscher Token (sollte Fehler geben) ---"
curl -s -X POST "$BASE_URL/webhook/chat" \
  -H "Content-Type: application/json" \
  -H "X-Widget-Token: falscher-token" \
  -H "X-Session-ID: $SESSION_ID" \
  -d "{\"session_id\":\"test\",\"message\":\"Test\",\"consent\":true,\"page_url\":\"https://rollomax.at\"}"

echo ""
echo ""
echo "=== Tests abgeschlossen ==="
