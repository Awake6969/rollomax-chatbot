# CRM Integration Plan

## Uebersicht

Vollstaendige CRM-Integration fuer RolloMax zur Lead-Verwaltung, Pipeline-Tracking und Marketing-Attribution. Aufbauend auf der definierten CRM-MVP-Struktur (22 Felder).

**Status:** Geplant - Upsell-Feature
**Erstellt:** 2026-03-31
**Basis-Dokument:** docs/CRM-MVP-STRUKTUR.md

---

## 1. Systemarchitektur

### 1.1 Komponenten-Uebersicht

```
                    +-------------------+
                    |   RolloMax.at     |
                    |   (WordPress)     |
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
     +--------+----+  +------+------+  +----+--------+
     |  Chatbot    |  | Konfigurator |  | Kontakt-   |
     |  Widget     |  |    App       |  | Formular   |
     +--------+----+  +------+------+  +----+--------+
              |              |              |
              +--------------+--------------+
                             |
                             v
                    +--------+----------+
                    |    N8N Workflow   |
                    |  (Lead-Router)    |
                    +--------+----------+
                             |
                             v
                    +--------+----------+
                    |    Supabase       |
                    |   crm_leads       |
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
     +--------+----+  +------+------+  +----+--------+
     |  CRM        |  | E-Mail      |  | Analytics  |
     |  Dashboard  |  | Automation  |  | Dashboard  |
     +-------------+  +-------------+  +-------------+
```

### 1.2 Datenfluss

1. **Lead-Erfassung** (Multi-Channel)
   - Chatbot: Intent-basierte Lead-Erkennung
   - Konfigurator: Formular nach Preiskalkulation
   - Kontaktformular: Direkte Anfrage
   - Telefon: Manuelle Erfassung

2. **Lead-Anreicherung**
   - UTM-Parameter aus URL
   - Google Click ID (gclid)
   - Geraeteltyp, Browser
   - Gespraechsverlauf (Chatbot)
   - Konfiguration (Konfigurator)

3. **Lead-Routing**
   - Hot Leads: Sofortige Benachrichtigung
   - Warm Leads: Naechster Arbeitstag
   - Cold Leads: Wochentliche Sammel-E-Mail

4. **Lead-Bearbeitung**
   - Status-Updates im Dashboard
   - Termin-Planung
   - Angebots-Erstellung
   - Follow-up-Tracking

---

## 2. Datenbank-Schema

### 2.1 Haupt-Tabelle: crm_leads

```sql
CREATE TABLE crm_leads (
    -- Identifikation
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Kontaktdaten (Pflichtfelder fuer Hot Lead)
    name TEXT,
    phone TEXT,
    email TEXT,
    
    -- Adresse
    street TEXT,
    postcode TEXT,
    city TEXT DEFAULT 'Wien',
    
    -- Marketing Attribution
    source TEXT,              -- 'google', 'facebook', 'direct', 'chatbot', 'konfigurator'
    medium TEXT,              -- 'cpc', 'organic', 'referral', 'widget'
    campaign TEXT,            -- Kampagnenname
    keyword TEXT,             -- Suchbegriff (Google Ads)
    gclid TEXT,               -- Google Click ID
    landing_page TEXT,        -- Erste besuchte Seite
    referrer TEXT,            -- Vorherige Seite
    
    -- Produktinteresse
    product_interest TEXT,    -- 'rollladen', 'markise', 'raffstore', 'insektenschutz'
    subproduct TEXT,          -- 'vorbau', 'aufsatz', 'solar', 'gelenkarm', etc.
    width_cm NUMERIC,
    height_cm NUMERIC,
    quantity INTEGER,
    drive_type TEXT,          -- 'manual', 'electric', 'solar'
    extras TEXT[],            -- ['insect_screen', 'smart_home']
    
    -- Kalkulation
    estimated_value NUMERIC,
    foerderung_eligible BOOLEAN,
    
    -- Qualifizierung
    lead_type TEXT DEFAULT 'warm',  -- 'hot', 'warm', 'cold'
    lead_score INTEGER DEFAULT 50,  -- 0-100
    
    -- Status-Workflow
    status TEXT DEFAULT 'new',
    -- 'new' -> 'contacted' -> 'qualified' -> 'offer_sent' -> 'negotiation' -> 'won'/'lost'
    status_changed_at TIMESTAMPTZ,
    
    -- Termine
    appointment_requested BOOLEAN DEFAULT FALSE,
    appointment_date TIMESTAMPTZ,
    appointment_type TEXT,     -- 'beratung', 'aufmass', 'montage'
    
    -- Zuordnung
    assigned_to TEXT,          -- Mitarbeiter-Name oder ID
    
    -- Kommunikation
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    next_action TEXT,
    next_action_date DATE,
    
    -- Verknuepfungen
    chat_session_id UUID REFERENCES chat_sessions(id),
    konfigurator_session_id UUID,  -- spaeter: REFERENCES konfigurator_sessions(id)
    
    -- Lost-Grund
    lost_reason TEXT,          -- 'preis', 'konkurrenz', 'kein_bedarf', 'keine_antwort'
    
    -- Constraints
    CONSTRAINT valid_lead_type CHECK (lead_type IN ('hot', 'warm', 'cold')),
    CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'qualified', 'offer_sent', 'negotiation', 'won', 'lost'))
);

-- Indizes fuer Performance
CREATE INDEX idx_leads_status ON crm_leads(status);
CREATE INDEX idx_leads_created ON crm_leads(created_at DESC);
CREATE INDEX idx_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX idx_leads_type ON crm_leads(lead_type);
```

