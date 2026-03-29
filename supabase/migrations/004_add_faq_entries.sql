-- ============================================================
-- 004_add_faq_entries.sql
-- Erweiterte FAQ-Wissensbasis fuer den RolloMax KI-Chatbot
-- Quelle: Verifizierte Produktinformationen
-- ============================================================

-- Neue FAQ-Eintraege fuer detailliertere Beratung
-- Hinweis: Bestehende faq-Eintraege (Aussen vs. Innen, Rollo vs. Jalousie vs. Plissee,
-- Beste Verdunkelung, Montage ohne Bohren, Pflege-Tipps) bleiben erhalten.

INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES

-- Rolllaeden: Nachruestung
(
    'faq',
    'Rolllaeden nachtraeglich einbauen',
    'Ja, besonders als Vorbau-System ist das problemlos moeglich. Wenn kein Stromanschluss vorhanden ist, sind Solar-Rolllaeden eine saubere Loesung ohne Kabel und Leitungen.',
    ARRAY['Rolllaeden', 'Nachruestung', 'Vorbau', 'Solar', 'nachtraeglich', 'einbauen', 'Altbau'],
    NULL
),

-- Rolllaeden: Antriebsarten
(
    'faq',
    'Rollladen Antrieb - Gurt, Kurbel oder Motor',
    'Gurt ist guenstig und unkompliziert. Motor lohnt sich bei grossen Elementen, mehreren Fenstern oder wenn Sie mehr Komfort wuenschen. Auf Wunsch binden wir die Steuerung auch in Ihr Smart Home ein.',
    ARRAY['Gurt', 'Kurbel', 'Motor', 'Antrieb', 'Rollladen', 'Smart Home', 'Komfort'],
    NULL
),

-- Rolllaeden: Hitze und Kaelte
(
    'faq',
    'Rollladen Waermeschutz und Hitzeschutz',
    'Aussenliegende Rolllaeden halten Hitze deutlich besser draussen als Innenbeschattung. Im Winter hilft die Luftschicht vor dem Fenster, Waermeverluste zu reduzieren.',
    ARRAY['Hitze', 'Kaelte', 'Waermeschutz', 'Hitzeschutz', 'Rollladen', 'Daemmung', 'Energiesparen'],
    NULL
),

-- Rolllaeden: Einbruchschutz
(
    'faq',
    'Rolllaeden und Einbruchschutz',
    'Ein geschlossener Rollladen erhoeht den Widerstand gegen Aufschieben und schuetzt die Privatsphaere. Fuer maximale Sicherheit empfehlen wir ein Aluminium-System mit Hochschiebesicherung.',
    ARRAY['Einbruchschutz', 'Sicherheit', 'Hochschiebesicherung', 'Aluminium', 'Rollladen', 'Schutz'],
    NULL
),

-- Aussenjalousien vs. Rolllaeden
(
    'faq',
    'Rolllaeden oder Aussenjalousien - Unterschied',
    'Wenn Sie flexibel Tageslicht lenken und trotzdem hinaussehen moechten, sind Aussenjalousien die bessere Wahl. Wenn Sie maximale Verdunkelung, Wetter- und Waermeschutz wuenschen, sind Rolllaeden meist ueberlegen.',
    ARRAY['Aussenjalousien', 'Rolllaeden', 'Unterschied', 'Vergleich', 'Raffstoren', 'Licht', 'Verdunkelung'],
    NULL
),

-- Markisen: Typen
(
    'faq',
    'Markisentypen im Ueberblick',
    'Gelenkarm-Markisen eignen sich fuer Terrassen und Balkone. Kassettenmarkisen bieten besseren Schutz durch ein geschlossenes Gehaeuse. Pergola-Markisen decken groessere Flaechen ab. Wintergarten-Markisen sind speziell fuer Glasdaecher konzipiert. Wir fuehren die Warema Terrea-Serie (P20, G60, H60, K60).',
    ARRAY['Markise', 'Gelenkarm', 'Kassettenmarkise', 'Pergola', 'Wintergarten', 'Warema', 'Terrea', 'Terrasse', 'Balkon'],
    NULL
),

-- Markisen: Textilrollos als Alternative
(
    'faq',
    'Textilrollos als Alternative zur Markise',
    'Wenn Sie eine textile Optik an der Fassade bevorzugen und tagsueber Durchblick behalten moechten, sind Textilrollos eine starke Alternative. Bei windigen Lagen pruefen wir gemeinsam, welches System am besten passt.',
    ARRAY['Textilrollo', 'Screen', 'Markise', 'Alternative', 'Fassade', 'Wind', 'Durchblick'],
    NULL
),

-- Smart Home
(
    'faq',
    'Smart Home Nachruestung fuer Sonnenschutz',
    'Die Nachruestung mit Somfy-Funkmotoren beginnt ab ca. 150 EUR pro Fenster. Eine komplette Smart-Home-Integration mit TaHoma-Zentrale, Sensoren und App-Steuerung ist schon ab 500 EUR moeglich.',
    ARRAY['Smart Home', 'Somfy', 'Funkmotor', 'TaHoma', 'Nachruestung', 'App', 'Steuerung', 'Sensor'],
    NULL
),

-- Pflege: Rolllaeden
(
    'faq',
    'Rolllaeden richtig pflegen',
    'Meist reicht es, den Panzer gelegentlich mit einem feuchten Tuch zu reinigen und die Fuehrungsschienen sauber zu halten. Bitte keine aggressiven Reiniger verwenden, damit Oberflaeche und Dichtungen lange halten.',
    ARRAY['Pflege', 'Rolllaeden', 'Reinigung', 'Panzer', 'Fuehrungsschienen', 'Wartung'],
    NULL
),

-- Insektenschutz
(
    'faq',
    'Insektenschutz mit Rolllaeden kombinieren',
    'Oft laesst sich Insektenschutz direkt mitplanen, zum Beispiel als integrierte Loesung im Rollladen-Kasten. So sparen Sie Platz und haben beides in einem System.',
    ARRAY['Insektenschutz', 'Rolllaeden', 'Kombination', 'integriert', 'Rollladen-Kasten', 'Muecken'],
    NULL
),

-- Farben und Auswahl
(
    'faq',
    'Farben und Lamellen Auswahl',
    'Sie koennen aus einer umfangreichen Palette an Lamellenfarben und Profilen waehlen, passend zu Fenster und Fassade. Bei der Beratung zeigen wir Ihnen gerne alle verfuegbaren Optionen.',
    ARRAY['Farbe', 'Farben', 'Lamellen', 'Auswahl', 'Palette', 'Fassade', 'Design', 'RAL'],
    NULL
),

-- Foerderung Wien (detaillierter als bestehender Eintrag)
(
    'faq',
    'Wiener Sonnenschutz-Foerderung Details',
    'Die Stadt Wien foerdert die Montage von Sonnenschutz-Einrichtungen in mehrgeschossigen Wohnbauten mit bis zu 1.500 EUR. Dies gilt fuer Gemeindebau, gefoerderten und freifinanzierten Wohnbau. RolloMax uebernimmt die komplette Beratung und Abwicklung der Foerderantraege fuer Sie.',
    ARRAY['Foerderung', 'Wien', 'Gemeindebau', 'gefoerdert', 'freifinanziert', '1500', 'Antrag', 'Abwicklung'],
    NULL
);
