# Lovable Prompt: RolloMax Analytics Dashboard

Kopiere diesen Prompt in Lovable und lass dir das Dashboard bauen.

---

## PROMPT START

Baue mir ein modernes, professionelles Analytics Dashboard für einen KI-Chatbot.

### Projekt-Kontext

Ich betreibe einen KI-Chatbot für RolloMax (Sonnenschutz-Firma in Wien). Der Chatbot läuft auf meinem eigenen VPS mit:
- N8N als Backend/API
- PostgreSQL als Datenbank
- Die API-Basis-URL ist: `https://chat.rollomax.at`

Das Dashboard soll KEIN eigenes Backend haben. Es ruft nur API-Endpoints auf meinem VPS ab (ich baue die Endpoints in N8N selbst).

### Design-Vorgaben

**Markenfarben:**
- Primär (Orange): #E85D04
- Sekundär (Dunkelgrau): #2D3748
- Hintergrund: #F7FAFC (helles Grau)
- Karten-Hintergrund: #FFFFFF
- Text: #1A202C (fast schwarz)
- Muted Text: #718096

**Schriften:**
- Headlines: Playfair Display (Google Fonts)
- Body: DM Sans (Google Fonts)

**Style:**
- Clean, minimalistisch
- Keine Emojis
- Abgerundete Ecken (12px für Karten, 8px für Buttons)
- Sanfte Schatten
- Smooth Animationen (ease-out, keine bounce)

### Seiten-Struktur

**1. Dashboard (Startseite)**

Header mit:
- Logo-Bereich links (Text "RolloMax" in Playfair Display)
- Datum/Uhrzeit rechts
- Navigation: Dashboard | Conversations | Analytics | (später: CRM | Konfigurator)

KPI-Karten oben (4 Stück nebeneinander):
- "Heute" - Anzahl Sessions heute
- "Diese Woche" - Anzahl Sessions diese Woche
- "Nachrichten" - Gesamte Nachrichten heute
- "Avg. Dauer" - Durchschnittliche Session-Dauer

Darunter zwei Spalten:
- Links (breit): Line-Chart "Sessions pro Tag" (letzte 14 Tage)
- Rechts (schmal): Pie-Chart "Top Intents" (general, price_inquiry, appointment, etc.)

Darunter:
- Tabelle "Letzte Gespräche" mit Spalten:
  - Zeit (relativ: "vor 5 Min")
  - Erste Nachricht (gekürzt)
  - Nachrichten-Anzahl
  - Intent
  - Button "Ansehen"

**2. Conversations (Gesprächsverlauf)**

Suchfeld oben mit Filter:
- Datum-Range Picker
- Intent-Dropdown
- Nur mit Lead-Daten (Toggle)

Liste aller Sessions (links, scrollbar):
- Karte pro Session mit:
  - Datum/Uhrzeit
  - Erste User-Nachricht (Preview)
  - Badge mit Nachrichten-Anzahl
  - Intent-Tag (farbcodiert)

Detail-Ansicht (rechts):
- Wenn Session ausgewählt: Chat-Verlauf anzeigen
- User-Nachrichten links (grau)
- Bot-Nachrichten rechts (orange/primär)
- Zeitstempel unter jeder Nachricht
- Oben: Session-Metadaten (Dauer, Page URL, User Agent)

**3. Analytics (Detaillierte Auswertung)**

Zeitraum-Picker oben (Heute, 7 Tage, 30 Tage, Custom)

Charts:
- Line: Nachrichten pro Stunde (24h Verteilung)
- Bar: Sessions pro Wochentag
- Pie: Intent-Verteilung
- Bar: Top 10 Fragen (häufigste User-Nachrichten)

Tabellen:
- Button-Klicks (welche Buttons wurden wie oft geklickt)
- Conversion Funnel: Session gestartet -> Frage gestellt -> Lead generiert

**4. Platzhalter-Seiten (für später)**