### 2.2 Aktivitaeten-Log

```sql
CREATE TABLE crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(lead_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    activity_type TEXT NOT NULL,
    -- 'note', 'call', 'email', 'meeting', 'status_change', 'assignment'
    
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    created_by TEXT,
    
    CONSTRAINT valid_activity_type CHECK (activity_type IN 
        ('note', 'call', 'email', 'meeting', 'status_change', 'assignment', 'system'))
);

CREATE INDEX idx_activities_lead ON crm_activities(lead_id);
CREATE INDEX idx_activities_created ON crm_activities(created_at DESC);
```

### 2.3 Angebote-Tabelle

```sql
CREATE TABLE crm_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(lead_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    offer_number TEXT UNIQUE,  -- 'ANG-2026-0001'
    
    -- Positionen als JSON
    line_items JSONB,
    -- [{"product": "Vorbaurollladen", "width": 120, "height": 150, "qty": 3, "unit_price": 464, "total": 1392}]
    
    subtotal NUMERIC,
    montage_total NUMERIC,
    travel_cost NUMERIC,
    discount_percent NUMERIC DEFAULT 0,
    total NUMERIC,
    
    -- Foerderung
    foerderung_eligible BOOLEAN,
    foerderung_estimate NUMERIC,
    customer_net NUMERIC,
    
    -- Status
    status TEXT DEFAULT 'draft',
    -- 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'
    
    sent_at TIMESTAMPTZ,
    valid_until DATE,
    accepted_at TIMESTAMPTZ,
    
    notes TEXT
);

CREATE INDEX idx_offers_lead ON crm_offers(lead_id);
```

---

## 3. Lead-Scoring

### 3.1 Scoring-Modell

```javascript
function calculateLeadScore(lead) {
  let score = 50;  // Basis-Score
  
  // Kontaktdaten (+30 max)
  if (lead.phone) score += 15;
  if (lead.email) score += 10;
  if (lead.name) score += 5;
  
  // Produktinteresse (+20 max)
  if (lead.product_interest) score += 5;
  if (lead.width_cm && lead.height_cm) score += 10;
  if (lead.quantity > 1) score += 5;
  
  // Engagement (+20 max)
  if (lead.appointment_requested) score += 15;
  if (lead.chat_session_id) score += 5;
  
  // Wert (+20 max)
  if (lead.estimated_value > 5000) score += 20;
  else if (lead.estimated_value > 2000) score += 10;
  else if (lead.estimated_value > 1000) score += 5;
  
  // Abzuege
  if (!lead.phone && !lead.email) score -= 20;
  
  return Math.min(100, Math.max(0, score));
}
```

### 3.2 Lead-Typ-Zuordnung

