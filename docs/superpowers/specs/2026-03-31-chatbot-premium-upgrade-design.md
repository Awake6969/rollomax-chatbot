# RolloMax Chatbot Premium Upgrade - Design Spec

**Datum:** 2026-03-31  
**Status:** Approved  
**Autor:** Claude + Raphael

---

## Zusammenfassung

Erweiterung des bestehenden RolloMax Chat-Widgets um Premium-Features: UI-Verbesserungen, Bild-Upload mit KI-Analyse, Produktkarten, Terminbuchung, WhatsApp-Handover, proaktive Nachrichten, Multi-Language Support und A/B Testing Framework.

---

## 1. UI-Komponenten (Widget)

### 1.1 Bot Avatar
- **Position:** Links im Header, vor "RolloMax Sonnenschutz-Berater"
- **Design:** 32x32px rundes Bild, RolloMax Logo oder stilisiertes Haus-Icon
- **Source:** `/widget/avatar.png` (statisch auf Server)
- **Fallback:** CSS-generierter Kreis mit "R"

### 1.2 Typing Indicator
- **Aktuell:** 3 animierte Dots
- **Neu:** "RolloMax tippt..." Text + Dots
- **Animation:** Dots pulsieren wie bisher, Text ist statisch

### 1.3 Message Feedback (Daumen)
- **Position:** Unter jeder Bot-Message, rechts neben dem Timestamp
- **Icons:** Daumen hoch / Daumen runter (outline, 16px)
- **Verhalten:** 
  - Klick -> Icon wird gefuellt (selected state)
  - Speichert in Supabase `message_feedback`
  - Optional: Bei Daumen runter -> kleines Textfeld "Was war nicht hilfreich?"

### 1.4 Sound Toggle
- **Position:** Im Header-Actions Bereich (neben Settings)
- **Icon:** Lautsprecher an/aus
- **Default:** Aus (opt-in)
- **Sound:** Dezenter "pling" bei neuer Bot-Nachricht (base64 encoded im JS)
- **Persistenz:** localStorage

### 1.5 Feedback Popup (Chat-Ende)
- **Trigger:** Nach 3+ Bot-Antworten, wenn User 2 Minuten inaktiv ODER Chat schliesst
- **Design:** Overlay im Chat-Window
- **Inhalt:**
  - "Wie war Ihre Erfahrung?" 
  - 5 Sterne Rating
  - Optional Freitext
  - "Absenden" Button
- **Speichert in:** `session_feedback` Tabelle

---

## 2. Produktkarten & Interaktive Elemente

### 2.1 Produktkarten (Inline im Chat)
- **Trigger:** Bot erkennt Produkterwaehnung (Rollladen, Raffstore, Markise, etc.)
- **Design:** Karte 280px breit, im Chat-Flow als Bot-Message
- **Inhalt:**
  - Produktbild (von rollomax.at, lazy-loaded)
  - Produktname (bold)
  - Kurzbeschreibung (2 Zeilen max)
  - "Mehr erfahren" Button -> oeffnet rollomax.at Produktseite
- **Layout:** Horizontal scrollbar wenn mehrere Produkte
- **Bild-Source:** Direkt von rollomax.at (stabile URLs)

### 2.2 Bild-Upload
- **Button:** Kamera-Icon links neben dem Textarea
- **Flow:**
  1. User klickt -> native File-Picker (accept="image/*")
  2. Preview im Chat (Thumbnail 150px)
  3. Upload zu Supabase Storage
  4. Bild wird an Claude Vision geschickt
  5. Bot antwortet mit Analyse ("Das sieht nach einem Kunststofffenster aus, ca. 120x140cm...")
- **Limits:** Max 5MB, nur jpg/png/webp
- **Speicherung:** `uploaded_images` Tabelle mit session_id, storage_url, claude_analysis
- **Bei Lead-Abschluss:** Bild wird ans Team weitergeleitet

### 2.3 Cal.com Terminbuchung
- **Trigger:** Bot schlaegt Termin vor ODER User fragt nach Beratung
- **Button im Chat:** "Termin buchen" (accent color)
- **Verhalten:** Oeffnet Cal.com Embed als Modal/Popup ueber dem Chat
- **Cal.com URL:** Konfigurierbar via `data-calcom-url` Attribut

### 2.4 Konfigurator Popup
- **Trigger:** User will selbst konfigurieren / technische Details
- **Button im Chat:** "Anfrage stellen"
- **Popup Steps:**
  1. Produktkategorie (Rollladen / Raffstore / Markise / ...)
  2. Neubau oder Nachruestung?
  3. Anzahl Fenster / ungefaehre Masse
  4. Kontaktdaten (Name, Email/Telefon, PLZ)
  5. Absenden -> Lead in Supabase
