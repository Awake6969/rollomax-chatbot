-- ============================================================
-- 006_analytics_views.sql
-- Analytics Views fuer RolloMax KI-Chatbot Dashboard
-- ============================================================

-- Taegliche Konversations-Statistik
CREATE OR REPLACE VIEW public.v_daily_stats AS
SELECT
  DATE(created_at) AS date,
  COUNT(DISTINCT id) AS sessions,
  COUNT(DISTINCT CASE WHEN converted THEN id END) AS conversions,
  ROUND(AVG(message_count), 1) AS avg_messages
FROM public.chat_sessions
WHERE created_at > now() - interval '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Lead-Pipeline nach Dringlichkeit und Produktinteresse
CREATE OR REPLACE VIEW public.v_lead_pipeline AS
SELECT
  urgency,
  product_interest,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE notified = false) AS pending_notification
FROM public.leads
WHERE created_at > now() - interval '30 days'
GROUP BY urgency, product_interest;

-- Intent-Verteilung (letzte 30 Tage)
CREATE OR REPLACE VIEW public.v_intent_stats AS
SELECT
  intent,
  COUNT(*) AS count,
  DATE(created_at) AS date
FROM public.chat_messages
WHERE role = 'assistant'
  AND intent IS NOT NULL
  AND created_at > now() - interval '30 days'
GROUP BY intent, DATE(created_at)
ORDER BY date DESC, count DESC;

-- Button-Klick-Analytics
CREATE OR REPLACE VIEW public.v_button_analytics AS
SELECT
  source_type,
  content AS button_text,
  COUNT(*) AS click_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  DATE(created_at) AS date
FROM public.chat_messages
WHERE source_type IN ('quick_reply', 'suggested_action')
GROUP BY source_type, content, DATE(created_at)
ORDER BY date DESC, click_count DESC;

-- Button-zu-Lead Conversion-Rate
CREATE OR REPLACE VIEW public.v_button_to_lead AS
SELECT
  m.content AS button_text,
  m.source_type,
  COUNT(DISTINCT m.session_id) AS sessions_with_button,
  COUNT(DISTINCT l.id) AS leads_generated,
  ROUND(
    COUNT(DISTINCT l.id)::numeric / NULLIF(COUNT(DISTINCT m.session_id), 0) * 100, 1
  ) AS conversion_rate_pct
FROM public.chat_messages m
LEFT JOIN public.leads l ON m.session_id::text = l.session_id::text
WHERE m.source_type IN ('quick_reply', 'suggested_action')
GROUP BY m.content, m.source_type
ORDER BY conversion_rate_pct DESC;