| Score | Lead-Typ | Aktion |
|-------|----------|--------|
| 80-100 | Hot | Sofort anrufen (innerhalb 1h) |
| 50-79 | Warm | Am selben/naechsten Tag kontaktieren |
| 0-49 | Cold | In wochentlicher Batch-Mail |

---

## 4. Workflow-Automatisierung (N8N)

### 4.1 Lead-Eingang Workflow

```
[Webhook: /lead-intake]
        |
        v
[Validate & Enrich]
  - UTM-Parameter parsen
  - Lead-Score berechnen
  - Lead-Typ zuordnen
        |
        v
[Insert into crm_leads]
        |
        +---> [Hot Lead?] --Yes--> [Slack Alert]
        |                          [E-Mail an Team]
        |
        +---> [Warm Lead?] --Yes--> [E-Mail Queue]
        |
        +---> [Cold Lead?] --Yes--> [Weekly Digest]
        |
        v
[Log Activity: 'Lead erstellt']
        |
        v
[Response: {lead_id, status}]
```

### 4.2 Status-Update Workflow

```
[Webhook: /lead-status]
        |
        v
[Update crm_leads]
        |
        v
[Log Activity: 'status_change']
        |
        +---> [Status = 'won'?] --Yes--> [Celebration Slack]
        |                                [Update Analytics]
        |
        +---> [Status = 'lost'?] --Yes--> [Log Lost Reason]
        |                                 [Feedback Request?]
        |
        v
[Response: {success}]
```

### 4.3 Daily Digest Workflow

```
[Cron: 09:00 Wien]
        |
        v
[Query: Neue Leads (24h)]
[Query: Offene Hot Leads]
[Query: Ueberfaellige Follow-ups]
[Query: Pipeline-Wert]
        |
        v
[Build E-Mail]
        |
        v
[Send to team@rollomax.at]
```

---

## 5. CRM Dashboard

### 5.1 Hauptansichten

**1. Pipeline-Board (Kanban)**
```
+----------+  +----------+  +----------+  +----------+  +----------+
|   Neu    |  |Kontaktiert|  |Qualifiziert|  |Angebot   |  |Verhandlung|
+----------+  +----------+  +----------+  +----------+  +----------+
| Lead A   |  | Lead D   |  | Lead F   |  | Lead H   |  | Lead J   |
| Lead B   |  | Lead E   |  | Lead G   |  | Lead I   |  |          |
| Lead C   |  |          |  |          |  |          |  |          |
+----------+  +----------+  +----------+  +----------+  +----------+
```

**2. Lead-Detailansicht**
- Kontaktdaten (editierbar)
- Produktinteresse & Kalkulation
- Aktivitaeten-Timeline
- Angebote
- Notizen
- Quick Actions: Anrufen, E-Mail, Termin, Status aendern

**3. Analytics Dashboard**
- Leads pro Kanal (Pie Chart)
- Pipeline-Wert (Gauge)
- Conversion-Funnel (Funnel Chart)
- Leads pro Tag (Line Chart)
- Top Keywords (Table)

### 5.2 Technische Umsetzung

**Option A: Supabase + React Admin**
```
React SPA
+-- @refinedev/core (Admin Framework)
+-- @refinedev/supabase (Data Provider)
+-- @refinedev/antd (UI Components)
+-- react-beautiful-dnd (Kanban)
+-- recharts (Charts)
```

**Option B: Retool / Appsmith**
- Low-Code Dashboard
- Schnellere Implementierung
- Weniger Customization

**Empfehlung:** Option A fuer mehr Kontrolle, Option B fuer schnellen MVP.

### 5.3 Zugriffskontrolle

```sql
-- RLS Policies fuer CRM
CREATE POLICY "Team kann alle Leads sehen" ON crm_leads
    FOR SELECT USING (auth.jwt() ->> 'email' LIKE '%@rollomax.at');

CREATE POLICY "Team kann Leads bearbeiten" ON crm_leads
    FOR UPDATE USING (auth.jwt() ->> 'email' LIKE '%@rollomax.at');

-- Oder: Supabase Auth mit Rollen
-- role = 'admin' -> Alles
-- role = 'sales' -> Nur eigene Leads
```

