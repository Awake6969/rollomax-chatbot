# SOP: Kunden-Dashboard Setup

> Anleitung zum Erstellen von Buchungs-Dashboards mit Lovable, n8n und Vercel.

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        KUNDEN-DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Frontend (Vercel)              Backend (n8n)                   │
│   ─────────────────              ──────────────                  │
│                                                                  │
│   Lovable erstellt    ───►    GitHub Repo    ───►    Vercel     │
│   React/Vite App              (Auto-Sync)         (Auto-Deploy)  │
│                                                                  │
│         │                                                        │
│         │ fetch()                                                │
│         ▼                                                        │
│                                                                  │
│   n8n Webhook API     ◄───    PostgreSQL                        │
│   /webhook/xyz-api            (Buchungsdaten)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Drei Komponenten:**
1. **Frontend** - React App in Lovable gebaut, über GitHub nach Vercel deployed
2. **Backend API** - n8n Webhook der Daten aus PostgreSQL liest
3. **Datenbank** - PostgreSQL auf dem VPS mit Buchungstabelle

---

## Schritt 1: PostgreSQL Tabelle erstellen

```sql
CREATE TABLE IF NOT EXISTS kundenname_bookings (
    booking_uid VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(50),
    attendee_name VARCHAR(255),
    attendee_email VARCHAR(255),
    attendee_phone VARCHAR(50),
    treatment VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Namenskonvention:** `kundenname_bookings` (lowercase, underscore)

---

## Schritt 2: n8n Dashboard-API Workflow

### Workflow-Struktur (4 Nodes, KEINE Auth)

```
1. Webhook (GET /webhook/kundenname-api)
       │
       ▼
2. PostgreSQL (SELECT * FROM kundenname_bookings)
       │
       ▼
3. Code Node (Format Response)
       │
       ▼
4. Respond to Webhook (JSON + CORS Header)
```

### Node-Konfiguration

**Node 1: Webhook**
```json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "kundenname-api",
    "httpMethod": "GET",
    "responseMode": "responseNode"
  }
}
```

**Node 2: PostgreSQL**
```json
{
  "type": "n8n-nodes-base.postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "SELECT booking_uid, event_type, attendee_name, attendee_email, attendee_phone, treatment, to_char(start_time AT TIME ZONE 'Europe/Berlin', 'DD.MM.YYYY, HH24:MI Uhr') AS start_time_formatted, to_char(end_time AT TIME ZONE 'Europe/Berlin', 'HH24:MI Uhr') AS end_time_formatted, location, notes, updated_at AS created_at FROM kundenname_bookings ORDER BY updated_at DESC LIMIT 200"
  },
  "credentials": {
    "postgres": { "id": "r0ksP01lgNVGzGXM", "name": "Pretty WoMen PostgreSQL" }
  },
  "onError": "continueRegularOutput",
  "alwaysOutputData": true
}
```

**Node 3: Code (Format Response)**
```javascript
const items = $input.all();

const bookings = items
    .filter(item => item.json && item.json.booking_uid)
    .map(item => {
        const d = item.json;
        return {
            booking_uid: d.booking_uid || '',
            event_type: d.event_type || '',
            name: d.attendee_name || '',
            email: d.attendee_email || '',
            phone: d.attendee_phone || '',
            treatment: d.treatment || '',
            start_time: d.start_time_formatted || '',
            end_time: d.end_time_formatted || '',
            location: d.location || '',
            notes: d.notes || '',
            created_at: d.created_at || ''
        };
    });

const total = bookings.length;
const cancelled = bookings.filter(b => b.event_type === 'BOOKING_CANCELLED').length;
const treatments = {};
bookings.forEach(b => {
    if (b.treatment && b.event_type !== 'BOOKING_CANCELLED') {
        treatments[b.treatment] = (treatments[b.treatment] || 0) + 1;
    }
});
const topTreatment = Object.entries(treatments).sort((a,b) => b[1] - a[1])[0];

return [{
    json: {
        success: true,
        stats: {
            total: total,
            today: 0,
            cancelled: cancelled,
            top_treatment: topTreatment ? topTreatment[0] : 'Keine Buchungen'
        },
        bookings: bookings,
        last_updated: new Date().toISOString()
    }
}];
```

**Node 4: Respond to Webhook**
```json
{
  "type": "n8n-nodes-base.respondToWebhook",
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ $json }}",
    "options": {
      "responseCode": 200,
      "responseHeaders": {
        "entries": [
          { "name": "Access-Control-Allow-Origin", "value": "*" }
        ]
      }
    }
  }
}
```

### Kritische Regeln

| Regel | Warum |
|-------|-------|
| **KEINE API Key Auth Node** | Frontend kann keinen Key senden, führt zu "Unauthorized" |
| **CORS Header setzen** | Browser blockiert sonst Cross-Origin Requests |
| **onError: continueRegularOutput** | Leere Tabelle soll nicht crashen |
| **alwaysOutputData: true** | Immer Response senden, auch bei 0 Ergebnissen |

---

## Schritt 3: Frontend in Lovable

### Prompt-Template

```
Erstelle ein Buchungs-Dashboard für [Kundenname].

