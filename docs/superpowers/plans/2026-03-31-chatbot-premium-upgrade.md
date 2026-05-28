# RolloMax Chatbot Premium Upgrade - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the RolloMax chat widget with premium features: avatar, typing text, feedback buttons, sound toggle, product cards, image upload with Claude Vision, Cal.com booking, configurator popup, WhatsApp handover, proactive messages with A/B testing, and multi-language support.

**Architecture:** Extend the existing vanilla JS widget (Shadow DOM), add new Supabase tables for feedback/analytics/A/B testing, extend the N8N workflow for image handling and new endpoints, update the Claude system prompt for multi-language and product card triggers.

**Tech Stack:** Vanilla JS (Shadow DOM), Supabase (PostgreSQL + Storage), N8N workflows, Claude API (including Vision), Cal.com embed

---

## File Structure

### Widget (Frontend)
- **Modify:** `widget/rollomax-chat-widget.js` - All UI changes (avatar, typing, feedback, sound, product cards, upload, popups, proactive messages)
- **Create:** `widget/avatar.png` - Bot avatar image (64x64px)

### Database (Supabase)
- **Create:** `supabase/migrations/007_premium_features.sql` - New tables (message_feedback, session_feedback, uploaded_images, ab_experiments, ab_assignments, analytics_events) + views + storage bucket

### N8N Workflows
- **Modify:** `n8n-workflows/rollomax-chat.json` - Add image handling, multi-language prompt, product card triggers, action buttons
- **Create:** `n8n-workflows/rollomax-upload.json` - Image upload endpoint
- **Create:** `n8n-workflows/rollomax-feedback.json` - Feedback endpoint
- **Create:** `n8n-workflows/rollomax-track.json` - Analytics tracking endpoint

---

## Task 1: Database Migration - New Tables

**Files:**
- Create: `supabase/migrations/007_premium_features.sql`

- [ ] **Step 1: Create the migration file with all new tables**

```sql
-- ============================================================
-- 007_premium_features.sql
-- Premium Features: Feedback, Image Upload, A/B Testing, Analytics
-- ============================================================

-- Message Feedback (Daumen hoch/runter)
CREATE TABLE IF NOT EXISTS public.message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  rating text CHECK (rating IN ('up', 'down')) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Session Feedback (Sterne-Rating am Ende)
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  stars integer CHECK (stars >= 1 AND stars <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Uploaded Images (Fenster-Fotos)
CREATE TABLE IF NOT EXISTS public.uploaded_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_size integer,
  mime_type text,
  claude_analysis jsonb,
  created_at timestamptz DEFAULT now()
);

-- A/B Experiments
CREATE TABLE IF NOT EXISTS public.ab_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  variants jsonb NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- A/B Assignments (welcher User welche Variante)
CREATE TABLE IF NOT EXISTS public.ab_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  experiment_id uuid REFERENCES public.ab_experiments(id) ON DELETE CASCADE,
  variant text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, experiment_id)
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_message_feedback_session ON public.message_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_message ON public.message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON public.session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_session ON public.uploaded_images(session_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_session ON public.ab_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment ON public.ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);

-- RLS Policies
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Service Role kann alles
CREATE POLICY "Service role full access" ON public.message_feedback FOR ALL USING (true);
CREATE POLICY "Service role full access" ON public.session_feedback FOR ALL USING (true);
CREATE POLICY "Service role full access" ON public.uploaded_images FOR ALL USING (true);
CREATE POLICY "Service role full access" ON public.ab_experiments FOR ALL USING (true);
CREATE POLICY "Service role full access" ON public.ab_assignments FOR ALL USING (true);
CREATE POLICY "Service role full access" ON public.analytics_events FOR ALL USING (true);

-- Erstes A/B Experiment: Proaktive Nachrichten
INSERT INTO public.ab_experiments (name, variants, active) VALUES
  ('proactive_message', '["A", "B", "C", "D"]', true)
ON CONFLICT (name) DO NOTHING;

-- Analytics Views
CREATE OR REPLACE VIEW public.v_ab_test_results AS
SELECT 
  e.name as experiment_name,
  a.variant,
  COUNT(DISTINCT a.session_id) as sessions,
  COUNT(DISTINCT l.session_id) as leads,
  ROUND(COUNT(DISTINCT l.session_id)::numeric / NULLIF(COUNT(DISTINCT a.session_id), 0) * 100, 2) as conversion_rate
FROM public.ab_experiments e
JOIN public.ab_assignments a ON e.id = a.experiment_id
LEFT JOIN public.leads l ON a.session_id = l.session_id
WHERE e.active = true
GROUP BY e.name, a.variant
ORDER BY e.name, a.variant;

CREATE OR REPLACE VIEW public.v_feature_usage AS
SELECT 
  event_type,
  DATE(created_at) as date,
  COUNT(*) as count
FROM public.analytics_events
WHERE created_at > now() - interval '30 days'
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC, count DESC;

CREATE OR REPLACE VIEW public.v_funnel_analysis AS
SELECT 
  DATE(s.created_at) as date,
  COUNT(DISTINCT s.id) as sessions,
  COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN s.id END) as engaged,
  COUNT(DISTINCT l.session_id) as leads,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'booking_started' THEN s.id END) as bookings
FROM public.chat_sessions s
LEFT JOIN public.chat_messages m ON s.id = m.session_id AND m.role = 'user'
LEFT JOIN public.leads l ON s.id = l.session_id
LEFT JOIN public.analytics_events ae ON s.id = ae.session_id
WHERE s.created_at > now() - interval '30 days'
GROUP BY DATE(s.created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.v_feedback_summary AS
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE rating = 'up') as thumbs_up,
  COUNT(*) FILTER (WHERE rating = 'down') as thumbs_down,
  ROUND(COUNT(*) FILTER (WHERE rating = 'up')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as positive_rate
FROM public.message_feedback
WHERE created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

- [ ] **Step 2: Verify the file was created**

Run: `cat supabase/migrations/007_premium_features.sql | head -20`
Expected: First 20 lines of the migration file

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/007_premium_features.sql
git commit -m "feat(db): add premium features migration

Tables: message_feedback, session_feedback, uploaded_images,
ab_experiments, ab_assignments, analytics_events
Views: v_ab_test_results, v_feature_usage, v_funnel_analysis, v_feedback_summary"
```

---

## Task 2: Widget - Add New Icons and Sound

**Files:**
- Modify: `widget/rollomax-chat-widget.js` (lines 574-586, icon constants)

- [ ] **Step 1: Add new icon constants after existing icons**

Find this block (around line 574-580):
```javascript
  const ICON_CHAT = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
  const ICON_CLOSE = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  const ICON_DOTS = '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
  const ICON_SEND = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  const ICON_DELETE = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
  const ICON_REVOKE = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>';
```

Add after ICON_REVOKE:
```javascript
  const ICON_THUMB_UP = '<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';
  const ICON_THUMB_DOWN = '<svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>';
  const ICON_SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
  const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
  const ICON_CAMERA = '<svg viewBox="0 0 24 24"><path d="M12 15.2c1.77 0 3.2-1.43 3.2-3.2s-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2 1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>';
  const ICON_WHATSAPP = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  const ICON_CALENDAR = '<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>';
  const ICON_STAR = '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
  const ICON_STAR_OUTLINE = '<svg viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';

  /* ── Notification Sound (base64 encoded short pling) ───────────────── */
  const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNBrP+AAAAAAAAAAAAAAAAAAAAAP/7kGQAAANUMEoFPeACNQV40KEABIEBN3mEOYACMQV3cIQgAOBAEAwSAAABhGDEOC8XB4EAQBMEAQBAMI//FocBAEAYOf/+nO//4QQBP/+Xm///hBAEAwTB8Hz//5cHwfggCAIAgOAgP+D4Pg+D4IAgD/+UdxAGCYJg+D4P/9hIDAMEwTBMFB6Hw/B//lHcQBgmCYPg+D//Y//tgxAADwAABpAAAACAAADSAAAAEP/7YMQeA8AAAaQAAAAgAAA0gAAABEAAAGkAAAAIAAANIAAAARBu+eFtaJT/+2DEJgPAAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABA=';
```

- [ ] **Step 2: Verify icons were added**

Run: `grep -n "ICON_THUMB_UP\|ICON_CAMERA\|NOTIFICATION_SOUND" widget/rollomax-chat-widget.js | head -5`
Expected: Lines showing the new icon definitions

- [ ] **Step 3: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add new icons and notification sound

