-- ============================================================
-- ROLLOMAX KI-CHATBOT: KOMPLETTES SUPABASE SETUP
-- Diesen gesamten Block in den Supabase SQL Editor kopieren
-- und auf "Run" klicken.
-- ============================================================


-- ============================================================
-- SCHRITT 1: TABELLEN ERSTELLEN
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_hash TEXT NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_ip_hash ON public.chat_sessions(ip_hash);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    token_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    interest TEXT,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    consent_marketing BOOLEAN NOT NULL DEFAULT false,
    consent_data_processing BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON public.leads(session_id);

CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_keywords ON public.knowledge_base USING GIN(keywords);


-- ============================================================
-- SCHRITT 2: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_sessions" ON public.chat_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_messages" ON public.chat_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_leads" ON public.leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_knowledge_base" ON public.knowledge_base
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "service_role_all_knowledge_base" ON public.knowledge_base
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- SCHRITT 3: AUTO-DELETE CRON (DSGVO)
-- Voraussetzung: pg_cron muss im Supabase Dashboard aktiviert sein
-- Database -> Extensions -> pg_cron -> Enable
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

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

SELECT cron.schedule(
    'delete_old_leads',
    '0 4 * * 0',
    $$
    DELETE FROM public.leads
    WHERE created_at < now() - interval '2 years';
    $$
);