- **Design:** Modal ueber Chat, Progress-Indicator oben

### 2.5 WhatsApp Handover
- **Trigger:** "Mit Mitarbeiter sprechen" oder aehnlich
- **Button im Chat:** WhatsApp Icon + "Live Chat starten"
- **Nummer:** +43 650 990 75 99
- **Verhalten:** 
  - Desktop: Oeffnet `wa.me/436509907599?text=...` in neuem Tab
  - Mobile: Oeffnet WhatsApp App direkt
- **Prefilled Text:** "Hallo, ich komme vom Website-Chat und haette eine Frage zu [letztes Thema]..."

---

## 3. Proaktive Nachrichten & Multi-Language

### 3.1 Proaktive Nachrichten (Tooltip)
- **Trigger:** User ist 45-60 Sekunden auf der Seite, Chat ist NICHT geoeffnet
- **A/B Test Varianten:**
  - A: "Kann ich Ihnen bei etwas helfen?"
  - B: "Sind Sie sich unsicher, was bei Ihnen passt?"
  - C: "Soll ich Ihnen einen Vorschlag machen?"
  - D: "Haben Sie Fragen zum Sonnenschutz?"
- **Design:** Tooltip ueber dem Bubble-Button
- **Tracking:** Variante + ob geklickt wird -> `ab_assignments` Tabelle

### 3.2 Proaktive Nachrichten (Im Chat)
- **Trigger:** Chat ist offen, User hat 90 Sekunden nichts geschrieben
- **Bot schreibt:** "Kann ich Ihnen noch bei etwas helfen?"
- **Nur einmal pro Session** (Flag in sessionStorage)

### 3.3 Multi-Language (Automatisch)
- **Erkennung:** Claude erkennt Sprache der ersten User-Nachricht automatisch
- **Verhalten:** Bot antwortet in derselben Sprache
- **Unterstuetzte Sprachen:** Deutsch, Englisch, Tuerkisch, Serbisch/Kroatisch
- **System Prompt Erweiterung:** "Antworte IMMER in der Sprache, in der der Kunde schreibt."
- **Welcome Message:** Bleibt Deutsch, wechselt erst nach erster User-Nachricht

---

## 4. A/B Testing & Analytics

### 4.1 A/B Test Framework
- **Experiment-Definition:** In Supabase `ab_experiments` Tabelle
- **Assignment:** Bei Session-Start wird User einer Variante zugewiesen (zufaellig, persistent)
- **Erstes Experiment:** "proactive_message" mit Varianten A/B/C/D

### 4.2 Tracking Events
Event Types:
- `chat_opened` - Chat geoeffnet
- `proactive_clicked` - Proaktive Nachricht angeklickt
- `feedback_submitted` - Daumen oder Sterne-Rating
- `product_card_clicked` - Produktkarte angeklickt
- `image_uploaded` - Bild hochgeladen
- `booking_started` - Cal.com geoeffnet
- `configurator_completed` - Konfigurator abgeschickt
- `whatsapp_handover` - WhatsApp geoeffnet
- `lead_captured` - Lead erfasst

### 4.3 Analytics Views (fuer Lovable Dashboard)
- `v_ab_test_results` - Conversion Rate pro Variante
- `v_feature_usage` - Welche Features werden wie oft genutzt
- `v_funnel_analysis` - Chat opened -> Engaged -> Lead -> Booking

---

## 5. Datenbank-Erweiterungen (Supabase)

### 5.1 Neue Tabellen

**message_feedback**
```sql
CREATE TABLE message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  rating text CHECK (rating IN ('up', 'down')),
  comment text,
  created_at timestamptz DEFAULT now()
);
```

**session_feedback**
```sql
CREATE TABLE session_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  stars integer CHECK (stars >= 1 AND stars <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
```

**uploaded_images**
```sql
CREATE TABLE uploaded_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_size integer,
  mime_type text,
  claude_analysis jsonb,
  created_at timestamptz DEFAULT now()
);
```

