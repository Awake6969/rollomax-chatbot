# RolloMax KI-Chatbot

## Architektur

- **Backend:** N8N Workflow auf Hostinger VPS (n8n.omnixstudio.at)
- **AI:** Claude API (Anthropic, claude-sonnet-4-6) mit strukturiertem JSON-Output
- **Datenbank:** Supabase (Chat-Verlauf, Leads, Knowledge Base, Analytics)
- **Reverse Proxy:** Caddy 2 (Auto-SSL, CORS, Static Files)
- **Frontend:** Vanilla JS Widget mit Shadow DOM (widget/rollomax-chat-widget.js)
- **Domain:** chat.rollomax.at

## Wichtige Konventionen

- KEINE Emojis, KEINE Em-Dashes im gesamten Output
- Sie-Form in allen Texten (oesterreichisches Deutsch)
- Minimum 44px Touch-Targets, minimum 16px Font-Size
- Smooth easing only (keine bounce/spring Animationen)
- Alle Farben via CSS Custom Properties

## Claude API Response Format

Der Bot gibt strukturiertes JSON zurueck (Delimiter-Hybrid):
```
<<<RESPONSE_JSON>>>
{"reply":"...","intent":"...","lead_data":null,"should_notify_team":false,"urgency":"low"}
<<<END_RESPONSE_JSON>>>
```

Fallback 1: Legacy `<!--LEAD:...-->` Format
Fallback 2: Plain-Text als reply mit intent "general"

## Datenbank-Migrationen

Reihenfolge: 001 -> 002 -> 003 -> 004 -> 005 -> 006
- 001: Tabellen erstellen (chat_sessions, chat_messages, leads, knowledge_base)
- 002: RLS-Policies
- 003: Auto-Delete Cron (DSGVO)
- 004: FAQ-Eintraege (12 neue)
- 005: Schema-Erweiterungen (intent, source_type, urgency, message_count trigger)
- 006: Analytics Views (v_daily_stats, v_lead_pipeline, v_button_analytics, v_button_to_lead)

## N8N Workflows (3 Stueck)

1. **RolloMax Chat** - Haupt-Chat mit Intent Detection, Lead-Tracking, Urgency Alerts
2. **RolloMax Delete Session** - DSGVO Session-Loeschung
3. **RolloMax Daily Digest** - Taeglicher Bericht um 09:00 (Sessions, Leads, Button-Analytics)

## Widget Fonts

Self-hosted via Caddy in widget/fonts/:
- Playfair Display Bold (Headlines)
- DM Sans (Body, Variable Font 100-900)

## Deployment

```bash
cd /opt/rollomax-chatbot
./scripts/deploy.sh  # git pull + docker compose restart
```

Supabase-Migrationen manuell im SQL Editor ausfuehren.
