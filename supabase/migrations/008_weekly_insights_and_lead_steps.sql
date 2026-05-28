-- ============================================================
-- 008_weekly_insights_and_lead_steps.sql
-- 1. Weekly Marketing Insights Views
-- 2. Lead Collection Step Tracking
-- ============================================================

-- =========================
-- Part 0: Fehlende Spalten aus Migration 005 (falls noch nicht vorhanden)
-- =========================

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS intent TEXT;

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'typed';

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS plz TEXT;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS product_interest TEXT;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS project_type TEXT;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'low';

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT false;

-- =========================
-- Part 1: Lead Collection Step Tracking
-- =========================

-- Neues Feld: Aktueller Schritt im Lead-Erfassungs-Flow (0-6)
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS lead_collection_step SMALLINT NOT NULL DEFAULT 0;

-- Neues Feld: Bereits erfasste Lead-Daten als JSON
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS collected_lead_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index fuer schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_chat_sessions_lead_step
ON public.chat_sessions(lead_collection_step)
WHERE lead_collection_step > 0;

-- Kommentar zur Dokumentation
COMMENT ON COLUMN public.chat_sessions.lead_collection_step IS
'Lead-Erfassungs-Schritt: 0=Keine, 1=Produkt, 2=Standort, 3=Privat/Firma, 4=Projektart, 5=Umfang, 6=Kontakt';

COMMENT ON COLUMN public.chat_sessions.collected_lead_data IS
'Bereits erfasste Lead-Daten: {product, location, customer_type, project_type, scope, contact}';

-- =========================
-- Part 2: Weekly Marketing Insights Views
-- =========================

-- Top Fragen/Themen der letzten 7 Tage (basierend auf User-Messages)
CREATE OR REPLACE VIEW public.v_weekly_top_topics AS
WITH user_messages AS (
    SELECT
        content,
        session_id,
        created_at
    FROM public.chat_messages
    WHERE role = 'user'
      AND created_at > now() - interval '7 days'
      AND LENGTH(content) > 10
),
-- Einfache Keyword-Extraktion
keywords AS (
    SELECT
        LOWER(
            regexp_replace(content, '[^a-zA-ZaeoeueAeOeUess\s]', '', 'g')
        ) AS cleaned,
        session_id
    FROM user_messages
)
SELECT
    word,
    COUNT(*) AS mentions,
    COUNT(DISTINCT session_id) AS unique_sessions
FROM (
    SELECT
        unnest(string_to_array(cleaned, ' ')) AS word,
        session_id
    FROM keywords
) words
WHERE LENGTH(word) > 4
  AND word NOT IN ('haben', 'moechte', 'gerne', 'bitte', 'danke', 'wuerde', 'koennen', 'wissen', 'frage', 'hallo')
GROUP BY word
ORDER BY mentions DESC
LIMIT 20;

-- Intent-Verteilung der letzten Woche
CREATE OR REPLACE VIEW public.v_weekly_intent_distribution AS
SELECT
    intent,
    COUNT(*) AS count,
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) AS percentage
FROM public.chat_messages
WHERE role = 'assistant'
  AND intent IS NOT NULL
  AND created_at > now() - interval '7 days'
GROUP BY intent
ORDER BY count DESC;

-- Sessions mit Abbruch (weniger als 3 Nachrichten, kein Lead)
CREATE OR REPLACE VIEW public.v_weekly_abandoned_sessions AS
SELECT
    COUNT(*) AS abandoned_count,
    ROUND(
        COUNT(*)::numeric / NULLIF(
            (SELECT COUNT(*) FROM public.chat_sessions WHERE created_at > now() - interval '7 days'),
            0
        ) * 100, 1
    ) AS abandonment_rate_pct
FROM public.chat_sessions s
WHERE s.created_at > now() - interval '7 days'
  AND s.message_count < 3
  AND NOT EXISTS (
      SELECT 1 FROM public.leads l WHERE l.session_id = s.id
  );

