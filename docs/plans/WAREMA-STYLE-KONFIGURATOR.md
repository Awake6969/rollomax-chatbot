# Warema-Style Konfigurator App

## Uebersicht

Inspiriert von https://configurator.warema.com/welcome - ein visueller, schrittweiser Produktkonfigurator fuer RolloMax Sonnenschutzprodukte.

**Status:** Geplant - Noch NICHT implementiert
**Erstellt:** 2026-03-31
**Zielgruppe:** Endkunden auf rollomax.at

---

## 1. Konzept

### 1.1 User Journey (5 Schritte)

```
[1. Raum]  -->  [2. Produkt]  -->  [3. Masse]  -->  [4. Optionen]  -->  [5. Angebot]
```

**Schritt 1: Raum auswaehlen**
- Wohnzimmer / Schlafzimmer / Kueche / Bad / Buero / Terrasse / Wintergarten
- Jeder Raum zeigt passendes Hintergrundbild
- Beeinflusst Produktempfehlungen (z.B. Schlafzimmer -> Verdunkelung wichtig)

**Schritt 2: Produkt auswaehlen**
- Rolllaeden (Vorbau / Aufsatz / Solar)
- Aussenjalousien / Raffstoren
- Markisen (Gelenkarm / Kassetten / Pergola)
- Insektenschutz-Kombination
- Visuelle Kacheln mit Produktbildern

**Schritt 3: Masse eingeben**
- Breite (Slider + Eingabefeld, 60-300cm)
- Hoehe (Slider + Eingabefeld, 60-250cm)
- Anzahl Fenster (1-20)
- Live-Vorschau der Proportionen
- Hinweis: "Nicht sicher? Wir messen kostenlos vor Ort!"

**Schritt 4: Optionen konfigurieren**
- Antrieb: Manuell (Gurt/Kurbel) / Elektrisch / Solar
- Farbe: RAL-Farbauswahl (Top 10 vorselektiert)
- Extras: Insektenschutz-Kombi, Zeitschaltuhr, Smart-Home
- Jede Option zeigt Preisaufschlag

**Schritt 5: Angebot erhalten**
- Zusammenfassung aller Auswahlen
- Kalkulierter Richtpreis (Material + Montage + Fahrkosten)
- Foerderungshinweis mit geschaetztem Eigenanteil
- CTA: "Verbindliches Angebot anfordern" (Lead-Formular)
- CTA: "Beratungstermin vereinbaren"

---

## 2. Technische Architektur

### 2.1 Frontend Stack

```
React / Next.js App
|
+-- Zustand (State Management)
|   +-- currentStep: number
|   +-- selections: { room, product, dimensions, options }
|   +-- calculatedPrice: number
|
+-- Components
|   +-- StepIndicator (Fortschrittsleiste)
|   +-- RoomSelector (Kachel-Grid)
|   +-- ProductSelector (Kachel-Grid mit Bildern)
|   +-- DimensionInput (Slider + Numerisch)
|   +-- OptionConfigurator (Toggle/Checkbox-Liste)
|   +-- PriceSummary (Live-Kalkulation)
|   +-- LeadForm (Kontaktdaten)
|
+-- API Routes
    +-- /api/calculate-price
    +-- /api/submit-lead
```

### 2.2 Backend Integration

**Preiskalkulation:**
```javascript
// API Route: /api/calculate-price
POST /api/calculate-price
{
  "product": "vorbaurollladen",
  "width_cm": 120,
  "height_cm": 150,
  "quantity": 3,
  "drive": "electric",  // manual, electric, solar
  "extras": ["insect_screen"],
  "district": "1020"
}

Response:
{
  "material_per_unit": 464,
  "material_total": 1392,
  "montage_per_unit": 120,
  "montage_total": 360,
  "travel_cost": 65,
  "extras_total": 150,
  "gross_total": 1967,
  "foerderung_eligible": true,
  "foerderung_estimate": 983,
  "net_estimate": 984,
  "valid_until": "2026-04-30"
}
```

**Lead-Erfassung:**
```javascript
// API Route: /api/submit-lead
POST /api/submit-lead
{
  "name": "Max Mustermann",
  "phone": "+43 664 1234567",
  "email": "max@example.com",
  "postcode": "1020",
  "configuration": { ... },  // Alle Auswahlen
  "calculated_price": 1967,
  "source": "konfigurator"
}
```

### 2.3 Datenbank-Erweiterungen