**Datenquelle:**
- API: GET https://n8n.srv1490532.hstgr.cloud/webhook/kundenname-api
- Response Format:
  {
    "success": true,
    "stats": { "total": 10, "today": 0, "cancelled": 1, "top_treatment": "..." },
    "bookings": [{ "booking_uid": "...", "name": "...", "treatment": "...", ... }],
    "last_updated": "ISO timestamp"
  }

**Features:**
- Buchungsliste mit Name, Behandlung, Datum, Status
- Stats-Cards: Total, Heute, Storniert, Top-Behandlung
- Auto-Refresh Toggle (alle 30 Sekunden)
- "Aktualisieren" Button
- Mobile-responsive
- Loading State und Error State ("API nicht erreichbar" mit Retry-Button)

**Design:**
- Primärfarbe: [Kundenfarbe, z.B. #E91E63 für Pretty WoMen]
- Clean, minimal, professionell
- Gradient Header
- Cards mit leichten Schatten

**Technisch:**
- React mit TypeScript
- Tailwind CSS
- fetch() für API Calls
- useState/useEffect für State Management
```

---

## Schritt 4: Vercel Deployment

1. **In Lovable:** "Connect to GitHub" oder "Deploy"
2. **GitHub Repo** wird automatisch erstellt
3. **In Vercel:** 
   - "Add New Project"
   - "Import from GitHub"
   - Repo auswählen
   - Framework: Vite (automatisch erkannt)
   - Deploy
4. **Auto-Deploy:** Jeder Push zu GitHub deployed automatisch

---

## Checkliste

```
□ PostgreSQL Tabelle existiert (kundenname_bookings)
□ Booking-Notification Workflow schreibt in diese Tabelle
□ n8n Dashboard-API Workflow erstellt:
    □ Webhook Node (GET, responseMode: responseNode)
    □ PostgreSQL Node (SELECT mit korrekter Tabelle)
    □ Code Node (Format Response)
    □ Respond Node (CORS: Access-Control-Allow-Origin: *)
    □ KEINE API Key Auth Node!
□ Workflow aktiviert (active: true)
□ API Test erfolgreich:
    curl https://n8n.srv1490532.hstgr.cloud/webhook/kundenname-api
    □ Gibt JSON zurück
    □ Nicht leer
    □ Nicht "Unauthorized"
□ Lovable Frontend erstellt
□ GitHub Repo verbunden
□ Vercel deployed
□ Dashboard URL funktioniert
```

---

## Debugging: "API nicht erreichbar"

### 1. API direkt testen

```bash
curl https://n8n.srv1490532.hstgr.cloud/webhook/kundenname-api
```

### 2. Fehler-Diagnose

| Response | Problem | Lösung |
|----------|---------|--------|
| Leer (0 bytes) | Workflow Fehler oder nicht aktiv | n8n UI prüfen, Workflow aktivieren |
| "Unauthorized" | API Key Auth Node aktiv | Node aus Workflow entfernen |
| "Not Found" | Webhook Path falsch | Path in Workflow prüfen |
| JSON aber bookings leer | Tabelle leer oder falscher Tabellenname | SQL Query prüfen |
| CORS Error (im Browser) | CORS Header fehlt | Respond Node Header prüfen |

### 3. n8n Workflow via API prüfen

```bash
N8N_API_KEY="..."
WORKFLOW_ID="..."

# Workflow abrufen
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  https://n8n.srv1490532.hstgr.cloud/api/v1/workflows/$WORKFLOW_ID

# Prüfen auf:
# - "active": true
# - Keine "API Key Auth" Node in "nodes" Array
# - Connections: Webhook → PostgreSQL → Format → Respond
```

### 4. Workflow ohne Auth fixen (via API)

Falls API Key Auth Node vorhanden, Workflow updaten:

```bash
curl -X PUT "https://n8n.srv1490532.hstgr.cloud/api/v1/workflows/$WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @workflow-ohne-auth.json
```

---

## Referenz: Aktive Dashboards

| Kunde | API Endpoint | Tabelle | Vercel URL |
|-------|--------------|---------|------------|
| Ursula (Kremplerei) | /webhook/kremplerei-api | kremplerei_bookings | kremplerei-dashboard.vercel.app |
| Christine (Pretty WoMen) | /webhook/prettywomen-api | prettywomen_bookings | pretty-woman-dashboard.vercel.app |

Diese nutzen identische Architektur - als Template verwendbar.

---

## Häufiger Fehler: API Key Auth

**Problem vom 10.04.2026 (Christine):**

Der Workflow hatte eine zusätzliche Auth Node:
```
FALSCH:  Webhook → API Key Auth → PostgreSQL → Format → Respond
RICHTIG: Webhook → PostgreSQL → Format → Respond
```

Die Auth Node erwartete einen Header `x-api-key` den das Lovable-Frontend nicht sendet.

**Lösung:** Auth Node entfernen, API öffentlich machen (wie Ursula).

**Merke:** Dashboards sind öffentliche Read-Only APIs. Auth ist nicht nötig da nur Buchungsdaten angezeigt werden, keine sensiblen Aktionen möglich sind.

---

_Erstellt: 2026-04-10_
_Basierend auf: Christine Pretty WoMen Dashboard Fix_