- CRM: Zeige "Coming Soon - CRM Integration" mit grauem Hintergrund
- Konfigurator: Zeige "Coming Soon - Konfigurator Analytics" mit grauem Hintergrund

### API-Struktur (ich baue diese Endpoints)

Das Dashboard soll diese Endpoints aufrufen:

```
GET /api/dashboard/stats
Response: {
  "today_sessions": 12,
  "week_sessions": 87,
  "today_messages": 156,
  "avg_duration_minutes": 4.2
}

GET /api/dashboard/sessions?limit=20&offset=0
Response: {
  "sessions": [
    {
      "id": "uuid",
      "created_at": "2026-03-31T10:15:00Z",
      "message_count": 8,
      "first_message": "Was kosten Rollläden?",
      "last_activity": "2026-03-31T10:22:00Z",
      "primary_intent": "price_inquiry"
    }
  ],
  "total": 245
}

GET /api/dashboard/session/{id}
Response: {
  "id": "uuid",
  "created_at": "2026-03-31T10:15:00Z",
  "metadata": { "page_url": "...", "user_agent": "..." },
  "messages": [
    { "role": "user", "content": "...", "created_at": "...", "intent": null },
    { "role": "assistant", "content": "...", "created_at": "...", "intent": "price_inquiry" }
  ]
}

GET /api/dashboard/analytics?period=7d
Response: {
  "sessions_per_day": [
    { "date": "2026-03-25", "count": 15 },
    ...
  ],
  "messages_per_hour": [
    { "hour": 0, "count": 5 },
    { "hour": 1, "count": 2 },
    ...
  ],
  "intent_distribution": [
    { "intent": "general", "count": 120 },
    { "intent": "price_inquiry", "count": 85 },
    ...
  ],
  "top_questions": [
    { "question": "Was kosten Rollläden?", "count": 23 },
    ...
  ]
}
```

### Technische Anforderungen

- React mit TypeScript
- Tailwind CSS für Styling
- Recharts oder Chart.js für Diagramme
- React Router für Navigation
- Tanstack Query (React Query) für API-Calls
- Date-fns für Datum-Formatierung
- Responsive Design (Mobile, Tablet, Desktop)

### API-Konfiguration

Die API-Base-URL soll über eine Environment Variable konfigurierbar sein:
```
VITE_API_URL=https://chat.rollomax.at
```

Alle API-Calls sollen einen Auth-Header senden:
```
Authorization: Bearer {token}
```
Token kommt aus Environment Variable: `VITE_API_TOKEN`

### Error Handling

- Bei API-Fehlern: Toast-Notification anzeigen
- Bei 401: Redirect zu Login-Seite (baue simple Login-Seite mit Token-Eingabe)
- Loading States: Skeleton-Loader für Karten und Tabellen

### Responsive Breakpoints

- Mobile: < 640px (Karten untereinander, Navigation als Hamburger)
- Tablet: 640px - 1024px (2 Karten nebeneinander)
- Desktop: > 1024px (4 Karten nebeneinander, Sidebar-Navigation)

### Zusätzliche Features

1. Dark Mode Toggle (im Header)
2. Export-Button für Tabellen (CSV)
3. Refresh-Button für Live-Daten
4. Relative Zeitangaben ("vor 5 Minuten") mit Tooltip für exaktes Datum

## PROMPT ENDE

---

## Notizen für dich (nicht Teil des Prompts)

Nach dem Lovable-Build musst du noch:

1. **N8N Endpoints bauen** - Ich erstelle dir die Workflow-Vorlagen dafür
2. **Environment Variables setzen** in Vercel:
   - `VITE_API_URL=https://chat.rollomax.at`
   - `VITE_API_TOKEN=<dein-token>`
3. **CORS in Caddy konfigurieren** für die Dashboard-Domain

Sag mir Bescheid wenn du den Lovable-Output hast, dann helfe ich beim API-Teil.