```sql
-- Konfigurator-Sessions speichern
CREATE TABLE konfigurator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Schritte
    room TEXT,
    product TEXT,
    width_cm NUMERIC,
    height_cm NUMERIC,
    quantity INTEGER,
    drive_type TEXT,
    color TEXT,
    extras TEXT[],
    
    -- Kalkulation
    calculated_price NUMERIC,
    foerderung_estimate NUMERIC,
    
    -- Tracking
    steps_completed INTEGER DEFAULT 0,
    abandoned_at_step INTEGER,
    time_spent_seconds INTEGER,
    
    -- Lead-Verknuepfung
    lead_id UUID REFERENCES crm_leads(lead_id)
);

-- Analytics View
CREATE VIEW v_konfigurator_funnel AS
SELECT 
    DATE(created_at) as day,
    COUNT(*) as started,
    COUNT(*) FILTER (WHERE steps_completed >= 2) as selected_product,
    COUNT(*) FILTER (WHERE steps_completed >= 3) as entered_dimensions,
    COUNT(*) FILTER (WHERE steps_completed >= 4) as configured_options,
    COUNT(*) FILTER (WHERE steps_completed = 5) as completed,
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as converted_to_lead
FROM konfigurator_sessions
GROUP BY DATE(created_at);
```

---

## 3. Preislogik

### 3.1 Basis-Preistabelle (aus Knowledge Base)

```
Vorbaurolllaeden (EUR, nur Material):
         80cm    100cm   120cm   150cm   180cm   200cm (Hoehe)
80cm     319     337     359     385     416     433
100cm    341     361     387     419     454     474
120cm    362     386     416     453     492     516
150cm    399     428     464     508     557     608
180cm    441     477     520     574     633     674
200cm    465     503     551     610     675     714
(Breite)
```

### 3.2 Interpolation fuer Zwischenmasse

```javascript
function interpolatePrice(width, height, priceTable) {
  // Finde die naechsten Stuetzpunkte
  const widths = [80, 100, 120, 150, 180, 200];
  const heights = [80, 100, 120, 150, 180, 200];
  
  const wLow = widths.filter(w => w <= width).pop() || widths[0];
  const wHigh = widths.find(w => w >= width) || widths[widths.length-1];
  const hLow = heights.filter(h => h <= height).pop() || heights[0];
  const hHigh = heights.find(h => h >= height) || heights[heights.length-1];
  
  // Bilineare Interpolation
  const p11 = priceTable[wLow][hLow];
  const p12 = priceTable[wLow][hHigh];
  const p21 = priceTable[wHigh][hLow];
  const p22 = priceTable[wHigh][hHigh];
  
  const wRatio = (width - wLow) / (wHigh - wLow) || 0;
  const hRatio = (height - hLow) / (hHigh - hLow) || 0;
  
  return Math.round(
    p11 * (1-wRatio) * (1-hRatio) +
    p21 * wRatio * (1-hRatio) +
    p12 * (1-wRatio) * hRatio +
    p22 * wRatio * hRatio
  );
}
```

### 3.3 Aufschlaege

| Option | Aufschlag |
|--------|-----------|
| Elektrischer Antrieb | +150 EUR/Stueck |
| Solar-Antrieb | +300 EUR/Stueck |
| Insektenschutz-Kombi | +20% auf Materialpreis |
| RAL-Sonderfarbe | +50 EUR/Stueck |
| Smart-Home-Integration | +80 EUR/Stueck |

### 3.4 Montage-Staffelung

| Anzahl | Preis/Stueck |
|--------|--------------|
| 1-3 Stueck | 120 EUR |
| 4-10 Stueck | 96 EUR |
| ab 10 Stueck | 87 EUR |

### 3.5 Fahrkosten

| Bezirk | Kosten |
|--------|--------|
| 1020, 1200 | 65 EUR |
| Andere Wiener Bezirke | 110 EUR |
| Niederoesterreich | Auf Anfrage |

---

## 4. UI/UX Spezifikationen

### 4.1 Design-Richtlinien

