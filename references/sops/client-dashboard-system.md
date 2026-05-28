# SOP: Client Dashboard & Control System

> Komplettes System für Kunden-Dashboards mit Buchungs-Tracking, WhatsApp-Proxy und Provisionsberechnung.
> **Pilot:** Studio Petra | **Stand:** April 2026

---

## ÜBERSICHT: Zwei System-Varianten

| Variante | Beschreibung | Use Case |
|----------|--------------|----------|
| **Standard** | Einfaches Buchungs-Dashboard, Cal.com direkt | Kunden die selbst bestätigen können |
| **OCS (Omnix Control System)** | Bestätigungs-Flow, WhatsApp-Proxy, Provisionen | Kunden die Kontrolle über jede Buchung wollen |

---

## VARIANTE 1: STANDARD DASHBOARD

### Architektur

```
Klient bucht via Cal.com Widget
        │
        ▼
Cal.com Webhook ──► n8n ──► PostgreSQL
                            │
                            ▼
                    Dashboard (Vercel)
                    zeigt Buchungen an
```

### Komponenten

1. **Cal.com** - Buchungssystem (direkte Bestätigung)
2. **n8n Booking Notification** - Webhook empfangen, DB schreiben, Benachrichtigen
3. **n8n Dashboard API** - GET Endpoint für Buchungsdaten
4. **PostgreSQL** - `kundenname_bookings` Tabelle
5. **Lovable → Vercel** - Frontend Dashboard

### Setup-Checkliste

```
□ Cal.com Account & Event Types einrichten
□ PostgreSQL Tabelle erstellen
□ n8n Booking Notification Workflow
□ n8n Dashboard API Workflow (OHNE Auth!)
□ Lovable Dashboard erstellen
□ Vercel Deploy
```

### n8n Dashboard API (4 Nodes, KEINE Auth)

```
Webhook (GET) → PostgreSQL (SELECT) → Code (Format) → Respond (CORS: *)
```

**Kritisch:**
- KEINE API Key Auth Node
- CORS Header: `Access-Control-Allow-Origin: *`
- `onError: continueRegularOutput`, `alwaysOutputData: true`

### Debugging "API nicht erreichbar"

```bash
curl https://n8n.srv1490532.hstgr.cloud/webhook/kundenname-api
```

| Response | Problem | Lösung |
|----------|---------|--------|
| Leer | Workflow nicht aktiv | Aktivieren in n8n |
| "Unauthorized" | API Key Auth aktiv | Auth Node entfernen |
| CORS Error | Header fehlt | Respond Node prüfen |

---

## VARIANTE 2: OCS (OMNIX CONTROL SYSTEM)

### Für wen?

Kunden wie **Petra** die:
- Jede Buchung selbst bestätigen wollen
- Keine direkten Cal.com Buchungen erlauben
- Provisionsberechnung brauchen
- WhatsApp-Kommunikation tracken wollen

### Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     KLIENTEN (Endkunden)                     │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
    📞 Anruf          💬 WhatsApp        📅 Buchung
       │                  │                  │
┌──────▼──────────────────▼──────────────────▼────────────────┐
│              TELNYX NUMMER (pro Kunde)                       │
│         Eine Nummer = Anrufe + WhatsApp + SMS                │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
┌──────▼──────────────────▼──────────────────▼────────────────┐
│                        VPS (EU, DSGVO)                       │
│                                                              │
│   n8n Workflows:                                             │
│   - Call Handler (Telnyx Call Control)                       │
│   - WhatsApp Proxy (Telnyx → WAHA → Telnyx)                 │
│   - Booking Handler (Formular → Bestätigung → Cal.com)       │
│   - Dashboard API                                            │
│   - Commission Calculator                                    │
│                                                              │
│   PostgreSQL:                                                │
│   - ocs_clients, ocs_client_customers                        │
│   - ocs_bookings, ocs_whatsapp_messages                      │
│   - ocs_commissions, ocs_activity_log                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    OCS DASHBOARD                             │
│   - Alle Anrufe, Messages, Bookings                          │
│   - Provisionsberechnung                                     │
│   - Klienten-Übersicht                                       │
└─────────────────────────────────────────────────────────────┘
```

### Die 3 Kontrollkanäle

#### Kanal 1: Telefon (Telnyx Call Control)
- Klient ruft Telnyx-Nummer an
- DSGVO-Consent, Recording, Transkript
- Weiterleitung an Kundens echte Nummer

#### Kanal 2: WhatsApp Proxy (Telnyx WhatsApp Business API)
- Klient schreibt an Telnyx-Nummer
- System leitet an Kunde weiter (via WAHA)
- Kunde antwortet mit @TAG
- System sendet an Klient zurück

#### Kanal 3: Terminbuchungen (Bestätigungs-Flow)
- Klient füllt Website-Formular aus
- System speichert als PENDING
- Kunde bekommt WhatsApp: `JA 42` / `NEIN 42` / `VERSCHIEBEN 42`
- Bei JA: Cal.com Booking wird erstellt

---

### Der Buchungs-Bestätigungs-Flow

```
1. KLIENT BUCHT (Website-Formular)
   ┌─────────────────────────────────────────┐
   │  Name, Telefon, E-Mail                   │
   │  Service (Dropdown)                      │
   │  Wunschtermin (Datum + Uhrzeit)          │
   │  [Termin anfragen]                       │
   └──────────────────┬──────────────────────┘
                      ▼