Icons: thumb up/down, sound on/off, camera, whatsapp, calendar, star
Sound: base64 encoded notification pling"
```

---

## Task 3: Widget - Add New CSS Styles

**Files:**
- Modify: `widget/rollomax-chat-widget.js` (STYLES constant, around line 570)

- [ ] **Step 1: Add new CSS styles before the closing backtick of STYLES**

Find the line `    .hidden { display: none !important; }` and add before the closing backtick:

```css

    /* ── Avatar ────────────────────────────────────────────────────── */
    .chat-avatar {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 50%;
      background: var(--accent);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      overflow: hidden;
    }
    .chat-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ── Sound toggle ──────────────────────────────────────────────── */
    .sound-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 0;
      transition: background 150ms ease-out;
    }
    .sound-btn:hover { background: rgba(255,255,255,0.1); }
    .sound-btn svg { width: 20px; height: 20px; fill: currentColor; pointer-events: none; }
    .sound-btn.is-muted { opacity: 0.5; }

    /* ── Message feedback (thumbs) ─────────────────────────────────── */
    .message-feedback {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      padding: 0 4px;
    }
    .feedback-btn {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border: none;
      background: transparent;
      color: #999;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      padding: 0;
      transition: color 150ms ease-out, background 150ms ease-out;
    }
    .feedback-btn:hover { color: var(--primary); background: rgba(0,0,0,0.05); }
    .feedback-btn.selected { color: var(--accent); }
    .feedback-btn svg { width: 16px; height: 16px; fill: currentColor; pointer-events: none; }

    /* ── Typing indicator with text ────────────────────────────────── */
    .typing-text {
      font-size: 14px;
      color: #666;
      margin-right: 8px;
    }

    /* ── Product card ──────────────────────────────────────────────── */
    .product-card {
      width: 280px;
      max-width: 100%;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin: 8px 0;
    }
    .product-card-image {
      width: 100%;
      height: 140px;
      object-fit: cover;
      background: var(--bot-bubble);
    }
    .product-card-content {
      padding: 12px;
    }
    .product-card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary);
      margin: 0 0 4px;
    }
    .product-card-desc {
      font-size: 14px;
      color: #666;
      margin: 0 0 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-card-btn {
      display: inline-block;
      padding: 8px 16px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 150ms ease-out;
    }
    .product-card-btn:hover { opacity: 0.9; }

    /* ── Image upload ──────────────────────────────────────────────── */
    .upload-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border: none;
      background: transparent;
      color: #999;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 0;
      transition: color 150ms ease-out;
      flex-shrink: 0;
    }
    .upload-btn:hover { color: var(--accent); }
    .upload-btn svg { width: 22px; height: 22px; fill: currentColor; pointer-events: none; }
    .upload-input { display: none; }

    .image-preview {
      align-self: flex-end;
      max-width: 200px;
      margin: 8px 0;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    .image-preview img {
      width: 100%;
      height: auto;
      display: block;
    }
    .image-preview-remove {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0,0,0,0.6);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    /* ── Action buttons (booking, whatsapp, etc) ───────────────────── */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      font-family: var(--font);
      cursor: pointer;
      min-height: 44px;
      transition: opacity 150ms ease-out;
    }
    .action-btn svg { width: 18px; height: 18px; fill: currentColor; }
    .action-btn.primary {
      background: var(--accent);
      color: #fff;
    }
    .action-btn.secondary {
      background: transparent;
      border: 1.5px solid var(--accent);
      color: var(--accent);
    }
    .action-btn.whatsapp {
      background: #25D366;
      color: #fff;
    }
    .action-btn:hover { opacity: 0.9; }

    /* ── Session feedback popup ────────────────────────────────────── */
    .feedback-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity 300ms ease-out;
    }
    .feedback-overlay.is-visible {
      opacity: 1;
      pointer-events: auto;
    }
    .feedback-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary);
      margin: 0 0 16px;
      text-align: center;
    }
    .feedback-stars {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .feedback-star {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: #DDD;
      cursor: pointer;
      padding: 0;
      transition: color 150ms ease-out, transform 150ms ease-out;
    }
    .feedback-star:hover { transform: scale(1.1); }
    .feedback-star.active { color: #FFB800; }
    .feedback-star svg { width: 100%; height: 100%; fill: currentColor; }
    .feedback-comment {
      width: 100%;
      max-width: 300px;
      padding: 12px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      font-size: 16px;
      font-family: var(--font);
      resize: none;
      margin-bottom: 16px;
    }
    .feedback-comment:focus { border-color: var(--accent); outline: none; }
    .feedback-submit {
      padding: 12px 32px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      min-height: 48px;
      transition: opacity 150ms ease-out;
    }
    .feedback-submit:hover { opacity: 0.9; }
    .feedback-skip {
      margin-top: 12px;
      background: none;
      border: none;
      color: #999;
      font-size: 14px;
      cursor: pointer;
    }
    .feedback-skip:hover { color: var(--primary); }

    /* ── Cal.com / Configurator modal ──────────────────────────────── */
    .modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      opacity: 0;
      pointer-events: none;
      transition: opacity 300ms ease-out;
    }
    .modal-overlay.is-visible {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-content {
      width: 90%;
      max-width: 400px;
      max-height: 80%;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid #E5E5E5;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary);
      margin: 0;
    }
    .modal-close {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .modal-close:hover { background: #F5F5F5; }
    .modal-close svg { width: 20px; height: 20px; fill: currentColor; }
    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .modal-body iframe {
      width: 100%;
      height: 400px;
      border: none;
    }

    /* ── Configurator steps ────────────────────────────────────────── */
    .config-progress {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
    }
    .config-progress-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #DDD;
    }
    .config-progress-dot.active { background: var(--accent); }
    .config-progress-dot.completed { background: var(--online); }
    .config-step { display: none; }
    .config-step.active { display: block; }
    .config-label {
      font-size: 16px;
      font-weight: 500;
      color: var(--primary);
      margin-bottom: 12px;
    }
    .config-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .config-option {
      padding: 14px 16px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      background: #fff;
      font-size: 16px;
      font-family: var(--font);
      text-align: left;
      cursor: pointer;
      transition: border-color 150ms ease-out;
    }
    .config-option:hover { border-color: var(--accent); }
    .config-option.selected {
      border-color: var(--accent);
      background: rgba(201,169,110,0.1);
    }
    .config-input {
      width: 100%;
      padding: 14px 16px;
      border: 1.5px solid #DDD;
      border-radius: 10px;
      font-size: 16px;
      font-family: var(--font);
      margin-bottom: 12px;
    }
    .config-input:focus { border-color: var(--accent); outline: none; }
    .config-nav {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }
    .config-nav button {
      flex: 1;
      padding: 14px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      min-height: 48px;
    }
    .config-back {
      background: #F5F5F5;
      border: none;
      color: var(--primary);
    }
    .config-next {
      background: var(--accent);
      border: none;
      color: #fff;
    }
```

- [ ] **Step 2: Verify styles were added**

Run: `grep -n "chat-avatar\|feedback-btn\|product-card\|modal-overlay" widget/rollomax-chat-widget.js | head -5`
Expected: Lines showing the new CSS classes

- [ ] **Step 3: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add CSS for premium UI components

Styles for: avatar, sound toggle, feedback thumbs, product cards,
image upload, action buttons, session feedback, cal.com modal, configurator"
```

---

## Task 4: Widget - Update Header with Avatar and Sound Toggle

**Files:**
- Modify: `widget/rollomax-chat-widget.js` (headerHTML method, around line 695)

- [ ] **Step 1: Update the headerHTML method**

Find the current headerHTML method:
```javascript
    headerHTML() {
      var closeBtnHTML = this.mode === 'bubble'
        ? '<button class="header-btn close-btn" aria-label="Chat schliessen">' + ICON_CLOSE + '</button>'
        : '';
      return '<div class="chat-header">' +
        '<div class="chat-header-title"><span class="online-dot"></span>RolloMax Sonnenschutz-Berater <span class="ki-badge">KI</span></div>' +
        '<div class="header-actions">' +
          '<button class="header-btn settings-btn" aria-label="Einstellungen">' + ICON_DOTS + '</button>' +
          closeBtnHTML +
          '<div class="settings-menu">' +
            '<button class="settings-item delete-chat-btn">' + ICON_DELETE + ' Chat-Verlauf loeschen</button>' +
            '<div class="settings-divider"></div>' +
            '<button class="settings-item revoke-consent-btn">' + ICON_REVOKE + ' Einwilligung widerrufen</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
```

Replace with:
```javascript
    headerHTML() {
      var closeBtnHTML = this.mode === 'bubble'
        ? '<button class="header-btn close-btn" aria-label="Chat schliessen">' + ICON_CLOSE + '</button>'
        : '';
      var soundIcon = this._soundEnabled ? ICON_SOUND_ON : ICON_SOUND_OFF;
      return '<div class="chat-header">' +
        '<div class="chat-avatar" id="chat-avatar"><img src="/widget/avatar.png" alt="RolloMax" onerror="this.style.display=\'none\';this.parentElement.textContent=\'R\'"></div>' +
        '<div class="chat-header-title"><span class="online-dot"></span>RolloMax Berater <span class="ki-badge">KI</span></div>' +
        '<div class="header-actions">' +
          '<button class="sound-btn' + (this._soundEnabled ? '' : ' is-muted') + '" aria-label="Sound umschalten">' + soundIcon + '</button>' +
          '<button class="header-btn settings-btn" aria-label="Einstellungen">' + ICON_DOTS + '</button>' +
          closeBtnHTML +
          '<div class="settings-menu">' +
            '<button class="settings-item delete-chat-btn">' + ICON_DELETE + ' Chat-Verlauf loeschen</button>' +
            '<div class="settings-divider"></div>' +
            '<button class="settings-item revoke-consent-btn">' + ICON_REVOKE + ' Einwilligung widerrufen</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
```

- [ ] **Step 2: Add sound state to constructor**

Find the constructor (around line 588):
```javascript
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.messages = [];
      this.isLoading = false;
      this.consentGiven = false;
      this.sessionId = null;
      this.token = null;
      this.mode = 'bubble';
      this.apiUrl = 'https://chat.rollomax.at';
      this._settingsOpen = false;
      this._abortController = null;
    }
```

Add after `this._abortController = null;`:
```javascript
      this._soundEnabled = localStorage.getItem('rollomax_sound') === 'true';
      this._audio = null;
      this._feedbackShown = false;
      this._proactiveShown = false;
      this._lastActivityTime = Date.now();
      this._abVariant = null;
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "_soundEnabled\|chat-avatar" widget/rollomax-chat-widget.js | head -5`
Expected: Lines showing the new properties and avatar element

- [ ] **Step 4: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add avatar and sound toggle to header

- Avatar with fallback to 'R' letter
- Sound toggle button with localStorage persistence
- New state properties for premium features"
```

---

## Task 5: Widget - Update Typing Indicator

**Files:**
- Modify: `widget/rollomax-chat-widget.js` (typing indicator rendering)

- [ ] **Step 1: Find and update the typing indicator HTML**

Search for the typing indicator (it's created dynamically). Find where typing dots are rendered and update to include text.

In the `showTyping` method or wherever typing indicator is created, the HTML should become:
```javascript
    showTyping() {
      if (this.$messagesArea.querySelector('.typing-indicator')) return;
      var typing = document.createElement('div');
      typing.className = 'typing-indicator';
      typing.innerHTML = '<span class="typing-text">RolloMax tippt</span><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      this.$messagesArea.appendChild(typing);
      this.scrollToBottom();
    }
```

- [ ] **Step 2: Verify change**

Run: `grep -n "typing-text\|RolloMax tippt" widget/rollomax-chat-widget.js`
Expected: Line showing the new typing indicator HTML

- [ ] **Step 3: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): update typing indicator with text

Shows 'RolloMax tippt' text alongside animated dots"
```

---

## Task 6: Widget - Add Message Feedback Buttons

**Files:**
- Modify: `widget/rollomax-chat-widget.js` (addMessage method and new feedback handler)

- [ ] **Step 1: Update addMessage to include feedback buttons for bot messages**

Find the `addMessage` method and update the bot message rendering to include feedback buttons.

The message HTML for bot messages should include:
```javascript
    addMessage(text, role, extras) {
      var msg = {
        id: this.generateMessageId(),
        text: text,
        role: role,
        time: new Date(),
        extras: extras || {}
      };
      this.messages.push(msg);
      this.renderMessage(msg);
      this.scrollToBottom();
      
      // Play sound for bot messages if enabled
      if (role === 'bot' && this._soundEnabled) {
        this.playNotificationSound();
      }
      
      return msg;
    }

    generateMessageId() {
      return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    renderMessage(msg) {
      var div = document.createElement('div');
      div.className = 'message ' + msg.role;
      div.setAttribute('data-message-id', msg.id);
      
      var contentHTML = '<div class="message-content">' + this.escapeHtml(msg.text) + '</div>';
      var metaHTML = '<div class="message-meta">';
      
      if (msg.role === 'bot') {
        metaHTML += '<span class="message-ki-badge">KI</span>';
      }
      metaHTML += '<span class="message-time">' + this.formatTime(msg.time) + '</span>';
      metaHTML += '</div>';
      
      // Add feedback buttons for bot messages
      var feedbackHTML = '';
      if (msg.role === 'bot') {
        feedbackHTML = '<div class="message-feedback" data-message-id="' + msg.id + '">' +
          '<button class="feedback-btn" data-rating="up" aria-label="Hilfreich">' + ICON_THUMB_UP + '</button>' +
          '<button class="feedback-btn" data-rating="down" aria-label="Nicht hilfreich">' + ICON_THUMB_DOWN + '</button>' +
          '</div>';
      }
      
      div.innerHTML = contentHTML + metaHTML + feedbackHTML;
      
      // Add product card if present
      if (msg.extras && msg.extras.product_card) {
        div.appendChild(this.createProductCard(msg.extras.product_card));
      }
      
      // Add action buttons if present
      if (msg.extras && msg.extras.actions && msg.extras.actions.length > 0) {
        div.appendChild(this.createActionButtons(msg.extras.actions));
      }
      
      this.$messagesArea.appendChild(div);
    }
```

- [ ] **Step 2: Add feedback button click handler in bindEvents**

Add to bindEvents method:
```javascript
      // Feedback buttons (delegated)
      this.$messagesArea.addEventListener('click', function(e) {
        var btn = e.target.closest('.feedback-btn');
        if (!btn) return;
        var feedbackDiv = btn.closest('.message-feedback');
        var messageId = feedbackDiv.getAttribute('data-message-id');
        var rating = btn.getAttribute('data-rating');
        
        // Toggle selection
        feedbackDiv.querySelectorAll('.feedback-btn').forEach(function(b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        
        // Send feedback
        self.sendFeedback('message', { message_id: messageId, rating: rating });
      });
```

- [ ] **Step 3: Add sendFeedback method**

```javascript
    sendFeedback(type, data) {
      var self = this;
      var payload = {
        session_id: this.sessionId,
        feedback_type: type,
        data: data
      };
      
      fetch(this.apiUrl + '/webhook/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Widget-Token': this.token
        },
        body: JSON.stringify(payload)
      }).catch(function(err) {
        console.warn('Feedback send failed:', err);
      });
    }
```

- [ ] **Step 4: Verify changes**

Run: `grep -n "message-feedback\|sendFeedback\|ICON_THUMB" widget/rollomax-chat-widget.js | head -10`
Expected: Lines showing feedback button HTML and handler

- [ ] **Step 5: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add thumbs up/down feedback for bot messages

- Feedback buttons under each bot message
- Click handler with visual selection state
- API call to feedback endpoint"
```

---

## Task 7: Widget - Add Sound Toggle Functionality

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add sound toggle handler in bindEvents**

```javascript
      // Sound toggle
      var soundBtn = this.shadowRoot.querySelector('.sound-btn');
      if (soundBtn) {
        soundBtn.addEventListener('click', function() {
          self._soundEnabled = !self._soundEnabled;
          localStorage.setItem('rollomax_sound', self._soundEnabled ? 'true' : 'false');
          soundBtn.innerHTML = self._soundEnabled ? ICON_SOUND_ON : ICON_SOUND_OFF;
          soundBtn.classList.toggle('is-muted', !self._soundEnabled);
          
          // Play test sound when enabling
          if (self._soundEnabled) {
            self.playNotificationSound();
          }
        });
      }
```

- [ ] **Step 2: Add playNotificationSound method**

```javascript
    playNotificationSound() {
      if (!this._soundEnabled) return;
      try {
        if (!this._audio) {
          this._audio = new Audio(NOTIFICATION_SOUND);
          this._audio.volume = 0.3;
        }
        this._audio.currentTime = 0;
        this._audio.play().catch(function() {});
      } catch(e) {}
    }
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "playNotificationSound\|sound-btn" widget/rollomax-chat-widget.js | head -5`
Expected: Lines showing sound methods and event handler

- [ ] **Step 4: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): implement sound toggle functionality

- Toggle button updates icon and localStorage
- Notification sound plays on new bot messages
- Volume set to 30%"
```

---

## Task 8: Widget - Add Image Upload

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Update input area HTML to include upload button**

Find the `chatBodyHTML` method and update the input area:
```javascript
    chatBodyHTML() {
      return '<div class="messages-area hidden" id="messages-area"></div>' +
        '<div class="suggested-actions hidden" id="suggested-actions"></div>' +
        '<div class="input-area hidden" id="input-area">' +
          '<button class="upload-btn" id="upload-btn" aria-label="Bild hochladen">' + ICON_CAMERA + '</button>' +
          '<input type="file" class="upload-input" id="upload-input" accept="image/jpeg,image/png,image/webp">' +
          '<textarea id="msg-input" rows="1" placeholder="Nachricht eingeben..." aria-label="Nachricht"></textarea>' +
          '<button class="send-btn" id="send-btn" aria-label="Senden" disabled>' + ICON_SEND + '</button>' +
        '</div>' +
        '<div class="feedback-overlay" id="feedback-overlay"></div>' +
        '<div class="modal-overlay" id="modal-overlay"></div>';
    }
```

- [ ] **Step 2: Add upload elements to cacheElements**

```javascript
      this.$uploadBtn = s.querySelector('#upload-btn');
      this.$uploadInput = s.querySelector('#upload-input');
      this.$feedbackOverlay = s.querySelector('#feedback-overlay');
      this.$modalOverlay = s.querySelector('#modal-overlay');
```

- [ ] **Step 3: Add upload handlers in bindEvents**

```javascript
      // Image upload
      if (this.$uploadBtn && this.$uploadInput) {
        this.$uploadBtn.addEventListener('click', function() {
          self.$uploadInput.click();
        });
        
        this.$uploadInput.addEventListener('change', function(e) {
          var file = e.target.files[0];
          if (!file) return;
          
          // Validate
          if (file.size > 5 * 1024 * 1024) {
            alert('Bild zu gross. Maximal 5MB erlaubt.');
            return;
          }
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Nur JPG, PNG oder WebP erlaubt.');
            return;
          }
          
          self.uploadImage(file);
          e.target.value = '';
        });
      }
```

- [ ] **Step 4: Add uploadImage method**

```javascript
    uploadImage(file) {
      var self = this;
      var reader = new FileReader();
      
      reader.onload = function(e) {
        var base64 = e.target.result;
        
        // Show preview in chat
        self.addImagePreview(base64);
        
        // Upload to server
        self.showTyping();
        
        fetch(self.apiUrl + '/webhook/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-Token': self.token
          },
          body: JSON.stringify({
            session_id: self.sessionId,
            image: base64,
            mime_type: file.type
          })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          self.hideTyping();
          if (data.analysis) {
            self.addMessage(data.analysis, 'bot');
          }
          self.trackEvent('image_uploaded');
        })
        .catch(function(err) {
          self.hideTyping();
          self.addMessage('Bild konnte nicht analysiert werden. Bitte versuchen Sie es erneut.', 'bot');
        });
      };
      
      reader.readAsDataURL(file);
    }

    addImagePreview(base64) {
      var div = document.createElement('div');
      div.className = 'image-preview';
      div.innerHTML = '<img src="' + base64 + '" alt="Hochgeladenes Bild">';
      this.$messagesArea.appendChild(div);
      this.scrollToBottom();
    }
```

- [ ] **Step 5: Verify changes**

Run: `grep -n "uploadImage\|upload-btn\|ICON_CAMERA" widget/rollomax-chat-widget.js | head -10`
Expected: Lines showing upload functionality

- [ ] **Step 6: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add image upload with preview

- Camera button in input area
- File validation (5MB, jpg/png/webp)
- Preview in chat
- Upload to backend for Claude Vision analysis"
```

---

## Task 9: Widget - Add Product Cards

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add createProductCard method**

```javascript
    createProductCard(card) {
      var div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = 
        '<img class="product-card-image" src="' + this.escapeHtml(card.image || '') + '" alt="' + this.escapeHtml(card.title || '') + '" onerror="this.style.display=\'none\'">' +
        '<div class="product-card-content">' +
          '<h4 class="product-card-title">' + this.escapeHtml(card.title || '') + '</h4>' +
          '<p class="product-card-desc">' + this.escapeHtml(card.description || '') + '</p>' +
          '<a class="product-card-btn" href="' + this.escapeHtml(card.url || '#') + '" target="_blank" rel="noopener">Mehr erfahren</a>' +
        '</div>';
      
      // Track click
      var self = this;
      div.querySelector('.product-card-btn').addEventListener('click', function() {
        self.trackEvent('product_card_clicked', { product: card.type });
      });
      
      return div;
    }
```

- [ ] **Step 2: Add escapeHtml helper if not exists**

```javascript
    escapeHtml(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "createProductCard\|product-card-btn" widget/rollomax-chat-widget.js | head -5`
Expected: Lines showing product card creation

- [ ] **Step 4: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add product card component

- Card with image, title, description, CTA button
- Click tracking for analytics
- XSS-safe with escapeHtml"
```

---

## Task 10: Widget - Add Action Buttons (Booking, WhatsApp, Configurator)

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add createActionButtons method**

```javascript
    createActionButtons(actions) {
      var self = this;
      var div = document.createElement('div');
      div.className = 'action-buttons';
      
      actions.forEach(function(action) {
        var btn = document.createElement('button');
        
        switch(action) {
          case 'booking':
            btn.className = 'action-btn primary';
            btn.innerHTML = ICON_CALENDAR + ' Termin buchen';
            btn.addEventListener('click', function() {
              self.openBookingModal();
            });
            break;
            
          case 'whatsapp':
            btn.className = 'action-btn whatsapp';
            btn.innerHTML = ICON_WHATSAPP + ' WhatsApp Chat';
            btn.addEventListener('click', function() {
              self.openWhatsApp();
            });
            break;
            
          case 'configurator':
            btn.className = 'action-btn secondary';
            btn.innerHTML = 'Anfrage stellen';
            btn.addEventListener('click', function() {
              self.openConfiguratorModal();
            });
            break;
        }
        
        div.appendChild(btn);
      });
      
      return div;
    }
```

- [ ] **Step 2: Add openWhatsApp method**

```javascript
    openWhatsApp() {
      var lastTopic = this.getLastTopic();
      var text = encodeURIComponent('Hallo, ich komme vom Website-Chat und haette eine Frage' + (lastTopic ? ' zu ' + lastTopic : '') + '.');
      var url = 'https://wa.me/436509907599?text=' + text;
      window.open(url, '_blank');
      this.trackEvent('whatsapp_handover');
    }

    getLastTopic() {
      // Find last product mention in conversation
      var topics = ['Rollladen', 'Raffstore', 'Markise', 'Jalousie', 'Plissee', 'Insektenschutz'];
      for (var i = this.messages.length - 1; i >= 0; i--) {
        var msg = this.messages[i];
        for (var j = 0; j < topics.length; j++) {
          if (msg.text && msg.text.toLowerCase().indexOf(topics[j].toLowerCase()) !== -1) {
            return topics[j];
          }
        }
      }
      return '';
    }
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "createActionButtons\|openWhatsApp\|whatsapp_handover" widget/rollomax-chat-widget.js | head -10`
Expected: Lines showing action button functionality

- [ ] **Step 4: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add action buttons for booking, WhatsApp, configurator

- Booking button opens Cal.com modal
- WhatsApp button opens chat with prefilled message
- Configurator button opens step-by-step form"
```

---

## Task 11: Widget - Add Booking Modal (Cal.com)

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add openBookingModal method**

```javascript
    openBookingModal() {
      var calUrl = this.getAttribute('data-calcom-url') || 'https://cal.com/rollomax/beratung';
      
      this.$modalOverlay.innerHTML = 
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title">Beratungstermin buchen</h3>' +
            '<button class="modal-close">' + ICON_CLOSE + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<iframe src="' + calUrl + '?embed=true" frameborder="0"></iframe>' +
          '</div>' +
        '</div>';
      
      this.$modalOverlay.classList.add('is-visible');
      this.trackEvent('booking_started');
      
      var self = this;
      this.$modalOverlay.querySelector('.modal-close').addEventListener('click', function() {
        self.closeModal();
      });
      this.$modalOverlay.addEventListener('click', function(e) {
        if (e.target === self.$modalOverlay) {
          self.closeModal();
        }
      });
    }

    closeModal() {
      this.$modalOverlay.classList.remove('is-visible');
      this.$modalOverlay.innerHTML = '';
    }
```

- [ ] **Step 2: Verify changes**

Run: `grep -n "openBookingModal\|calcom-url\|booking_started" widget/rollomax-chat-widget.js | head -5`
Expected: Lines showing booking modal functionality

- [ ] **Step 3: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add Cal.com booking modal

- Configurable via data-calcom-url attribute
- Embedded iframe in modal overlay
- Close on X or backdrop click"
```

---

## Task 12: Widget - Add Configurator Modal

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add openConfiguratorModal method**

```javascript
    openConfiguratorModal() {
      var self = this;
      this._configStep = 0;
      this._configData = {};
      
      var steps = [
        { label: 'Was suchen Sie?', options: ['Rollladen', 'Raffstore', 'Markise', 'Jalousie', 'Plissee', 'Insektenschutz', 'Anderes'] },
        { label: 'Neubau oder Nachruestung?', options: ['Neubau', 'Nachruestung', 'Reparatur'] },
        { label: 'Wie viele Fenster/Tueren?', input: 'number', placeholder: 'z.B. 5' },
        { label: 'Ihre Postleitzahl?', input: 'text', placeholder: 'z.B. 1020' },
        { label: 'Wie erreichen wir Sie?', fields: ['name', 'email', 'phone'] }
      ];
      
      this._configSteps = steps;
      this.renderConfiguratorStep();
    }

    renderConfiguratorStep() {
      var self = this;
      var step = this._configSteps[this._configStep];
      var totalSteps = this._configSteps.length;
      
      var progressHTML = '<div class="config-progress">';
      for (var i = 0; i < totalSteps; i++) {
        var cls = i < this._configStep ? 'completed' : (i === this._configStep ? 'active' : '');
        progressHTML += '<div class="config-progress-dot ' + cls + '"></div>';
      }
      progressHTML += '</div>';
      
      var contentHTML = '<div class="config-label">' + step.label + '</div>';
      
      if (step.options) {
        contentHTML += '<div class="config-options">';
        step.options.forEach(function(opt) {
          contentHTML += '<button class="config-option" data-value="' + opt + '">' + opt + '</button>';
        });
        contentHTML += '</div>';
      } else if (step.input) {
        contentHTML += '<input type="' + step.input + '" class="config-input" placeholder="' + (step.placeholder || '') + '">';
      } else if (step.fields) {
        contentHTML += '<input type="text" class="config-input" placeholder="Ihr Name" data-field="name">';
        contentHTML += '<input type="email" class="config-input" placeholder="E-Mail Adresse" data-field="email">';
        contentHTML += '<input type="tel" class="config-input" placeholder="Telefonnummer" data-field="phone">';
      }
      
      var navHTML = '<div class="config-nav">';
      if (this._configStep > 0) {
        navHTML += '<button class="config-back">Zurueck</button>';
      }
      if (this._configStep < totalSteps - 1) {
        navHTML += '<button class="config-next">Weiter</button>';
      } else {
        navHTML += '<button class="config-next">Absenden</button>';
      }
      navHTML += '</div>';
      
      this.$modalOverlay.innerHTML = 
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title">Anfrage stellen</h3>' +
            '<button class="modal-close">' + ICON_CLOSE + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            progressHTML +
            contentHTML +
            navHTML +
          '</div>' +
        '</div>';
      
      this.$modalOverlay.classList.add('is-visible');
      
      // Event handlers
      this.$modalOverlay.querySelector('.modal-close').addEventListener('click', function() {
        self.closeModal();
      });
      
      var backBtn = this.$modalOverlay.querySelector('.config-back');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          self._configStep--;
          self.renderConfiguratorStep();
        });
      }
      
      var nextBtn = this.$modalOverlay.querySelector('.config-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          self.saveConfiguratorStep();
        });
      }
      
      // Option click
      this.$modalOverlay.querySelectorAll('.config-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
          self.$modalOverlay.querySelectorAll('.config-option').forEach(function(o) {
            o.classList.remove('selected');
          });
          opt.classList.add('selected');
        });
      });
    }

    saveConfiguratorStep() {
      var step = this._configSteps[this._configStep];
      
      if (step.options) {
        var selected = this.$modalOverlay.querySelector('.config-option.selected');
        if (!selected) {
          alert('Bitte waehlen Sie eine Option.');
          return;
        }
        this._configData['step' + this._configStep] = selected.getAttribute('data-value');
      } else if (step.input) {
        var input = this.$modalOverlay.querySelector('.config-input');
        if (!input.value.trim()) {
          alert('Bitte fuellen Sie das Feld aus.');
          return;
        }
        this._configData['step' + this._configStep] = input.value.trim();
      } else if (step.fields) {
        var name = this.$modalOverlay.querySelector('[data-field="name"]').value.trim();
        var email = this.$modalOverlay.querySelector('[data-field="email"]').value.trim();
        var phone = this.$modalOverlay.querySelector('[data-field="phone"]').value.trim();
        
        if (!name || (!email && !phone)) {
          alert('Bitte geben Sie Ihren Namen und mindestens E-Mail oder Telefon an.');
          return;
        }
        this._configData.name = name;
        this._configData.email = email;
        this._configData.phone = phone;
      }
      
      if (this._configStep < this._configSteps.length - 1) {
        this._configStep++;
        this.renderConfiguratorStep();
      } else {
        this.submitConfigurator();
      }
    }

    submitConfigurator() {
      var self = this;
      var payload = {
        session_id: this.sessionId,
        consent: true,
        lead_data: {
          name: this._configData.name,
          email: this._configData.email,
          phone: this._configData.phone,
          interest: this._configData.step0,
          project_type: this._configData.step1,
          quantity: this._configData.step2,
          plz: this._configData.step3
        }
      };
      
      fetch(this.apiUrl + '/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Widget-Token': this.token
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          message: 'Neue Anfrage via Konfigurator: ' + this._configData.step0 + ', ' + this._configData.step1,
          consent: true,
          lead_data: payload.lead_data
        })
      });
      
      this.closeModal();
      this.addMessage('Vielen Dank fuer Ihre Anfrage! Wir melden uns in Kuerze bei Ihnen.', 'bot');
      this.trackEvent('configurator_completed', { product: this._configData.step0 });
    }
```

- [ ] **Step 2: Verify changes**

Run: `grep -n "openConfiguratorModal\|submitConfigurator\|config-step" widget/rollomax-chat-widget.js | head -10`
Expected: Lines showing configurator functionality

- [ ] **Step 3: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add step-by-step configurator modal

- 5 steps: product, project type, quantity, PLZ, contact
- Progress indicator
- Validation per step
- Submits as lead to backend"
```

---

## Task 13: Widget - Add Session Feedback Popup

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add showSessionFeedback method**

```javascript
    showSessionFeedback() {
      if (this._feedbackShown) return;
      if (this.messages.filter(function(m) { return m.role === 'bot'; }).length < 3) return;
      
      this._feedbackShown = true;
      this._selectedStars = 0;
      
      var starsHTML = '';
      for (var i = 1; i <= 5; i++) {
        starsHTML += '<button class="feedback-star" data-star="' + i + '">' + ICON_STAR_OUTLINE + '</button>';
      }
      
      this.$feedbackOverlay.innerHTML = 
        '<h3 class="feedback-title">Wie war Ihre Erfahrung?</h3>' +
        '<div class="feedback-stars">' + starsHTML + '</div>' +
        '<textarea class="feedback-comment" rows="3" placeholder="Was koennen wir verbessern? (optional)"></textarea>' +
        '<button class="feedback-submit">Absenden</button>' +
        '<button class="feedback-skip">Ueberspringen</button>';
      
      this.$feedbackOverlay.classList.add('is-visible');
      
      var self = this;
      
      // Star selection
      this.$feedbackOverlay.querySelectorAll('.feedback-star').forEach(function(star) {
        star.addEventListener('click', function() {
          self._selectedStars = parseInt(star.getAttribute('data-star'));
          self.updateFeedbackStars();
        });
      });
      
      // Submit
      this.$feedbackOverlay.querySelector('.feedback-submit').addEventListener('click', function() {
        if (self._selectedStars === 0) {
          alert('Bitte waehlen Sie eine Bewertung.');
          return;
        }
        var comment = self.$feedbackOverlay.querySelector('.feedback-comment').value.trim();
        self.sendFeedback('session', { stars: self._selectedStars, comment: comment });
        self.closeFeedbackOverlay();
      });
      
      // Skip
      this.$feedbackOverlay.querySelector('.feedback-skip').addEventListener('click', function() {
        self.closeFeedbackOverlay();
      });
    }

    updateFeedbackStars() {
      var self = this;
      this.$feedbackOverlay.querySelectorAll('.feedback-star').forEach(function(star, i) {
        var starNum = i + 1;
        star.innerHTML = starNum <= self._selectedStars ? ICON_STAR : ICON_STAR_OUTLINE;
        star.classList.toggle('active', starNum <= self._selectedStars);
      });
    }

    closeFeedbackOverlay() {
      this.$feedbackOverlay.classList.remove('is-visible');
      this.$feedbackOverlay.innerHTML = '';
    }
```

- [ ] **Step 2: Add trigger for feedback popup**

Add to bindEvents or create a timer:
```javascript
      // Feedback trigger after 2 min inactivity
      setInterval(function() {
        if (self.isOpen && self.consentGiven && !self._feedbackShown) {
          var inactiveTime = Date.now() - self._lastActivityTime;
          if (inactiveTime > 120000) { // 2 minutes
            self.showSessionFeedback();
          }
        }
      }, 30000);
```

Update _lastActivityTime when user sends message:
```javascript
    handleSend() {
      // ... existing code ...
      this._lastActivityTime = Date.now();
      // ... rest of code ...
    }
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "showSessionFeedback\|feedback-overlay\|_selectedStars" widget/rollomax-chat-widget.js | head -10`
Expected: Lines showing session feedback functionality

- [ ] **Step 4: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add session feedback popup with star rating

- Shows after 3+ bot messages and 2 min inactivity
- 5-star rating with optional comment
- Skip option available"
```

---

## Task 14: Widget - Add Proactive Messages with A/B Testing

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add proactive message variants and timer**

```javascript
    initProactiveMessages() {
      var self = this;
      
      // A/B variants
      var variants = {
        'A': 'Kann ich Ihnen bei etwas helfen?',
        'B': 'Sind Sie sich unsicher, was bei Ihnen passt?',
        'C': 'Soll ich Ihnen einen Vorschlag machen?',
        'D': 'Haben Sie Fragen zum Sonnenschutz?'
      };
      
      // Get or assign variant
      this._abVariant = sessionStorage.getItem('rollomax_ab_variant');
      if (!this._abVariant) {
        var keys = Object.keys(variants);
        this._abVariant = keys[Math.floor(Math.random() * keys.length)];
        sessionStorage.setItem('rollomax_ab_variant', this._abVariant);
      }
      
      // Tooltip timer (45-60 seconds, randomized)
      var delay = 45000 + Math.random() * 15000;
      
      this._proactiveTimer = setTimeout(function() {
        if (!self.isOpen && !self._proactiveShown && self.$tooltip) {
          self.$tooltip.textContent = variants[self._abVariant];
          self.$tooltip.classList.add('is-visible');
          self._proactiveShown = true;
          self.trackEvent('proactive_shown', { variant: self._abVariant });
        }
      }, delay);
      
      // In-chat proactive (90 seconds of inactivity while chat is open)
      this._inChatProactiveTimer = null;
      this.resetInChatProactive();
    }

    resetInChatProactive() {
      var self = this;
      if (this._inChatProactiveTimer) {
        clearTimeout(this._inChatProactiveTimer);
      }
      
      this._inChatProactiveTimer = setTimeout(function() {
        if (self.isOpen && self.consentGiven && !self._inChatProactiveShown) {
          self._inChatProactiveShown = true;
          self.addMessage('Kann ich Ihnen noch bei etwas helfen?', 'bot');
        }
      }, 90000);
    }
```

- [ ] **Step 2: Call initProactiveMessages in connectedCallback**

Add after consent check:
```javascript
      this.initProactiveMessages();
```

- [ ] **Step 3: Reset timer on user activity**

In handleSend:
```javascript
      this.resetInChatProactive();
```

- [ ] **Step 4: Track tooltip click**

In the bubble button click handler:
```javascript
      if (this._proactiveShown && !this.isOpen) {
        this.trackEvent('proactive_clicked', { variant: this._abVariant });
      }
```

- [ ] **Step 5: Verify changes**

Run: `grep -n "initProactiveMessages\|_abVariant\|proactive_shown" widget/rollomax-chat-widget.js | head -10`
Expected: Lines showing proactive message functionality

- [ ] **Step 6: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add proactive messages with A/B testing

- 4 tooltip variants (A/B/C/D)
- Random assignment, stored in sessionStorage
- Shows after 45-60s on page
- In-chat nudge after 90s inactivity
- Event tracking for analytics"
```

---

## Task 15: Widget - Add Analytics Tracking

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Add trackEvent method**

```javascript
    trackEvent(eventType, eventData) {
      var payload = {
        session_id: this.sessionId,
        event_type: eventType,
        event_data: eventData || {},
        ab_variant: this._abVariant
      };
      
      fetch(this.apiUrl + '/webhook/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Widget-Token': this.token
        },
        body: JSON.stringify(payload)
      }).catch(function() {});
    }
```

- [ ] **Step 2: Add chat_opened tracking**

In openChat method:
```javascript
      this.trackEvent('chat_opened');
```

- [ ] **Step 3: Add lead_captured tracking**

After successful lead form submission:
```javascript
      this.trackEvent('lead_captured', { source: 'chat' });
```

- [ ] **Step 4: Verify changes**

Run: `grep -n "trackEvent" widget/rollomax-chat-widget.js | head -15`
Expected: Multiple lines showing trackEvent calls throughout the code

- [ ] **Step 5: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): add analytics event tracking

Events tracked: chat_opened, proactive_shown, proactive_clicked,
feedback_submitted, product_card_clicked, image_uploaded,
booking_started, configurator_completed, whatsapp_handover, lead_captured"
```

---

## Task 16: N8N - Create Image Upload Workflow

**Files:**
- Create: `n8n-workflows/rollomax-upload.json`

- [ ] **Step 1: Create the workflow file**

```json
{
  "name": "RolloMax Image Upload",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "upload-image",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "upload-webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "upload-image-webhook"
    },
    {
      "parameters": {
        "language": "javaScript",
        "jsCode": "const body = $input.first().json.body;\nconst headers = $input.first().json.headers;\n\n// Auth check\nconst token = $env.WIDGET_AUTH_TOKEN;\nif (headers['x-widget-token'] !== token) {\n  throw new Error('UNAUTHORIZED');\n}\n\nif (!body.session_id || !body.image) {\n  throw new Error('Missing session_id or image');\n}\n\n// Extract base64 data\nconst base64Match = body.image.match(/^data:image\\/(\\w+);base64,(.+)$/);\nif (!base64Match) {\n  throw new Error('Invalid image format');\n}\n\nconst mimeType = 'image/' + base64Match[1];\nconst base64Data = base64Match[2];\nconst buffer = Buffer.from(base64Data, 'base64');\n\nif (buffer.length > 5 * 1024 * 1024) {\n  throw new Error('Image too large');\n}\n\nconst fileName = body.session_id + '_' + Date.now() + '.' + base64Match[1];\n\nreturn [{\n  json: {\n    session_id: body.session_id,\n    file_name: fileName,\n    mime_type: mimeType,\n    base64_data: base64Data,\n    file_size: buffer.length\n  }\n}];"
      },
      "id": "validate-image",
      "name": "Validate Image",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.SUPABASE_URL}}/storage/v1/object/chat-uploads/{{$json.file_name}}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{$env.SUPABASE_SERVICE_KEY}}"},
            {"name": "Authorization", "value": "={{ 'Bearer ' + $env.SUPABASE_SERVICE_KEY }}"},
            {"name": "Content-Type", "value": "={{$json.mime_type}}"}
          ]
        },
        "sendBody": true,
        "contentType": "raw",
        "body": "={{Buffer.from($json.base64_data, 'base64')}}",
        "options": {}
      },
      "id": "upload-storage",
      "name": "Upload to Storage",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.SUPABASE_URL}}/rest/v1/uploaded_images",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{$env.SUPABASE_SERVICE_KEY}}"},
            {"name": "Authorization", "value": "={{ 'Bearer ' + $env.SUPABASE_SERVICE_KEY }}"},
            {"name": "Content-Type", "value": "application/json"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ session_id: $('Validate Image').first().json.session_id, storage_path: $('Validate Image').first().json.file_name, file_size: $('Validate Image').first().json.file_size, mime_type: $('Validate Image').first().json.mime_type }) }}",
        "options": {}
      },
      "id": "save-reference",
      "name": "Save Reference",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.anthropic.com/v1/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "x-api-key", "value": "={{$env.ANTHROPIC_API_KEY}}"},
            {"name": "anthropic-version", "value": "2023-06-01"},
            {"name": "content-type", "value": "application/json"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: $('Validate Image').first().json.mime_type, data: $('Validate Image').first().json.base64_data }}, { type: 'text', text: 'Du bist ein Sonnenschutz-Experte. Analysiere dieses Bild eines Fensters. Bestimme: 1) Fenstertyp (Kunststoff, Holz, Alu), 2) Geschaetzte Masse (Breite x Hoehe in cm), 3) Welcher Sonnenschutz wuerde passen (Rollladen, Raffstore, etc). Antworte auf Deutsch, kurz und praegnant.' }]}] }) }}",
        "options": {"timeout": 30000}
      },
      "id": "claude-vision",
      "name": "Claude Vision Analysis",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "language": "javaScript",
        "jsCode": "const response = $input.first().json;\nconst analysis = response.content && response.content[0] ? response.content[0].text : 'Bildanalyse konnte nicht durchgefuehrt werden.';\n\nreturn [{ json: { analysis: analysis } }];"
      },
      "id": "parse-analysis",
      "name": "Parse Analysis",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1250, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true, analysis: $json.analysis }) }}",
        "options": {}
      },
      "id": "response",
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1450, 300]
    }
  ],
  "connections": {
    "Webhook": {"main": [[{"node": "Validate Image", "type": "main", "index": 0}]]},
    "Validate Image": {"main": [[{"node": "Upload to Storage", "type": "main", "index": 0}]]},
    "Upload to Storage": {"main": [[{"node": "Save Reference", "type": "main", "index": 0}]]},
    "Save Reference": {"main": [[{"node": "Claude Vision Analysis", "type": "main", "index": 0}]]},
    "Claude Vision Analysis": {"main": [[{"node": "Parse Analysis", "type": "main", "index": 0}]]},
    "Parse Analysis": {"main": [[{"node": "Response", "type": "main", "index": 0}]]}
  }
}
```

- [ ] **Step 2: Verify file was created**

Run: `cat n8n-workflows/rollomax-upload.json | head -20`
Expected: First 20 lines of the workflow JSON

- [ ] **Step 3: Commit**

```bash
git add n8n-workflows/rollomax-upload.json
git commit -m "feat(n8n): add image upload workflow with Claude Vision

- Validates image (size, format)
- Uploads to Supabase Storage
- Analyzes with Claude Vision (window type, dimensions, recommendation)
- Returns analysis to widget"
```

---

## Task 17: N8N - Create Feedback Workflow

**Files:**
- Create: `n8n-workflows/rollomax-feedback.json`

- [ ] **Step 1: Create the workflow file**

```json
{
  "name": "RolloMax Feedback",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "feedback",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "feedback-webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "feedback-webhook"
    },
    {
      "parameters": {
        "language": "javaScript",
        "jsCode": "const body = $input.first().json.body;\nconst headers = $input.first().json.headers;\n\nconst token = $env.WIDGET_AUTH_TOKEN;\nif (headers['x-widget-token'] !== token) {\n  throw new Error('UNAUTHORIZED');\n}\n\nif (!body.session_id || !body.feedback_type) {\n  throw new Error('Missing required fields');\n}\n\nreturn [{ json: body }];"
      },
      "id": "validate",
      "name": "Validate",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {"caseSensitive": true, "leftValue": "", "typeValidation": "strict"},
          "conditions": [{"id": "type-check", "leftValue": "={{$json.feedback_type}}", "rightValue": "message", "operator": {"type": "string", "operation": "equals"}}],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "type-switch",
      "name": "Feedback Type",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.SUPABASE_URL}}/rest/v1/message_feedback",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{$env.SUPABASE_SERVICE_KEY}}"},
            {"name": "Authorization", "value": "={{ 'Bearer ' + $env.SUPABASE_SERVICE_KEY }}"},
            {"name": "Content-Type", "value": "application/json"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ session_id: $json.session_id, message_id: $json.data.message_id || null, rating: $json.data.rating, comment: $json.data.comment || null }) }}",
        "options": {}
      },
      "id": "save-message-feedback",
      "name": "Save Message Feedback",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.SUPABASE_URL}}/rest/v1/session_feedback",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{$env.SUPABASE_SERVICE_KEY}}"},
            {"name": "Authorization", "value": "={{ 'Bearer ' + $env.SUPABASE_SERVICE_KEY }}"},
            {"name": "Content-Type", "value": "application/json"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ session_id: $json.session_id, stars: $json.data.stars, comment: $json.data.comment || null }) }}",
        "options": {}
      },
      "id": "save-session-feedback",
      "name": "Save Session Feedback",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [850, 400]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true }) }}",
        "options": {}
      },
      "id": "response",
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {"main": [[{"node": "Validate", "type": "main", "index": 0}]]},
    "Validate": {"main": [[{"node": "Feedback Type", "type": "main", "index": 0}]]},
    "Feedback Type": {"main": [[{"node": "Save Message Feedback", "type": "main", "index": 0}], [{"node": "Save Session Feedback", "type": "main", "index": 0}]]},
    "Save Message Feedback": {"main": [[{"node": "Response", "type": "main", "index": 0}]]},
    "Save Session Feedback": {"main": [[{"node": "Response", "type": "main", "index": 0}]]}
  }
}
```

- [ ] **Step 2: Verify file was created**

Run: `cat n8n-workflows/rollomax-feedback.json | head -20`
Expected: First 20 lines of the workflow JSON

- [ ] **Step 3: Commit**

```bash
git add n8n-workflows/rollomax-feedback.json
git commit -m "feat(n8n): add feedback workflow

- Handles message feedback (thumbs up/down)
- Handles session feedback (star rating)
- Routes to appropriate Supabase table"
```

---

## Task 18: N8N - Create Analytics Tracking Workflow

**Files:**
- Create: `n8n-workflows/rollomax-track.json`

- [ ] **Step 1: Create the workflow file**

```json
{
  "name": "RolloMax Analytics Track",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "track",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "track-webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "webhookId": "track-webhook"
    },
    {
      "parameters": {
        "language": "javaScript",
        "jsCode": "const body = $input.first().json.body;\nconst headers = $input.first().json.headers;\n\nconst token = $env.WIDGET_AUTH_TOKEN;\nif (headers['x-widget-token'] !== token) {\n  throw new Error('UNAUTHORIZED');\n}\n\nif (!body.session_id || !body.event_type) {\n  throw new Error('Missing required fields');\n}\n\nreturn [{ json: body }];"
      },
      "id": "validate",
      "name": "Validate",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.SUPABASE_URL}}/rest/v1/analytics_events",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{$env.SUPABASE_SERVICE_KEY}}"},
            {"name": "Authorization", "value": "={{ 'Bearer ' + $env.SUPABASE_SERVICE_KEY }}"},
            {"name": "Content-Type", "value": "application/json"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ session_id: $json.session_id, event_type: $json.event_type, event_data: $json.event_data || {} }) }}",
        "options": {}
      },
      "id": "save-event",
      "name": "Save Event",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {"caseSensitive": true, "leftValue": "", "typeValidation": "strict"},
          "conditions": [{"id": "ab-check", "leftValue": "={{$json.ab_variant}}", "rightValue": "", "operator": {"type": "string", "operation": "notEmpty"}}],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "has-ab-variant",
      "name": "Has AB Variant?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$env.SUPABASE_URL}}/rest/v1/ab_assignments",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "apikey", "value": "={{$env.SUPABASE_SERVICE_KEY}}"},
            {"name": "Authorization", "value": "={{ 'Bearer ' + $env.SUPABASE_SERVICE_KEY }}"},
            {"name": "Content-Type", "value": "application/json"},
            {"name": "Prefer", "value": "resolution=merge-duplicates"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ session_id: $('Validate').first().json.session_id, experiment_id: '00000000-0000-0000-0000-000000000001', variant: $('Validate').first().json.ab_variant }) }}",
        "options": {}
      },
      "id": "save-ab-assignment",
      "name": "Save AB Assignment",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1050, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true }) }}",
        "options": {}
      },
      "id": "response",
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Webhook": {"main": [[{"node": "Validate", "type": "main", "index": 0}]]},
    "Validate": {"main": [[{"node": "Save Event", "type": "main", "index": 0}]]},
    "Save Event": {"main": [[{"node": "Has AB Variant?", "type": "main", "index": 0}]]},
    "Has AB Variant?": {"main": [[{"node": "Save AB Assignment", "type": "main", "index": 0}], [{"node": "Response", "type": "main", "index": 0}]]},
    "Save AB Assignment": {"main": [[{"node": "Response", "type": "main", "index": 0}]]}
  }
}
```

- [ ] **Step 2: Verify file was created**

Run: `cat n8n-workflows/rollomax-track.json | head -20`
Expected: First 20 lines of the workflow JSON

- [ ] **Step 3: Commit**

```bash
git add n8n-workflows/rollomax-track.json
git commit -m "feat(n8n): add analytics tracking workflow

- Saves all widget events to analytics_events table
- Records A/B test assignments when variant is provided"
```

---

## Task 19: N8N - Update Main Chat Workflow for Product Cards and Actions

**Files:**
- Modify: `n8n-workflows/rollomax-chat.json`

- [ ] **Step 1: Update Claude system prompt for multi-language and product cards**

In the "Build Claude Payload" node, add to the system prompt:

```javascript
// Add to system prompt after existing content:

MULTI-LANGUAGE:
Antworte IMMER in der Sprache, in der der Kunde schreibt. Wenn der Kunde auf Englisch, Tuerkisch, Serbisch oder Kroatisch schreibt, antworte in dieser Sprache. Bei Unsicherheit frage hoeflich nach.

PRODUKTKARTEN:
Wenn du ein spezifisches Produkt empfiehlst, fuege ein "show_product_card" Objekt hinzu:
- Bei Rolllaeden: { "type": "rollladen", "title": "Rolllaeden", "description": "Waermedaemmung und Einbruchschutz", "url": "https://rollomax.at/rolllaeden/", "image": "https://rollomax.at/wp-content/uploads/rollladen-hero.jpg" }
- Bei Raffstoren: { "type": "raffstore", "title": "Raffstoren", "description": "Optimale Lichtsteuerung", "url": "https://rollomax.at/raffstoren/", "image": "https://rollomax.at/wp-content/uploads/raffstore-hero.jpg" }
- Bei Markisen: { "type": "markise", "title": "Markisen", "description": "Sonnenschutz fuer Terrasse", "url": "https://rollomax.at/markisen/", "image": "https://rollomax.at/wp-content/uploads/markise-hero.jpg" }

ACTION BUTTONS:
Fuege "show_actions" hinzu wenn passend:
- ["booking"] - wenn Kunde Beratungstermin moechte
- ["whatsapp"] - wenn Kunde mit echtem Menschen sprechen will
- ["configurator"] - wenn Kunde Anfrage stellen moechte
- ["booking", "configurator"] - bei allgemeinem Interesse

ERWEITERTES ANTWORT-FORMAT:
<<<RESPONSE_JSON>>>
{"reply":"...", "intent":"...", "lead_data":null, "should_notify_team":false, "urgency":"low", "show_product_card":null, "show_actions":[]}
<<<END_RESPONSE_JSON>>>
```

- [ ] **Step 2: Update response parsing to include product cards and actions**

In "Topic Guard & Lead Parse" node, update the parsing:

```javascript
// Add to parsed object extraction:
return [{ json: {
  reply: parsed.reply || responseText,
  session_id: sessionId,
  user_message: userMessage,
  intent: parsed.intent || 'general',
  has_lead_data: parsed.lead_data !== null && parsed.lead_data !== undefined,
  lead_data: parsed.lead_data || null,
  should_notify_team: parsed.should_notify_team || false,
  urgency: parsed.urgency || 'low',
  is_business_hours: isBusinessHours,
  source_type: sourceType,
  show_product_card: parsed.show_product_card || null,
  show_actions: parsed.show_actions || []
}}];
```

- [ ] **Step 3: Update response to include product cards and actions**

In "Response" node, update the response body:

```javascript
"={{ JSON.stringify({ reply: $json.reply, session_id: $json.session_id, suggested_actions: $json.suggested_actions || [], lead_form: $json.has_lead_data ? { show: true, fields: ['name', 'email', 'phone'] } : null, product_card: $json.show_product_card || null, actions: $json.show_actions || [] }) }}"
```

- [ ] **Step 4: Verify changes**

Run: `grep -n "show_product_card\|show_actions\|MULTI-LANGUAGE" n8n-workflows/rollomax-chat.json | head -5`
Expected: Lines showing the new fields

- [ ] **Step 5: Commit**

```bash
git add n8n-workflows/rollomax-chat.json
git commit -m "feat(n8n): extend chat workflow for product cards and actions

- Multi-language support in system prompt
- Product card triggers (rollladen, raffstore, markise)
- Action button triggers (booking, whatsapp, configurator)
- Extended response format"
```

---

## Task 20: Widget - Handle Product Cards and Actions from API Response

**Files:**
- Modify: `widget/rollomax-chat-widget.js`

- [ ] **Step 1: Update handleApiResponse to process product cards and actions**

Find where API response is processed and update:

```javascript
    handleApiResponse(data) {
      this.hideTyping();
      
      var extras = {};
      
      // Product card
      if (data.product_card) {
        extras.product_card = data.product_card;
      }
      
      // Action buttons
      if (data.actions && data.actions.length > 0) {
        extras.actions = data.actions;
      }
      
      this.addMessage(data.reply, 'bot', extras);
      
      // Suggested actions (legacy)
      if (data.suggested_actions && data.suggested_actions.length > 0) {
        this.renderSuggestedActions(data.suggested_actions, 'suggested_action');
      }
      
      this._lastActivityTime = Date.now();
      this.resetInChatProactive();
    }
```

- [ ] **Step 2: Verify changes**

Run: `grep -n "handleApiResponse\|product_card\|extras.actions" widget/rollomax-chat-widget.js | head -10`
Expected: Lines showing the updated response handling

- [ ] **Step 3: Commit**

```bash
git add widget/rollomax-chat-widget.js
git commit -m "feat(widget): handle product cards and actions from API

- Parses product_card from response
- Parses actions array from response
- Passes extras to addMessage for rendering"
```

---

## Task 21: Create Avatar Image Placeholder

**Files:**
- Create: `widget/avatar.png`

- [ ] **Step 1: Create a placeholder note**

Since we can't create actual images, create a README note:

```bash
echo "# Avatar Image\n\nPlace a 64x64px PNG image here named 'avatar.png'.\nThis will be displayed in the chat header.\n\nRecommended: RolloMax logo or a stylized sun/blinds icon.\nFallback: If image fails to load, displays 'R' in a circle." > widget/AVATAR_README.md
```

- [ ] **Step 2: Commit**

```bash
git add widget/AVATAR_README.md
git commit -m "docs(widget): add avatar image placeholder readme

Instructions for adding the 64x64px bot avatar image"
```

---

## Task 22: Update CLAUDE.md with New Features

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add premium features documentation**

Add a new section to CLAUDE.md:

```markdown
## Premium Features (v2)

### Widget Features
- Bot Avatar im Header (32x32px, Fallback "R")
- "RolloMax tippt..." Typing Indicator
- Daumen hoch/runter Feedback unter Bot-Messages
- Sound Toggle (opt-in, localStorage)
- Session Feedback Popup (5 Sterne nach 2min Inaktivitaet)
- Bild-Upload mit Claude Vision Analyse
- Produktkarten (Rollladen, Raffstore, Markise)
- Action Buttons (Termin buchen, WhatsApp, Konfigurator)
- Cal.com Terminbuchung Modal
- Step-by-Step Konfigurator
- WhatsApp Handover (+43 650 990 75 99)
- Proaktive Nachrichten mit A/B Testing (4 Varianten)

### N8N Workflows
- rollomax-chat.json - Haupt-Chat (erweitert fuer Multi-Language, Product Cards)
- rollomax-upload.json - Bild-Upload mit Claude Vision
- rollomax-feedback.json - Message/Session Feedback
- rollomax-track.json - Analytics Events + A/B Assignments

### Supabase Tabellen (Migration 007)
- message_feedback - Daumen hoch/runter pro Message
- session_feedback - Sterne-Rating am Chat-Ende
- uploaded_images - Fenster-Fotos mit Claude-Analyse
- ab_experiments - A/B Test Definitionen
- ab_assignments - User-zu-Variante Zuordnung
- analytics_events - Alle Widget-Events

### Analytics Views
- v_ab_test_results - Conversion Rate pro A/B Variante
- v_feature_usage - Feature-Nutzung letzte 30 Tage
- v_funnel_analysis - Chat -> Engaged -> Lead -> Booking
- v_feedback_summary - Positive/Negative Feedback Rate
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add premium features documentation to CLAUDE.md

Documents all v2 features: widget upgrades, new workflows,
database schema, analytics views"
```

---

## Task 23: Final Integration Test Checklist

**Files:** None (manual verification)

- [ ] **Step 1: Verify all files exist**

Run:
```bash
ls -la widget/rollomax-chat-widget.js
ls -la supabase/migrations/007_premium_features.sql
ls -la n8n-workflows/rollomax-upload.json
ls -la n8n-workflows/rollomax-feedback.json
ls -la n8n-workflows/rollomax-track.json
```

Expected: All files exist

- [ ] **Step 2: Verify widget compiles (no syntax errors)**

Run:
```bash
node -c widget/rollomax-chat-widget.js
```

Expected: No syntax errors

- [ ] **Step 3: Verify JSON workflows are valid**

Run:
```bash
cat n8n-workflows/rollomax-upload.json | jq .name
cat n8n-workflows/rollomax-feedback.json | jq .name
cat n8n-workflows/rollomax-track.json | jq .name
```

Expected: Workflow names printed

- [ ] **Step 4: Commit final state**

```bash
git status
git log --oneline -10
```

Verify all changes are committed.

---

## Deployment Notes

After implementation:

1. **Supabase:** Run migration 007 in SQL Editor
2. **Supabase Storage:** Create bucket "chat-uploads" (private)
3. **N8N:** Import new workflows, activate them
4. **Cal.com:** Create RolloMax account, get embed URL
5. **Widget:** Add `data-calcom-url` attribute when embedding
6. **Avatar:** Upload 64x64px avatar.png to widget folder

## Summary

Total Tasks: 23
Estimated Time: 4-6 hours

Key Components:
- 1 database migration
- 3 new N8N workflows
- 1 modified N8N workflow
- ~500 lines new widget JS
- ~200 lines new widget CSS