-- ============================================================
-- SCHRITT 4: KNOWLEDGE BASE (SEED-DATEN)
-- ============================================================

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'unternehmen',
    'RolloMax Wien Uebersicht',
    'RolloMax ist ein Familienbetrieb fuer Sonnenschutz mit Sitz in der Leopoldsgasse 4, 1020 Wien. Inhaber ist Adis Kavaz. Das Unternehmen hat eine Bewertung von 4,7 Sternen auf Google bei 119 Rezensionen.',
    ARRAY['RolloMax', 'Wien', 'Sonnenschutz', 'Familienbetrieb', 'Leopoldsgasse', 'Adis Kavaz', '1020'],
    NULL
),
(
    'unternehmen',
    'Kontakt',
    'Sie erreichen uns telefonisch unter +43 (0) 1 21 22 446 oder +43 650 990 75 99. Per E-Mail schreiben Sie uns an team@rollomax.at. Wir freuen uns auf Ihre Anfrage.',
    ARRAY['Telefon', 'E-Mail', 'Kontakt', 'Anruf', 'erreichbar'],
    NULL
),
(
    'unternehmen',
    'Oeffnungszeiten',
    'Unsere Oeffnungszeiten sind Montag bis Donnerstag von 08:00 bis 12:00 Uhr und 13:00 bis 17:00 Uhr, Freitag von 08:00 bis 16:00 Uhr. Besuchen Sie auch unseren Schauraum in der Leopoldsgasse 4, 1020 Wien.',
    ARRAY['Oeffnungszeiten', 'Schauraum', 'Montag', 'Freitag', 'Uhrzeit', 'offen', 'geoeffnet'],
    NULL
),
(
    'unternehmen',
    'Anfahrt',
    'Sie finden uns in der Leopoldsgasse 4, 1020 Wien. Unser Standort ist oeffentlich sehr gut erreichbar.',
    ARRAY['Anfahrt', 'Adresse', 'Leopoldsgasse', '1020 Wien', 'oeffentlich', 'erreichbar', 'Standort'],
    NULL
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'innenbeschattung',
    'Rollo',
    'Der Rollo ist ein klassischer Sicht- und Sonnenschutz fuer den Innenbereich. Wir bieten eine grosse Stoff- und Farbauswahl fuer individuelle Gestaltung. Die Bedienung ist einfach und unkompliziert.',
    ARRAY['Rollo', 'Sichtschutz', 'Sonnenschutz', 'innen', 'Stoff', 'Farbe'],
    'https://rollomax.at/rollo/'
),
(
    'innenbeschattung',
    'Plissee',
    'Das Plissee ist ein flexibler Sonnenschutz, der von oben und unten verstellbar ist. Es eignet sich ideal fuer Dachfenster und Sonderformen. Durch die flexible Positionierung koennen Sie den Lichteinfall praezise steuern.',
    ARRAY['Plissee', 'Dachfenster', 'Sonderformen', 'flexibel', 'verstellbar', 'Sonnenschutz'],
    'https://rollomax.at/plissee/'
),
(
    'innenbeschattung',
    'Duette (Wabenplissee)',
    'Das Duette, auch Wabenplissee genannt, verfuegt ueber eine spezielle Wabenstruktur fuer optimale Waermedaemmung. Es wirkt energiesparend sowohl im Winter als auch im Sommer und traegt zur Reduktion Ihrer Heiz- und Kuehlkosten bei.',
    ARRAY['Duette', 'Wabenplissee', 'Waermedaemmung', 'energiesparend', 'Isolation', 'Waben'],
    'https://rollomax.at/duette/'
),
(
    'innenbeschattung',
    'Jalousie',
    'Die Aluminium-Jalousie bietet praezise Lichtsteuerung fuer den Innenbereich. Die Lamellen lassen sich individuell einstellen, sodass Sie den Lichteinfall genau nach Ihren Wuenschen regulieren koennen.',
    ARRAY['Jalousie', 'Aluminium', 'Lichtsteuerung', 'Lamellen', 'innen'],
    'https://rollomax.at/jalousie/'
),
(
    'innenbeschattung',
    'Holzjalousie',
    'Die Holzjalousie besticht durch ihre natuerliche Optik und hochwertige Holzlamellen. Sie schafft eine warme, einladende Atmosphaere in Ihren Raeumen und verbindet Funktionalitaet mit elegantem Design.',
    ARRAY['Holzjalousie', 'Holz', 'Lamellen', 'natuerlich', 'Atmosphaere', 'Design'],
    'https://rollomax.at/holzjalousie/'
),
(
    'innenbeschattung',
    'Vertikaljalousie',
    'Die Vertikaljalousie ist ideal fuer grosse Fensterflaechen und Schiebtueren. Die vertikalen Lamellen sorgen fuer einen eleganten Sonnenschutz und lassen sich einfach zur Seite schieben.',
    ARRAY['Vertikaljalousie', 'vertikal', 'Lamellen', 'grosse Fenster', 'Schiebtueren', 'Sonnenschutz'],
    'https://rollomax.at/vertikaljalousie/'
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'aussenbeschattung',
    'Rolllaeden',
    'Rolllaeden bieten effektiven Waerme-, Kaelte- und Laermschutz fuer Ihr Zuhause. Sie erhoehen die Sicherheit und sind elektrisch oder manuell bedienbar. Eine zuverlaessige Loesung fuer jede Jahreszeit.',
    ARRAY['Rolllaeden', 'Waermeschutz', 'Kaelteschutz', 'Laermschutz', 'Sicherheit', 'elektrisch', 'manuell'],
    'https://rollomax.at/rolllaeden/'
),
(
    'aussenbeschattung',
    'Textilrollos (Screens)',
    'Textilrollos, auch Screens genannt, sind ein aussenliegender textiler Sonnenschutz. Sie bieten blendfreien Durchblick nach aussen und schuetzen gleichzeitig vor Hitze und UV-Strahlung.',
    ARRAY['Textilrollos', 'Screens', 'textil', 'aussen', 'Sonnenschutz', 'blendfrei', 'UV-Schutz'],
    'https://rollomax.at/textilrollos/'
),
(
    'aussenbeschattung',
    'Solar Rolllaeden',
    'Solarbetriebene Rolllaeden funktionieren kabellos und unabhaengig vom Stromnetz. Sie sind besonders einfach nachzuruesten, da keine Verkabelung notwendig ist. Eine umweltfreundliche und praktische Loesung.',
    ARRAY['Solar', 'Rolllaeden', 'solarbetrieben', 'kabellos', 'Nachruestung', 'Stromnetz', 'umweltfreundlich'],
    'https://rollomax.at/solar-rolllaeden/'
),
(
    'aussenbeschattung',
    'Aussenjalousien/Raffstores',
    'Aussenjalousien, auch Raffstores genannt, ermoeglichen praezise Lichtsteuerung von aussen. Sie blockieren 75 bis 80 Prozent der Sonnenhitze und sind die beste Loesung fuer sommerlichen Waermeschutz.',
    ARRAY['Aussenjalousien', 'Raffstores', 'Lichtsteuerung', 'aussen', 'Waermeschutz', 'Sonnenhitze', 'Hitzeschutz'],
    'https://rollomax.at/aussenjalousien/'
),
(
    'aussenbeschattung',
    'Insektenschutz',
    'Wir bieten 6 verschiedene Typen von Insektenschutz an: Spannrahmen, Drehrahmen, Schiebeanlagen, Rollos, Plissees und Lichtschachtabdeckungen. Jeder Insektenschutz wird als Massanfertigung fuer Ihr Fenster produziert.',
    ARRAY['Insektenschutz', 'Spannrahmen', 'Drehrahmen', 'Schiebeanlagen', 'Rollos', 'Plissees', 'Lichtschacht', 'Massanfertigung'],
    'https://rollomax.at/insektenschutz/'
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'markisen',
    'Gelenkarmmarkise',
    'Die Gelenkarmmarkise ist die klassische Terrassenmarkise. Sie ist in einer grossen Stoff- und Farbauswahl erhaeltlich und kann elektrisch oder manuell bedient werden. Ideal fuer die Beschattung Ihrer Terrasse oder Ihres Balkons.',
    ARRAY['Gelenkarmmarkise', 'Terrasse', 'Markise', 'Stoff', 'elektrisch', 'manuell', 'Balkon'],
    'https://rollomax.at/gelenkarmmarkise/'
),
(
    'markisen',
    'Pergolamarkisen',
    'Pergolamarkisen sind besonders robuste Markisen fuer groessere Flaechen. Sie zeichnen sich durch hohe Windstabilitaet und Langlebigkeit aus und eignen sich hervorragend fuer grosse Terrassenbereiche.',
    ARRAY['Pergolamarkisen', 'Pergola', 'robust', 'windstabil', 'langlebig', 'grosse Flaechen'],
    'https://rollomax.at/pergolamarkisen/'
),
(
    'markisen',
    'Wintergartenmarkisen',
    'Wintergartenmarkisen wurden speziell fuer Wintergaerten und Glasdaecher entwickelt. Sie sind sowohl fuer die Aussen- als auch fuer die Innenmontage geeignet und schuetzen zuverlaessig vor Ueberhitzung.',
    ARRAY['Wintergartenmarkisen', 'Wintergarten', 'Glasdach', 'Aussenmontage', 'Innenmontage', 'Ueberhitzung'],
    'https://rollomax.at/wintergartenmarkisen/'
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'ueberdachungen',
    'Lamellendach',
    'Das Lamellendach verfuegt ueber verstellbare Aluminiumlamellen und bietet sowohl Regen- als auch Sonnenschutz. Es ermoeglicht die Ganzjahres-Nutzung Ihrer Terrasse bei jeder Witterung.',
    ARRAY['Lamellendach', 'Aluminium', 'Lamellen', 'Regenschutz', 'Sonnenschutz', 'Terrasse', 'ganzjaehrig'],
    'https://rollomax.at/lamellendach/'
),
(
    'ueberdachungen',
    'Faltdach',
    'Das textile Faltdach bietet flexible Beschattung fuer Ihre Terrasse. Es ist leicht, elegant und laesst sich bei Bedarf einfach zusammenfalten.',
    ARRAY['Faltdach', 'textil', 'flexibel', 'Beschattung', 'leicht', 'elegant', 'Terrasse'],
    'https://rollomax.at/faltdach/'
),
(
    'ueberdachungen',
    'Glasdach',
    'Das Glasdach ist eine feststehende Glasueberdachung, die lichtdurchlaessig und wettergeschuetzt ist. Ideal fuer eine helle, geschuetzte Terrasse oder einen Eingangsbereich.',
    ARRAY['Glasdach', 'Glas', 'Ueberdachung', 'lichtdurchlaessig', 'wettergeschuetzt', 'feststehend'],
    'https://rollomax.at/glasdach/'
),
(
    'ueberdachungen',
    'SHADE-System',
    'Das SHADE-System ist ein innovatives Beschattungssystem und Gewinner des German Design Award. Es ueberzeugt durch sein modernes Design und bietet hochwertige Beschattung fuer anspruchsvolle Architektur.',
    ARRAY['SHADE', 'SHADE-System', 'innovativ', 'German Design Award', 'modern', 'Design', 'Beschattung'],
    'https://rollomax.at/shade-system/'
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'rund_ums_haus',
    'Fenster',
    'Wir bieten hochwertige Fenster fuer Neubau und Sanierung. Unsere Fenster zeichnen sich durch beste Waermedaemmung und hohe Qualitaet aus.',
    ARRAY['Fenster', 'Neubau', 'Sanierung', 'Waermedaemmung', 'Qualitaet'],
    'https://rollomax.at/fenster/'
),
(
    'rund_ums_haus',
    'Tueren',
    'Unser Sortiment umfasst Eingangstueren, Balkontueren und Schiebetueren. Alle Tueren vereinen Sicherheit mit ansprechendem Design.',
    ARRAY['Tueren', 'Eingangstuer', 'Balkontuer', 'Schiebetuer', 'Sicherheit', 'Design'],
    'https://rollomax.at/tueren/'
),
(
    'rund_ums_haus',
    'Rolltore',
    'Wir bieten Garagentore und Rolltore, die elektrisch bedienbar sind. Zuverlaessig, sicher und komfortabel.',
    ARRAY['Rolltore', 'Garagentore', 'elektrisch', 'Garage', 'Tor'],
    'https://rollomax.at/rolltore/'
),
(
    'rund_ums_haus',
    'Carport Modena',
    'Der Carport Modena ist ein moderner Aluminium-Carport mit optionaler Seitenbeschattung. Er verbindet Funktionalitaet mit zeitgemaessem Design.',
    ARRAY['Carport', 'Modena', 'Aluminium', 'Seitenbeschattung', 'modern'],
    'https://rollomax.at/carport-modena/'
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'services',
    'Kostenlose Beratung',
    'Wir bieten Ihnen eine persoenliche Beratung im Schauraum oder bei Ihnen vor Ort. Die Beratung ist unverbindlich und kostenlos. Unsere Experten helfen Ihnen, die passende Loesung fuer Ihre Anforderungen zu finden.',
    ARRAY['Beratung', 'kostenlos', 'unverbindlich', 'Schauraum', 'vor Ort', 'persoenlich'],
    NULL
),
(
    'services',
    'Aufmass',
    'Wir fuehren ein professionelles Aufmass bei Ihnen zu Hause durch. Das Aufmass ist die Grundlage fuer massgeschneiderte Produkte, die exakt zu Ihren Fenstern und Tueren passen.',
    ARRAY['Aufmass', 'professionell', 'massgeschneidert', 'Vermessung', 'zu Hause'],
    NULL
),
(
    'services',
    'Montage',
    'Unser erfahrenes Team fuehrt die fachgerechte Montage Ihrer Sonnenschutzprodukte durch. Sauber, zuverlaessig und termingerecht.',
    ARRAY['Montage', 'fachgerecht', 'Installation', 'Team', 'zuverlaessig'],
    NULL
),
(
    'services',
    'Reparatur',
    'Wir reparieren alle gaengigen Sonnenschutzprodukte, darunter Gurt, Schnur, Motor und Funk. Auch Fremdprodukte werden von uns instand gesetzt.',
    ARRAY['Reparatur', 'Gurt', 'Schnur', 'Motor', 'Funk', 'Fremdprodukte', 'Instandsetzung'],
    NULL
),
(
    'services',
    'Wartung',
    'Regelmaessige Wartung sorgt fuer eine lange Lebensdauer Ihrer Sonnenschutzprodukte. Wir pruefen, reinigen und justieren Ihre Anlagen fachgerecht.',
    ARRAY['Wartung', 'Lebensdauer', 'Pflege', 'regelmaessig', 'Justierung'],
    NULL
),
(
    'services',
    'Nachruestung',
    'Wir bieten die Umruestung von manuell auf elektrisch oder Smart-Home-Steuerung an. Modernisieren Sie Ihre bestehenden Sonnenschutzanlagen fuer mehr Komfort.',
    ARRAY['Nachruestung', 'Umruestung', 'elektrisch', 'Smart-Home', 'Modernisierung', 'Komfort'],
    NULL
),
(
    'services',
    'Montage ohne Bohren',
    'Viele unserer Produkte koennen ohne Bohren montiert werden. Wir verwenden Klemmtraeger fuer Fenster oder spezielle Klebehalter. Diese Loesung ist ideal fuer Mietwohnungen, da keine Schaeden an Fenstern oder Waenden entstehen.',
    ARRAY['Montage ohne Bohren', 'Klemmtraeger', 'Klebehalter', 'Mietwohnung', 'bohrfrei', 'schadensfrei'],
    NULL
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'foerderung',
    'Foerderung Stadt Wien',
    'Die Stadt Wien foerdert Aussenbeschattung in mehrgeschossigen Wohnbauten mit bis zu 1.500 EUR. Die Foerderung gilt fuer Rolllaeden, Aussenjalousien und Markisen. Wir beraten Sie gerne zu den Voraussetzungen und unterstuetzen Sie bei der Antragstellung.',
    ARRAY['Foerderung', 'Stadt Wien', 'Aussenbeschattung', '1500 EUR', 'Rolllaeden', 'Aussenjalousien', 'Markisen', 'Zuschuss'],
    NULL
);

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'faq',
    'Aussen vs. Innen Sonnenschutz',
    'Aussenbeschattung blockiert 75 bis 80 Prozent der Sonnenhitze, bevor sie das Glas erreicht. Innenbeschattung schafft nur 15 bis 20 Prozent. Fuer effektiven Waermeschutz ist Aussenbeschattung daher die beste Wahl.',
    ARRAY['Aussenbeschattung', 'Innenbeschattung', 'Vergleich', 'Waermeschutz', 'Sonnenhitze', 'Unterschied'],
    NULL
),
(
    'faq',
    'Rollo vs. Jalousie vs. Plissee',
    'Rollos bieten gleichmaessigen Sicht- und Sonnenschutz. Jalousien ermoeglichen praezise Lichtsteuerung durch verstellbare Lamellen. Plissees sind besonders flexibel und ideal fuer Sonderformen wie Dachfenster. Welches Produkt am besten zu Ihnen passt, klaeren wir gerne in einer persoenlichen Beratung.',
    ARRAY['Rollo', 'Jalousie', 'Plissee', 'Vergleich', 'Unterschied', 'Lichtsteuerung', 'Sichtschutz'],
    NULL
),
(
    'faq',
    'Beste Verdunkelung',
    'Fuer maximale Verdunkelung empfehlen wir Rolllaeden fuer aussen oder Verdunkelungsrollos mit seitlichen Fuehrungsschienen fuer innen. Duette-Wabenplissees bieten zusaetzlich hervorragende Waermedaemmung und sind eine gute Ergaenzung.',
    ARRAY['Verdunkelung', 'Rolllaeden', 'Verdunkelungsrollo', 'Fuehrungsschienen', 'Duette', 'dunkel', 'Schlafzimmer'],
    NULL
),
(
    'faq',
    'Montage ohne Bohren',
    'Ja, viele unserer Produkte koennen ohne Bohren montiert werden. Wir verwenden Klemmtraeger fuer Fenster oder spezielle Klebehalter. Diese Loesung ist ideal fuer Mietwohnungen, da keine Schaeden an Fenstern oder Waenden entstehen.',
    ARRAY['Montage ohne Bohren', 'Klemmtraeger', 'Klebehalter', 'Mietwohnung', 'bohrfrei', 'ohne Bohren'],
    NULL
),
(
    'faq',
    'Pflege-Tipps',
    'Die meisten Sonnenschutzprodukte lassen sich einfach mit einem feuchten Tuch reinigen. Jalousie-Lamellen koennen mit einem Lamellenreiniger gesaeubert werden. Bei Stoffprodukten empfehlen wir regelmaessiges Absaugen mit niedriger Stufe.',
    ARRAY['Pflege', 'Reinigung', 'Tipps', 'Tuch', 'Lamellenreiniger', 'Absaugen', 'Wartung'],
    NULL
);