**ab_experiments**
```sql
CREATE TABLE ab_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  variants jsonb NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**ab_assignments**
```sql
CREATE TABLE ab_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  experiment_id uuid REFERENCES ab_experiments(id) ON DELETE CASCADE,
  variant text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, experiment_id)
);
```

**analytics_events**
```sql
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);
```

### 5.2 Storage Bucket
- **Name:** `chat-uploads`
- **Public:** Nein (signed URLs fuer Zugriff)
- **Policies:** Nur Insert via Service Key, Read via signed URL

### 5.3 Neue Analytics Views

**v_ab_test_results**
```sql
CREATE VIEW v_ab_test_results AS
SELECT 
  e.name as experiment_name,
  a.variant,
  COUNT(DISTINCT a.session_id) as sessions,
  COUNT(DISTINCT l.session_id) as leads,
  ROUND(COUNT(DISTINCT l.session_id)::numeric / NULLIF(COUNT(DISTINCT a.session_id), 0) * 100, 2) as conversion_rate
FROM ab_experiments e
JOIN ab_assignments a ON e.id = a.experiment_id
LEFT JOIN leads l ON a.session_id = l.session_id
WHERE e.active = true
GROUP BY e.name, a.variant
ORDER BY e.name, a.variant;
```

**v_feature_usage**
```sql
CREATE VIEW v_feature_usage AS
SELECT 
  event_type,
  DATE(created_at) as date,
  COUNT(*) as count
FROM analytics_events
WHERE created_at > now() - interval '30 days'
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC, count DESC;
```

**v_funnel_analysis**
```sql
CREATE VIEW v_funnel_analysis AS
SELECT 
  DATE(s.created_at) as date,
  COUNT(DISTINCT s.id) as sessions,
  COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN s.id END) as engaged,
  COUNT(DISTINCT l.session_id) as leads,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'booking_started' THEN s.id END) as bookings
FROM chat_sessions s
LEFT JOIN chat_messages m ON s.id = m.session_id AND m.role = 'user'
LEFT JOIN leads l ON s.id = l.session_id
LEFT JOIN analytics_events ae ON s.id = ae.session_id
WHERE s.created_at > now() - interval '30 days'
GROUP BY DATE(s.created_at)
ORDER BY date DESC;
```

---

## 6. N8N Workflow Erweiterungen

### 6.1 RolloMax Chat (Haupt-Workflow erweitern)

**Neue Funktionen:**
- **Bild-Handling:** Wenn Request ein Bild enthaelt -> Claude Vision API statt normale API
- **Multi-Language:** System Prompt Erweiterung
- **Produktkarten-Trigger:** Claude gibt im JSON zurueck:
  ```json
  {
    "reply": "...",
    "show_product_card": {
      "type": "rollladen",
      "url": "https://rollomax.at/rolllaeden",
      "image": "https://rollomax.at/wp-content/uploads/rollladen.jpg"
    }
  }
  ```
- **Action Buttons:** Claude kann Buttons vorschlagen:
  ```json
  {
    "reply": "...",
    "show_actions": ["booking", "whatsapp", "configurator"]
  }
  ```

### 6.2 Neuer Workflow: Bild-Upload
- **Endpoint:** POST `/webhook/upload-image`
- **Input:** Base64 Bild + session_id
- **Flow:** Validiere -> Upload zu Supabase Storage -> Speichere Referenz -> Return signed URL

### 6.3 Neuer Workflow: Feedback
- **Endpoint:** POST `/webhook/feedback`
- **Input:** session_id + feedback_type + data
- **Flow:** Speichere in entsprechender Tabelle

### 6.4 Neuer Workflow: Analytics Event
- **Endpoint:** POST `/webhook/track`
- **Input:** session_id + event_type + event_data
- **Flow:** A/B Assignment falls noetig -> Speichere Event

---

## 7. Assets

### 7.1 Bot Avatar
- **Datei:** `/widget/avatar.png`
- **Groesse:** 64x64px (Retina-ready)
- **Fallback:** CSS-generierter Kreis mit "R"

### 7.2 Notification Sound
- **Format:** Base64-encoded MP3 im JS
- **Dauer:** Max 0.5 Sekunden
- **Lautstaerke:** 0.3 volume

### 7.3 Neue Icons (inline SVG)
- Kamera (Bild-Upload)
- Lautsprecher an/aus (Sound Toggle)
- Daumen hoch/runter (Feedback)
- WhatsApp Logo (Handover)
- Stern (Session Feedback)
- Kalender (Terminbuchung)

---

## Nicht im Scope

- React/Vue Rewrite (Overkill)
- Feature-Flag-System (nicht noetig, Upsell via Deploy-Timing)
- Eigenes Agent-Dashboard (WhatsApp Handover stattdessen)

---

## Abhaengigkeiten

- Cal.com Account fuer RolloMax (URL wird konfiguriert)
- Produktbild-URLs auf rollomax.at muessen stabil sein
- Supabase Storage Bucket einrichten