- **Primaerfarbe:** RolloMax Orange (#E85D04)
- **Sekundaerfarbe:** Dunkelgrau (#2D3748)
- **Hintergrund:** Weiss mit sanftem Grau (#F7FAFC)
- **Schriften:** Playfair Display (Headlines), DM Sans (Body)
- **Border-Radius:** 12px (Karten), 8px (Buttons)
- **Schatten:** Sanft, mehrstufig (0 4px 6px rgba(0,0,0,0.1))

### 4.2 Mobile-First Breakpoints

```css
/* Mobile */
@media (max-width: 639px) {
  .step-content { padding: 16px; }
  .product-grid { grid-template-columns: 1fr; }
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
  .konfigurator-layout { display: grid; grid-template-columns: 1fr 400px; }
}
```

### 4.3 Animationen

- Schritt-Uebergaenge: Slide + Fade (300ms ease-out)
- Preis-Updates: Zaehler-Animation (500ms)
- Button-Hover: Scale 1.02 + Schatten-Verstaerkung
- KEINE Bounce/Spring-Animationen

### 4.4 Fortschrittsanzeige

```
[1] ---- [2] ---- [3] ---- [4] ---- [5]
 *        *        o        o        o
Raum   Produkt   Masse   Optionen  Angebot

* = erledigt (gruen)
o = offen (grau)
Aktiver Schritt = Orange mit Puls-Animation
```

---

## 5. Integration mit bestehendem System

### 5.1 Chatbot-Verknuepfung

Der Chatbot kann Nutzer zum Konfigurator weiterleiten:
```
Bot: "Fuer eine genaue Preiskalkulation empfehle ich unseren 
     Online-Konfigurator: [Zum Konfigurator] 
     Oder ich kann hier eine Schaetzung machen - 
     welche Masse haben Ihre Fenster?"
```

### 5.2 Lead-Uebergabe

Wenn ein Lead im Konfigurator erfasst wird:
1. Lead wird in `crm_leads` gespeichert mit `source = 'konfigurator'`
2. Konfigurator-Session wird mit Lead verknuepft
3. Optional: Chatbot-Session wird auch verknuepft (falls vorhanden)
4. E-Mail-Benachrichtigung an RolloMax-Team

### 5.3 Analytics-Integration

Der Konfigurator sendet Events an:
- Supabase Analytics (eigene Tabelle)
- Optional: Google Analytics 4 (gtag.js)
- Optional: Meta Pixel fuer Retargeting

---

## 6. Implementierungs-Roadmap

### Phase 1: MVP (2 Wochen)
- [ ] Next.js Projekt Setup
- [ ] Basis-UI mit 5 Schritten
- [ ] Statische Preistabelle (Vorbaurolllaeden)
- [ ] Einfaches Lead-Formular
- [ ] Deployment auf Vercel/Hostinger

### Phase 2: Erweiterung (2 Wochen)
- [ ] Alle Produktkategorien hinzufuegen
- [ ] Dynamische Preiskalkulation mit Interpolation
- [ ] Foerderungs-Rechner integrieren
- [ ] Konfigurator-Session-Tracking
- [ ] Chatbot-Verknuepfung

### Phase 3: Polish (1 Woche)
- [ ] Mobile-Optimierung
- [ ] Animationen verfeinern
- [ ] A/B-Testing Setup
- [ ] Performance-Optimierung
- [ ] SEO (Produktseiten indexierbar)

### Phase 4: Analytics (1 Woche)
- [ ] Funnel-Dashboard
- [ ] Abbruch-Analyse
- [ ] Conversion-Tracking
- [ ] Heatmaps (optional)

---

## 7. Technische Anforderungen

### 7.1 Hosting

- **Frontend:** Vercel (empfohlen) oder Hostinger Static
- **API:** Vercel Serverless Functions oder N8N Webhooks
- **Domain:** konfigurator.rollomax.at (CNAME auf Vercel)

### 7.2 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "zustand": "^4.4.0",
    "@radix-ui/react-slider": "^1.1.0",
    "@radix-ui/react-select": "^2.0.0",
    "framer-motion": "^10.16.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  }
}
```

### 7.3 Environment Variables

```env
NEXT_PUBLIC_API_URL=https://chat.rollomax.at
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

---

## 8. Offene Fragen

1. **Produktbilder:** Woher kommen hochwertige Produktfotos?
2. **RAL-Farben:** Welche Farben sind verfuegbar? (Top 10 definieren)
3. **Niederoesterreich:** Pauschale Fahrkosten oder PLZ-basiert?
4. **Raffstoren-Preise:** Separate Preisliste erforderlich
5. **Markisen-Preise:** Separate Preisliste erforderlich
6. **A/B-Tests:** Welche Varianten sollen getestet werden?

---

*Dokument-Version: 1.0*
*Naechste Review: Bei Projektstart*