-- ============================================================
-- SCHRITT 5: ERWEITERTE FAQ-EINTRAEGE
-- ============================================================

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'faq',
    'Rolllaeden nachtraeglich einbauen',
    'Ja, besonders als Vorbau-System ist das problemlos moeglich. Wenn kein Stromanschluss vorhanden ist, sind Solar-Rolllaeden eine saubere Loesung ohne Kabel und Leitungen.',
    ARRAY['Rolllaeden', 'Nachruestung', 'Vorbau', 'Solar', 'nachtraeglich', 'einbauen', 'Altbau'],
    NULL
),
(
    'faq',
    'Rollladen Antrieb - Gurt, Kurbel oder Motor',
    'Gurt ist guenstig und unkompliziert. Motor lohnt sich bei grossen Elementen, mehreren Fenstern oder wenn Sie mehr Komfort wuenschen. Auf Wunsch binden wir die Steuerung auch in Ihr Smart Home ein.',
    ARRAY['Gurt', 'Kurbel', 'Motor', 'Antrieb', 'Rollladen', 'Smart Home', 'Komfort'],
    NULL
),
(
    'faq',
    'Rollladen Waermeschutz und Hitzeschutz',
    'Aussenliegende Rolllaeden halten Hitze deutlich besser draussen als Innenbeschattung. Im Winter hilft die Luftschicht vor dem Fenster, Waermeverluste zu reduzieren.',
    ARRAY['Hitze', 'Kaelte', 'Waermeschutz', 'Hitzeschutz', 'Rollladen', 'Daemmung', 'Energiesparen'],
    NULL
),
(
    'faq',
    'Rolllaeden und Einbruchschutz',
    'Ein geschlossener Rollladen erhoeht den Widerstand gegen Aufschieben und schuetzt die Privatsphaere. Fuer maximale Sicherheit empfehlen wir ein Aluminium-System mit Hochschiebesicherung.',
    ARRAY['Einbruchschutz', 'Sicherheit', 'Hochschiebesicherung', 'Aluminium', 'Rollladen', 'Schutz'],
    NULL
),
(
    'faq',
    'Rolllaeden oder Aussenjalousien - Unterschied',
    'Wenn Sie flexibel Tageslicht lenken und trotzdem hinaussehen moechten, sind Aussenjalousien die bessere Wahl. Wenn Sie maximale Verdunkelung, Wetter- und Waermeschutz wuenschen, sind Rolllaeden meist ueberlegen.',
    ARRAY['Aussenjalousien', 'Rolllaeden', 'Unterschied', 'Vergleich', 'Raffstoren', 'Licht', 'Verdunkelung'],
    NULL
),
(
    'faq',
    'Markisentypen im Ueberblick',
    'Gelenkarm-Markisen eignen sich fuer Terrassen und Balkone. Kassettenmarkisen bieten besseren Schutz durch ein geschlossenes Gehaeuse. Pergola-Markisen decken groessere Flaechen ab. Wintergarten-Markisen sind speziell fuer Glasdaecher konzipiert. Wir fuehren die Warema Terrea-Serie (P20, G60, H60, K60).',
    ARRAY['Markise', 'Gelenkarm', 'Kassettenmarkise', 'Pergola', 'Wintergarten', 'Warema', 'Terrea', 'Terrasse', 'Balkon'],
    NULL
),
(
    'faq',
    'Textilrollos als Alternative zur Markise',
    'Wenn Sie eine textile Optik an der Fassade bevorzugen und tagsueber Durchblick behalten moechten, sind Textilrollos eine starke Alternative. Bei windigen Lagen pruefen wir gemeinsam, welches System am besten passt.',
    ARRAY['Textilrollo', 'Screen', 'Markise', 'Alternative', 'Fassade', 'Wind', 'Durchblick'],
    NULL
),
(
    'faq',
    'Smart Home Nachruestung fuer Sonnenschutz',
    'Die Nachruestung mit Somfy-Funkmotoren beginnt ab ca. 150 EUR pro Fenster. Eine komplette Smart-Home-Integration mit TaHoma-Zentrale, Sensoren und App-Steuerung ist schon ab 500 EUR moeglich.',
    ARRAY['Smart Home', 'Somfy', 'Funkmotor', 'TaHoma', 'Nachruestung', 'App', 'Steuerung', 'Sensor'],
    NULL
),
(
    'faq',
    'Rolllaeden richtig pflegen',
    'Meist reicht es, den Panzer gelegentlich mit einem feuchten Tuch zu reinigen und die Fuehrungsschienen sauber zu halten. Bitte keine aggressiven Reiniger verwenden, damit Oberflaeche und Dichtungen lange halten.',
    ARRAY['Pflege', 'Rolllaeden', 'Reinigung', 'Panzer', 'Fuehrungsschienen', 'Wartung'],
    NULL
),
(
    'faq',
    'Insektenschutz mit Rolllaeden kombinieren',
    'Oft laesst sich Insektenschutz direkt mitplanen, zum Beispiel als integrierte Loesung im Rollladen-Kasten. So sparen Sie Platz und haben beides in einem System.',
    ARRAY['Insektenschutz', 'Rolllaeden', 'Kombination', 'integriert', 'Rollladen-Kasten', 'Muecken'],
    NULL
),
(
    'faq',
    'Farben und Lamellen Auswahl',
    'Sie koennen aus einer umfangreichen Palette an Lamellenfarben und Profilen waehlen, passend zu Fenster und Fassade. Bei der Beratung zeigen wir Ihnen gerne alle verfuegbaren Optionen.',
    ARRAY['Farbe', 'Farben', 'Lamellen', 'Auswahl', 'Palette', 'Fassade', 'Design', 'RAL'],
    NULL
),
(
    'faq',
    'Wiener Sonnenschutz-Foerderung Details',
    'Die Stadt Wien foerdert die Montage von Sonnenschutz-Einrichtungen in mehrgeschossigen Wohnbauten mit bis zu 1.500 EUR. Dies gilt fuer Gemeindebau, gefoerderten und freifinanzierten Wohnbau. RolloMax uebernimmt die komplette Beratung und Abwicklung der Foerderantraege fuer Sie.',
    ARRAY['Foerderung', 'Wien', 'Gemeindebau', 'gefoerdert', 'freifinanziert', '1500', 'Antrag', 'Abwicklung'],
    NULL
);

-- ============================================================
-- SCHRITT 6: SCHEMA-ERWEITERUNGEN (Intent, Tracking, Leads)
-- ============================================================

ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT false;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'typed';

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS plz TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS product_interest TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'low';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

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

CREATE INDEX IF NOT EXISTS idx_leads_urgency ON public.leads(urgency);
CREATE INDEX IF NOT EXISTS idx_leads_notified ON public.leads(notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_messages_source_type ON public.chat_messages(source_type);
CREATE INDEX IF NOT EXISTS idx_messages_intent ON public.chat_messages(intent);

-- ============================================================
-- SCHRITT 7: ANALYTICS VIEWS
-- ============================================================

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

CREATE OR REPLACE VIEW public.v_lead_pipeline AS
SELECT
  urgency,
  product_interest,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE notified = false) AS pending_notification
FROM public.leads
WHERE created_at > now() - interval '30 days'
GROUP BY urgency, product_interest;

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

-- ============================================================
-- FERTIG. Alle Tabellen, RLS-Policies, Cron-Jobs,
-- 51 Knowledge Base Eintraege, Schema-Erweiterungen
-- und Analytics Views wurden erstellt.
-- ============================================================