2. n8n EMPFÄNGT
   - Speichert in DB: status = 'PENDING'
   - Generiert Ref-Code: BP-0042
                      ▼
3. KUNDE BEKOMMT WHATSAPP
   ┌─────────────────────────────────────────┐
   │  📋 Neue Terminanfrage [#BP-0042]       │
   │                                          │
   │  👤 Anna Müller                          │
   │  📞 +43 660 123 4567                     │
   │  🏋️ InfraTrainer (35€)                  │
   │  📅 Mo, 15.04. um 14:30                  │
   │                                          │
   │  Antworten:                              │
   │  ✅ JA 42                                │
   │  ❌ NEIN 42                              │
   │  🔄 VERSCHIEBEN 42                       │
   └──────────────────┬──────────────────────┘
                      ▼
4. KUNDE ANTWORTET: "JA 42"
                      ▼
5. SYSTEM VERARBEITET
   - JA → Cal.com Booking erstellen
        → Klient bekommt Bestätigung
        → DB: status = 'CONFIRMED'
   
   - NEIN → Absage an Klient
          → DB: status = 'REJECTED'
   
   - VERSCHIEBEN → Alternativtermin anfragen
                 → DB: status = 'RESCHEDULE_REQUESTED'
```

---

### Database Schema (OCS)

```sql
-- Kunden (Raphaels direkte Kunden)
CREATE TABLE ocs_clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    whatsapp_chat_id VARCHAR(50),
    telnyx_number VARCHAR(20),
    calcom_api_key VARCHAR(200),
    calcom_event_type_ids JSONB,
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    services JSONB,  -- [{"name": "InfraTrainer", "price": 35}, ...]
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klienten (Endkunden der Kunden)
CREATE TABLE ocs_client_customers (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES ocs_clients(id),
    name VARCHAR(200),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(200),
    tag VARCHAR(20) NOT NULL,  -- "ANNA-M" für Routing
    total_bookings INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    UNIQUE(client_id, phone),
    UNIQUE(client_id, tag)
);

-- Terminbuchungen
CREATE TABLE ocs_bookings (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES ocs_clients(id),
    customer_id INT REFERENCES ocs_client_customers(id),
    ref_code VARCHAR(20) UNIQUE NOT NULL,  -- "BP-0042"
    service_name VARCHAR(100) NOT NULL,
    service_price DECIMAL(10,2),
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    -- PENDING → CONFIRMED | REJECTED | RESCHEDULE_REQUESTED
    -- CONFIRMED → COMPLETED | CANCELLED | NO_SHOW
    calcom_booking_uid VARCHAR(100),
    commission_amount DECIMAL(10,2),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provisionen (monatlich)
CREATE TABLE ocs_commissions (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES ocs_clients(id),
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    total_bookings INT DEFAULT 0,
    completed_bookings INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    invoice_id VARCHAR(50),  -- Runple
    UNIQUE(client_id, period_year, period_month)
);

-- WhatsApp-Nachrichten
CREATE TABLE ocs_whatsapp_messages (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES ocs_clients(id),
    customer_id INT REFERENCES ocs_client_customers(id),
    direction VARCHAR(10) NOT NULL,  -- 'inbound' | 'outbound'
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log
CREATE TABLE ocs_activity_log (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES ocs_clients(id),
    customer_id INT REFERENCES ocs_client_customers(id),
    event_type VARCHAR(50) NOT NULL,
    -- CALL_INBOUND, WA_MESSAGE_IN, WA_MESSAGE_OUT,
    -- BOOKING_REQUESTED, BOOKING_CONFIRMED, BOOKING_REJECTED,
    -- BOOKING_COMPLETED, BOOKING_CANCELLED
    summary TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### n8n Workflows (OCS)

| # | Workflow | Trigger | Funktion |
|---|----------|---------|----------|
| 1 | WA Proxy Inbound | Telnyx Webhook | Klient → System → Kunde |
| 2 | WA Proxy Outbound | WAHA Webhook | Kunde → System → Klient |
| 3 | Booking Request | HTTP Webhook | Neue Anfrage verarbeiten |
| 4 | Booking Response | Aus WA Outbound | JA/NEIN/VERSCHIEBEN |
| 5 | Call Event Bridge | call-tracking-api | Anrufe ins OCS |
| 6 | Commission Calculator | Cron (monatlich) | Provisionen berechnen |
| 7 | Dashboard API | HTTP Endpoints | Daten für Dashboard |

---

### WhatsApp Fan-Out Lösung

**Problem:** Alle Klienten schreiben an EINE Nummer. Wie routet man Antworten?

**Lösung: Tag-System**

```
Eingehend an Kunde:
"📩 [ANNA-M] schreibt:
Hallo, ich möchte einen Termin.

↩️ @ANNA-M deine Antwort"

Kunde antwortet:
"@ANNA-M Ja gerne, wann passt es?"
→ System routet an Anna
```

**Spezial-Befehle:**
| Befehl | Funktion |
|--------|----------|
| `?` | Alle aktiven Konversationen |
| `@NAME text` | Nachricht an Klient |
| `JA 42` | Booking bestätigen |
| `NEIN 42` | Booking ablehnen |
| `VERSCHIEBEN 42` | Booking verschieben |

---

### Provisions-Engine

```
Provision pro Booking = Service-Preis × Provisions-Rate

Beispiel Studio Petra (20%):
- InfraTrainer: 35€ × 20% = 7€
- Sugaring: 45€ × 20% = 9€

Monatliche Provision = Summe aller CONFIRMED/COMPLETED Bookings
```

---

### OCS Setup-Checkliste

```
PHASE 0: Foundation
□ SQL Migration ausführen (alle ocs_* Tabellen)
□ Client in ocs_clients anlegen
□ Services + Preise konfigurieren

PHASE 1: WhatsApp Proxy
□ Telnyx-Nummer kaufen
□ WhatsApp Business API aktivieren
□ n8n Inbound Workflow
□ n8n Outbound Workflow
□ Tag-Routing testen

PHASE 2: Booking System
□ Booking-Formular (Website-Widget)
□ n8n Booking Request Workflow
□ n8n Booking Response Workflow
□ Cal.com API v2 Integration
□ Bestätigungs-Flow testen

PHASE 3: Dashboard
□ Next.js/Lovable Dashboard
□ API Endpoints
□ Provisionen-Seite
□ Vercel Deploy

PHASE 4: Go-Live
□ Telnyx-Nummer auf Website
□ Booking-Formular einbetten
□ Kunde einweisen
□ Monitoring aktivieren
```

---

## REFERENZ: Aktive Dashboards

| Kunde | Variante | API | Dashboard URL |
|-------|----------|-----|---------------|
| Ursula | Standard | /webhook/kremplerei-api | kremplerei-dashboard.vercel.app |
| Christine | Standard | /webhook/prettywomen-api | pretty-woman-dashboard.vercel.app |
| Petra | OCS | /webhook/petra-api (TODO) | petra-dashboard.vercel.app (TODO) |

---

## LESSONS LEARNED

### Fehler: API Key Auth im Dashboard-API

**Problem (10.04.2026 Christine):**
Dashboard-API hatte API Key Auth Node → Frontend konnte nicht zugreifen → "API nicht erreichbar"

**Lösung:**
API Key Auth Node entfernen. Dashboard-APIs sind Read-Only, öffentlich mit CORS ist ok.

**Merke:**
- Ursula's API = Referenz für funktionierendes Setup
- Dashboards: KEINE Auth, nur CORS Header
- Webhook direkt → PostgreSQL → Format → Respond

---

_Erstellt: 10.04.2026_
_Basierend auf: MASTERPLAN.md + Christine Fix_