---

## 6. E-Mail-Automatisierung

### 6.1 Transaktionale E-Mails

| Trigger | E-Mail | Empfaenger |
|---------|--------|------------|
| Neuer Hot Lead | "Neuer Hot Lead: [Name]" | team@rollomax.at |
| Angebot gesendet | "Ihr Angebot von RolloMax" | Kunde |
| 3 Tage ohne Antwort | "Follow-up: Haben Sie noch Fragen?" | Kunde |
| Lead gewonnen | "Vielen Dank fuer Ihren Auftrag" | Kunde |

### 6.2 E-Mail-Templates

```html
<!-- hot-lead-alert.html -->
<h1>Neuer Hot Lead</h1>
<table>
  <tr><td>Name:</td><td>{{name}}</td></tr>
  <tr><td>Telefon:</td><td>{{phone}}</td></tr>
  <tr><td>Produkt:</td><td>{{product_interest}}</td></tr>
  <tr><td>Gesch. Wert:</td><td>{{estimated_value}} EUR</td></tr>
</table>
<a href="{{dashboard_url}}/leads/{{lead_id}}">Lead im Dashboard oeffnen</a>
```

### 6.3 E-Mail-Service

- **Empfehlung:** Resend oder Postmark (transaktional)
- **Alternative:** SendGrid, Mailgun
- **Nicht:** Eigener SMTP (Zustellbarkeit)

---

## 7. Integration mit bestehenden Systemen

### 7.1 Chatbot-Integration

Der Chatbot erkennt Lead-Signale und uebergibt Daten:

```javascript
// Im Chatbot-Workflow (Build Claude Payload)
const leadSignals = [
  'termin', 'angebot', 'preis', 'kosten',
  'telefonnummer', 'email', 'kontakt'
];

const hasLeadSignal = leadSignals.some(s => 
  userMessage.toLowerCase().includes(s)
);

// Claude bekommt Instruktion:
// "Wenn der Nutzer Kontaktdaten teilt oder einen Termin moechte,
//  extrahiere die Daten in lead_data: {name, phone, email, ...}"
```

**Lead-Uebergabe Format:**
```json
{
  "reply": "Perfekt! Ich habe Ihre Daten notiert...",
  "intent": "lead_capture",
  "lead_data": {
    "name": "Max Mustermann",
    "phone": "+43 664 1234567",
    "product_interest": "rollladen",
    "width_cm": 120,
    "height_cm": 150,
    "quantity": 3
  },
  "should_notify_team": true,
  "urgency": "high"
}
```

### 7.2 Konfigurator-Integration

Nach Abschluss der Konfiguration:

```javascript
// Konfigurator Submit Handler
async function submitLead(configuration, contactData) {
  const response = await fetch('/api/lead-intake', {
    method: 'POST',
    body: JSON.stringify({
      source: 'konfigurator',
      medium: 'widget',
      ...contactData,
      ...configuration,
      konfigurator_session_id: sessionId
    })
  });
  return response.json();
}
```

### 7.3 WordPress Kontaktformular

```php
// functions.php - After Contact Form 7 Submit
add_action('wpcf7_mail_sent', function($contact_form) {
  $submission = WPCF7_Submission::get_instance();
  $data = $submission->get_posted_data();
  
  wp_remote_post('https://chat.rollomax.at/webhook/lead-intake', [
    'body' => json_encode([
      'source' => 'website',
      'medium' => 'contact_form',
      'name' => $data['your-name'],
      'email' => $data['your-email'],
      'phone' => $data['your-phone'],
      'notes' => $data['your-message']
    ])
  ]);
});
```

---

## 8. Analytics & Reporting

### 8.1 KPIs

| Metrik | Beschreibung | Ziel |
|--------|--------------|------|
| Lead Volume | Leads pro Woche | 20+ |
| Lead Quality | % Hot Leads | >30% |
| Response Time | Zeit bis Erstkontakt | <4h (Hot), <24h (Warm) |
| Conversion Rate | Lead -> Angebot | >40% |
| Win Rate | Angebot -> Auftrag | >30% |
| Avg Deal Size | Durchschnittlicher Auftragswert | 2.000+ EUR |
| CAC | Cost per Acquired Customer | <150 EUR |

