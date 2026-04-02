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
{"reply":"...","intent":"...","lead_data":null,"should_notify_team":false,"urgency":"low","show_product_card":null,"show_actions":[]}
<<<END_RESPONSE_JSON>>>
```

Fallback 1: Legacy `<!--LEAD:...-->` Format
Fallback 2: Plain-Text als reply mit intent "general"

Neue Felder (v2):
- `show_product_card`: Objekt mit type, title, description, url, image
- `show_actions`: Array mit booking, whatsapp, configurator

## Datenbank-Migrationen

Reihenfolge: 001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007 -> 008
- 001: Tabellen erstellen (chat_sessions, chat_messages, leads, knowledge_base)
- 002: RLS-Policies
- 003: Auto-Delete Cron (DSGVO)
- 004: FAQ-Eintraege (12 neue)
- 005: Schema-Erweiterungen (intent, source_type, urgency, message_count trigger)
- 006: Analytics Views (v_daily_stats, v_lead_pipeline, v_button_analytics, v_button_to_lead)
- 007: Premium Features (message_feedback, session_feedback, uploaded_images, ab_experiments, ab_assignments, analytics_events)
- 008: Weekly Insights + Lead Collection Step (lead_collection_step, collected_lead_data, Weekly Analytics Views)

## N8N Workflows (7 Stueck)

1. **RolloMax Chat** - Haupt-Chat mit Intent Detection, Lead-Tracking, Urgency Alerts, Multi-Language, Product Cards, 6-Schritte Lead-Flow
2. **RolloMax Delete Session** - DSGVO Session-Loeschung
3. **RolloMax Daily Digest** - Taeglicher Bericht um 09:00 (Sessions, Leads, Button-Analytics)
4. **RolloMax Image Upload** - Bild-Upload mit Claude Vision (Fenster-Analyse)
5. **RolloMax Feedback** - Message/Session Feedback speichern
6. **RolloMax Analytics Track** - Analytics Events und A/B Assignments
7. **RolloMax Weekly Insights** - Woechentlicher Marketing-Report (Montag 09:00) mit Top-Themen, Trends, Feedback, Lead-Funnel

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

## Premium Features (v2)

### Widget Features
- Bot Avatar im Header (32x32px, Fallback "R")
- "RolloMax tippt..." Typing Indicator
- Daumen hoch/runter Feedback unter Bot-Messages
- Sound Toggle (opt-in, localStorage)
- Session Feedback Popup (5 Sterne nach 2min Inaktivitaet)
- Bild-Upload mit Claude Vision Analyse
- Produktkarten (Rollladen, Raffstore, Markise)
- Action Buttons (Termin buchen, WhatsApp, Konfigurator)
- Cal.com Terminbuchung Modal
- Step-by-Step Konfigurator
- WhatsApp Handover (+43 650 990 75 99)
- Proaktive Nachrichten mit A/B Testing (4 Varianten)

### Supabase Tabellen (Migration 007)
- message_feedback: Daumen hoch/runter pro Message
- session_feedback: Sterne-Rating am Chat-Ende
- uploaded_images: Fenster-Fotos mit Claude-Analyse
- ab_experiments: A/B Test Definitionen
- ab_assignments: User-zu-Variante Zuordnung
- analytics_events: Alle Widget-Events

### Analytics Views
- v_ab_test_results: Conversion Rate pro A/B Variante
- v_feature_usage: Feature-Nutzung letzte 30 Tage
- v_funnel_analysis: Chat -> Engaged -> Lead -> Booking
- v_feedback_summary: Positive/Negative Feedback Rate

### Weekly Insights Views (Migration 008)
- v_weekly_top_topics: Top 20 Keywords/Themen der Woche
- v_weekly_intent_distribution: Intent-Verteilung mit Prozentanteilen
- v_weekly_abandoned_sessions: Abbruch-Rate (Sessions <3 Messages ohne Lead)
- v_weekly_trend_comparison: Vergleich diese Woche vs. letzte Woche
- v_weekly_feedback_score: Zufriedenheit (Thumbs + Sterne)
- v_weekly_lead_funnel: Lead-Erfassungs-Fortschritt pro Schritt
- v_weekly_product_interest: Produkt-Interesse nach Urgency

### Lead Collection (6-Schritte-Flow)
Session-State in chat_sessions:
- lead_collection_step: 0-6 (aktueller Schritt)
- collected_lead_data: JSON mit erfassten Feldern

Schritte:
1. Produkt (Rollladen, Markise, Jalousie, etc.)
2. Standort (PLZ/Bezirk)
3. Privat oder Firma
4. Projektart (Neubau/Nachruestung/Reparatur)
5. Umfang (Anzahl Fenster/Flaeche)
6. Kontaktdaten (Name + Telefon/E-Mail)
