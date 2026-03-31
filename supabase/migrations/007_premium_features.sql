-- ============================================================
-- 007_premium_features.sql
-- Premium Features: Feedback, Image Upload, A/B Testing,
-- Analytics Events + zugehoerige Views
-- ============================================================

-- =========================
-- Table: message_feedback
-- =========================
CREATE TABLE IF NOT EXISTS public.message_feedback (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id  BIGINT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    session_id  UUID   NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    rating      TEXT   NOT NULL CHECK (rating IN ('up', 'down')),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id  ON public.message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_session_id  ON public.message_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_rating      ON public.message_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_message_feedback_created_at  ON public.message_feedback(created_at);

-- =========================
-- Table: session_feedback
-- =========================
CREATE TABLE IF NOT EXISTS public.session_feedback (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id UUID   NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON public.session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_stars      ON public.session_feedback(stars);
CREATE INDEX IF NOT EXISTS idx_session_feedback_created_at ON public.session_feedback(created_at);

-- =========================
-- Table: uploaded_images
-- =========================
CREATE TABLE IF NOT EXISTS public.uploaded_images (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id       UUID   NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    storage_path     TEXT   NOT NULL,
    file_size        INTEGER,
    mime_type        TEXT,
    claude_analysis  JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_images_session_id ON public.uploaded_images(session_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_created_at ON public.uploaded_images(created_at);

-- =========================
-- Table: ab_experiments
-- =========================
CREATE TABLE IF NOT EXISTS public.ab_experiments (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       TEXT    NOT NULL UNIQUE,
    variants   JSONB   NOT NULL DEFAULT '[]'::jsonb,
    active     BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_name   ON public.ab_experiments(name);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_active ON public.ab_experiments(active) WHERE active = true;

-- =========================
-- Table: ab_assignments
-- =========================
CREATE TABLE IF NOT EXISTS public.ab_assignments (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id     UUID   NOT NULL REFERENCES public.chat_sessions(id)  ON DELETE CASCADE,
    experiment_id  BIGINT NOT NULL REFERENCES public.ab_experiments(id) ON DELETE CASCADE,
    variant        TEXT   NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, experiment_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_session_id    ON public.ab_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment_id ON public.ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_variant       ON public.ab_assignments(variant);

-- =========================
-- Table: analytics_events
-- =========================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id  UUID   REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    event_type  TEXT   NOT NULL,
    event_data  JSONB  DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id  ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type  ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at  ON public.analytics_events(created_at);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.message_feedback  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_feedback  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_experiments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_message_feedback"  ON public.message_feedback  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_session_feedback"  ON public.session_feedback  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_uploaded_images"   ON public.uploaded_images   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_ab_experiments"    ON public.ab_experiments    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_ab_assignments"    ON public.ab_assignments    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_analytics_events"  ON public.analytics_events  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Seed Data: Erstes A/B Experiment
-- ============================================================

INSERT INTO public.ab_experiments (name, variants, active)
VALUES ('proactive_message', '["A", "B", "C", "D"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Analytics Views
-- ============================================================

-- A/B Test Ergebnisse: Conversion-Rate pro Variante
CREATE OR REPLACE VIEW public.v_ab_test_results AS
SELECT
    e.name                                              AS experiment_name,
    a.variant,
    COUNT(DISTINCT a.session_id)                        AS assigned_sessions,
    COUNT(DISTINCT l.id)                                AS leads,
    ROUND(
        COUNT(DISTINCT l.id)::numeric
        / NULLIF(COUNT(DISTINCT a.session_id), 0) * 100, 1
    )                                                   AS conversion_rate_pct
FROM public.ab_assignments a
JOIN public.ab_experiments e ON a.experiment_id = e.id
LEFT JOIN public.leads l     ON a.session_id    = l.session_id
GROUP BY e.name, a.variant
ORDER BY e.name, a.variant;

-- Feature Usage: Event-Counts der letzten 30 Tage
CREATE OR REPLACE VIEW public.v_feature_usage AS
SELECT
    event_type,
    COUNT(*)                        AS event_count,
    COUNT(DISTINCT session_id)      AS unique_sessions,
    DATE(created_at)                AS date
FROM public.analytics_events
WHERE created_at > now() - interval '30 days'
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC, event_count DESC;

-- Funnel-Analyse: Sessions -> Engaged -> Leads -> Bookings
CREATE OR REPLACE VIEW public.v_funnel_analysis AS
SELECT
    DATE(s.created_at)                                              AS date,
    COUNT(DISTINCT s.id)                                            AS total_sessions,
    COUNT(DISTINCT CASE WHEN msg_counts.cnt >= 3 THEN s.id END)    AS engaged_sessions,
    COUNT(DISTINCT l.id)                                            AS leads,
    COUNT(DISTINCT CASE
        WHEN ae.event_type = 'booking_completed' THEN ae.session_id
    END)                                                            AS bookings
FROM public.chat_sessions s
LEFT JOIN (
    SELECT session_id, COUNT(*) AS cnt
    FROM public.chat_messages
    GROUP BY session_id
) msg_counts ON msg_counts.session_id = s.id
LEFT JOIN public.leads l             ON s.id = l.session_id
LEFT JOIN public.analytics_events ae ON s.id = ae.session_id
WHERE s.created_at > now() - interval '30 days'
GROUP BY DATE(s.created_at)
ORDER BY date DESC;

-- Feedback-Zusammenfassung: Thumbs-Up/Down Raten
CREATE OR REPLACE VIEW public.v_feedback_summary AS
SELECT
    DATE(created_at)                                                AS date,
    COUNT(*)                                                        AS total_ratings,
    COUNT(*) FILTER (WHERE rating = 'up')                           AS thumbs_up,
    COUNT(*) FILTER (WHERE rating = 'down')                         AS thumbs_down,
    ROUND(
        COUNT(*) FILTER (WHERE rating = 'up')::numeric
        / NULLIF(COUNT(*), 0) * 100, 1
    )                                                               AS positive_rate_pct
FROM public.message_feedback
WHERE created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