### 8.2 Analytics Views (SQL)

```sql
-- Kanal-Performance
CREATE VIEW v_channel_performance AS
SELECT 
    source,
    medium,
    COUNT(*) as leads,
    COUNT(*) FILTER (WHERE status = 'won') as won,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'won') / NULLIF(COUNT(*), 0), 1) as win_rate,
    SUM(estimated_value) FILTER (WHERE status = 'won') as revenue
FROM crm_leads
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY source, medium
ORDER BY leads DESC;

-- Pipeline-Wert
CREATE VIEW v_pipeline_value AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(estimated_value) as value
FROM crm_leads
WHERE status NOT IN ('won', 'lost')
GROUP BY status;

-- Response Time
CREATE VIEW v_response_time AS
SELECT 
    lead_type,
    AVG(EXTRACT(EPOCH FROM (
        (SELECT MIN(created_at) FROM crm_activities a 
         WHERE a.lead_id = l.lead_id AND a.activity_type IN ('call', 'email'))
        - l.created_at
    )) / 3600) as avg_hours_to_contact
FROM crm_leads l
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY lead_type;
```

---

## 9. Implementierungs-Roadmap

### Phase 1: Datenbank & Lead-Erfassung (1 Woche)

- [ ] crm_leads Tabelle erstellen
- [ ] crm_activities Tabelle erstellen
- [ ] Lead-Intake Webhook (N8N)
- [ ] Chatbot Lead-Erkennung aktivieren
- [ ] E-Mail-Alert bei Hot Leads

### Phase 2: Basis-Dashboard (2 Wochen)

- [ ] React Admin Setup
- [ ] Lead-Liste mit Filter/Suche
- [ ] Lead-Detailansicht
- [ ] Status-Update Funktion
- [ ] Notizen hinzufuegen

### Phase 3: Pipeline & Aktivitaeten (1 Woche)

- [ ] Kanban-Board View
- [ ] Aktivitaeten-Timeline
- [ ] Status-Change Logging
- [ ] Quick Actions (Anrufen, E-Mail)

### Phase 4: Angebote (1 Woche)

- [ ] crm_offers Tabelle erstellen
- [ ] Angebots-Editor
- [ ] PDF-Generierung
- [ ] E-Mail-Versand

### Phase 5: Analytics (1 Woche)

- [ ] Analytics Views erstellen
- [ ] Dashboard-Charts
- [ ] Export-Funktion (CSV)
- [ ] Weekly Report E-Mail

### Phase 6: Automatisierung (1 Woche)

- [ ] Follow-up Reminders
- [ ] Lead-Rotation (falls mehrere Mitarbeiter)
- [ ] Slack-Integration
- [ ] Konfigurator-Verknuepfung

---

## 10. Kosten-Schaetzung

| Komponente | Einmalig | Monatlich |
|------------|----------|-----------|
| Supabase Pro | - | 25 EUR |
| Resend (E-Mail) | - | 0 EUR (Free Tier) |
| Vercel Pro (Dashboard) | - | 20 EUR |
| **Entwicklung (extern)** | **2.000-4.000 EUR** | - |
| **Total** | ~3.000 EUR | ~45 EUR |

**ROI-Rechnung:**
- 1 zusaetzlicher Auftrag/Monat durch besseres Follow-up = ~2.000 EUR
- Break-Even nach 2 Monaten

---

## 11. Offene Fragen

1. **Mitarbeiter-Logins:** Wer braucht Zugang? (Adis, weitere?)
2. **Angebots-Template:** Gibt es ein bestehendes Design?
3. **E-Mail-Absender:** noreply@rollomax.at oder team@rollomax.at?
4. **Slack/Teams:** Welches Tool fuer Alerts?
5. **DSGVO:** Wie lange Leads aufbewahren? (Empfehlung: 2 Jahre)
6. **Telefon-Integration:** Click-to-Call gewuenscht?

---

*Dokument-Version: 1.0*
*Naechste Review: Bei Projektstart*
