-- ============================================================
-- 005_schema_enhancements.sql
-- Schema-Erweiterungen fuer Intent Detection, Lead-Tracking
-- und Button-Conversion-Tracking
-- ============================================================

-- chat_sessions erweitern
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT false;

-- chat_messages erweitern
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'typed';
-- source_type Werte: 'typed' (frei getippt), 'quick_reply' (Start-Button), 'suggested_action' (dynamischer Button)

-- leads erweitern
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS plz TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS product_interest TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'low';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

-- Message-Count Trigger (spart HTTP-Roundtrip in N8N)
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions SET message_count = message_count + 1
  WHERE id = NEW.session_id::uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_message_count ON chat_messages;
CREATE TRIGGER trg_message_count
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_session_message_count();

-- Indizes
CREATE INDEX IF NOT EXISTS idx_leads_urgency ON public.leads(urgency);
CREATE INDEX IF NOT EXISTS idx_leads_notified ON public.leads(notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_messages_source_type ON public.chat_messages(source_type);
CREATE INDEX IF NOT EXISTS idx_messages_intent ON public.chat_messages(intent);
