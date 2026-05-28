# CRM-MVP Datenstruktur

Diese Felder sind für die zukünftige CRM-Integration definiert.
**Status:** Noch NICHT implementiert - geplant als Upsell-Feature.

## Lead-Tabelle

```sql
CREATE TABLE crm_leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Kontaktdaten
    name TEXT,
    phone TEXT,
    email TEXT,
    postcode TEXT,
    city TEXT,
    
    -- Marketing Attribution
    source TEXT,              -- z.B. 'google', 'facebook', 'direct', 'chatbot'
    medium TEXT,              -- z.B. 'cpc', 'organic', 'referral'
    campaign TEXT,            -- Kampagnenname
    keyword TEXT,             -- Suchbegriff (bei Google Ads)
    gclid TEXT,               -- Google Click ID
    landing_page TEXT,        -- Erste besuchte Seite
    
    -- Produktinteresse
    product_interest TEXT,    -- z.B. 'rollladen', 'markise', 'raffstore'
    subproduct TEXT,          -- z.B. 'solar', 'elektrisch', 'manuell'
    width NUMERIC,            -- Breite in cm
    height NUMERIC,           -- Höhe in cm
    quantity INTEGER,         -- Anzahl Fenster/Elemente
    estimated_value NUMERIC,  -- Geschätzter Auftragswert
    
    -- Status
    lead_type TEXT,           -- z.B. 'hot', 'warm', 'cold'
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'offer_sent', 'won', 'lost'
    appointment_requested BOOLEAN DEFAULT FALSE,
    
    -- Notizen
    notes TEXT,
    
    -- Verknüpfung zum Chat
    chat_session_id UUID REFERENCES chat_sessions(id)
);
```

## Geplante Verknüpfung mit Chatbot

Wenn der Chatbot Lead-Daten sammelt (Name, Telefon, E-Mail, PLZ, Produktinteresse),
werden diese in `crm_leads` gespeichert mit:
- `source = 'chatbot'`
- `medium = 'widget'`
- `chat_session_id` = Session-ID für Gesprächsverlauf

## Marketing Attribution

UTM-Parameter von der Landing Page werden erfasst:
- `utm_source` -> `source`
- `utm_medium` -> `medium`
- `utm_campaign` -> `campaign`
- `utm_term` -> `keyword`
- `gclid` -> `gclid`

## Status-Workflow

```
new -> contacted -> qualified -> offer_sent -> won/lost
```

## Implementierung

Diese Struktur wird implementiert wenn:
1. Das CRM-Dashboard gebaut wird
2. Der Kunde das Upsell-Feature bucht
3. Die Lead-Erfassung im Chatbot erweitert wird

---
*Erstellt: 2026-03-31*
*Status: Dokumentation - nicht implementiert*
