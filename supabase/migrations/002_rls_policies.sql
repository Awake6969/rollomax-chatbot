-- ============================================================
-- 002_rls_policies.sql
-- RolloMax KI-Chatbot: Row Level Security Policies
-- ============================================================

-- =========================
-- RLS aktivieren
-- =========================
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- =========================
-- chat_sessions: nur service_role
-- =========================
CREATE POLICY "service_role_all_sessions" ON public.chat_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================
-- chat_messages: nur service_role
-- =========================
CREATE POLICY "service_role_all_messages" ON public.chat_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================
-- leads: nur service_role
-- =========================
CREATE POLICY "service_role_all_leads" ON public.leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================
-- knowledge_base: oeffentlich lesen, service_role schreiben
-- =========================
CREATE POLICY "public_read_knowledge_base" ON public.knowledge_base
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "service_role_all_knowledge_base" ON public.knowledge_base
    FOR ALL TO service_role USING (true) WITH CHECK (true);