-- Woechentlicher Trend-Vergleich (diese Woche vs. letzte Woche)
CREATE OR REPLACE VIEW public.v_weekly_trend_comparison AS
WITH this_week AS (
    SELECT
        COUNT(DISTINCT s.id) AS sessions,
        COUNT(DISTINCT l.id) AS leads,
        ROUND(AVG(s.message_count), 1) AS avg_messages,
        COUNT(DISTINCT CASE WHEN s.converted THEN s.id END) AS conversions
    FROM public.chat_sessions s
    LEFT JOIN public.leads l ON s.id = l.session_id
    WHERE s.created_at > now() - interval '7 days'
),
last_week AS (
    SELECT
        COUNT(DISTINCT s.id) AS sessions,
        COUNT(DISTINCT l.id) AS leads,
        ROUND(AVG(s.message_count), 1) AS avg_messages,
        COUNT(DISTINCT CASE WHEN s.converted THEN s.id END) AS conversions
    FROM public.chat_sessions s
    LEFT JOIN public.leads l ON s.id = l.session_id
    WHERE s.created_at > now() - interval '14 days'
      AND s.created_at <= now() - interval '7 days'
)
SELECT
    'sessions' AS metric,
    tw.sessions AS this_week,
    lw.sessions AS last_week,
    CASE
        WHEN lw.sessions = 0 THEN NULL
        ELSE ROUND((tw.sessions - lw.sessions)::numeric / lw.sessions * 100, 1)
    END AS change_pct
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'leads',
    tw.leads,
    lw.leads,
    CASE
        WHEN lw.leads = 0 THEN NULL
        ELSE ROUND((tw.leads - lw.leads)::numeric / lw.leads * 100, 1)
    END
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'avg_messages',
    tw.avg_messages::integer,
    lw.avg_messages::integer,
    CASE
        WHEN lw.avg_messages = 0 THEN NULL
        ELSE ROUND((tw.avg_messages - lw.avg_messages) / lw.avg_messages * 100, 1)
    END
FROM this_week tw, last_week lw
UNION ALL
SELECT
    'conversions',
    tw.conversions,
    lw.conversions,
    CASE
        WHEN lw.conversions = 0 THEN NULL
        ELSE ROUND((tw.conversions - lw.conversions)::numeric / lw.conversions * 100, 1)
    END
FROM this_week tw, last_week lw;

-- Feedback-Score der Woche
CREATE OR REPLACE VIEW public.v_weekly_feedback_score AS
SELECT
    COUNT(*) AS total_feedback,
    COUNT(*) FILTER (WHERE rating = 'up') AS positive,
    COUNT(*) FILTER (WHERE rating = 'down') AS negative,
    ROUND(
        COUNT(*) FILTER (WHERE rating = 'up')::numeric
        / NULLIF(COUNT(*), 0) * 100, 1
    ) AS satisfaction_rate_pct,
    -- Star ratings from session feedback
    (SELECT ROUND(AVG(stars), 1) FROM public.session_feedback
     WHERE created_at > now() - interval '7 days') AS avg_star_rating
FROM public.message_feedback
WHERE created_at > now() - interval '7 days';

-- Lead-Erfassungs-Fortschritt (wo brechen Nutzer ab?)
CREATE OR REPLACE VIEW public.v_weekly_lead_funnel AS
SELECT
    lead_collection_step AS step,
    CASE lead_collection_step
        WHEN 0 THEN 'Kein Lead-Interesse'
        WHEN 1 THEN 'Produkt erfragt'
        WHEN 2 THEN 'Standort erfragt'
        WHEN 3 THEN 'Privat/Firma erfragt'
        WHEN 4 THEN 'Projektart erfragt'
        WHEN 5 THEN 'Umfang erfragt'
        WHEN 6 THEN 'Kontakt erhalten'
    END AS step_name,
    COUNT(*) AS sessions_at_step,
    ROUND(
        COUNT(*)::numeric / NULLIF(
            (SELECT COUNT(*) FROM public.chat_sessions WHERE created_at > now() - interval '7 days'),
            0
        ) * 100, 1
    ) AS percentage
FROM public.chat_sessions
WHERE created_at > now() - interval '7 days'
GROUP BY lead_collection_step
ORDER BY lead_collection_step;

-- Produkt-Interesse Verteilung
CREATE OR REPLACE VIEW public.v_weekly_product_interest AS
SELECT
    COALESCE(product_interest, 'Nicht angegeben') AS product,
    COUNT(*) AS lead_count,
    COUNT(*) FILTER (WHERE urgency = 'high') AS high_urgency,
    COUNT(*) FILTER (WHERE urgency = 'medium') AS medium_urgency,
    COUNT(*) FILTER (WHERE urgency = 'low') AS low_urgency
FROM public.leads
WHERE created_at > now() - interval '7 days'
GROUP BY product_interest
ORDER BY lead_count DESC;
