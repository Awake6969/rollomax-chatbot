-- ============================================================
-- 003_auto_delete_cron.sql
-- RolloMax KI-Chatbot: DSGVO-konforme automatische Datenloeschung
-- Voraussetzung: pg_cron muss im Supabase Dashboard aktiviert sein
-- ============================================================

-- pg_cron Extension aktivieren
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =========================
-- Chat-Daten nach 90 Tagen loeschen
-- Lauft taeglich um 03:00 UTC
-- =========================
SELECT cron.schedule(
    'delete_old_chat_data',
    '0 3 * * *',
    $$
    DELETE FROM public.chat_messages
    WHERE created_at < now() - interval '90 days';

    DELETE FROM public.chat_sessions
    WHERE created_at < now() - interval '90 days';
    $$
);

-- =========================
-- Lead-Daten nach 2 Jahren loeschen
-- Lauft woechentlich am Sonntag um 04:00 UTC
-- =========================
SELECT cron.schedule(
    'delete_old_leads',
    '0 4 * * 0',
    $$
    DELETE FROM public.leads
    WHERE created_at < now() - interval '2 years';
    $$
);
