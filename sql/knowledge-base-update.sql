-- RolloMax Knowledge Base - Vollständiges Update
-- Erstellt: 2026-03-31
-- Quelle: rollomax.at Scraping + Preislisten

-- Alte Einträge löschen
DELETE FROM knowledge_base;

-- =====================================================
-- UNTERNEHMEN
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('unternehmen', 'RolloMax Wien Übersicht',
'Familienbetrieb mit eigener Produktion in Wien. Spezialisiert auf Sonnenschutz, Fenster und Türen. Zertifiziert mit top-ausgebildetem Fachpersonal. Über 200 Altbau-Projekte erfolgreich durchgeführt. Google-Bewertung: 4,7 Sterne (119+ Rezensionen). Liefergebiet: Wien und Niederösterreich.',
'https://rollomax.at'),

('unternehmen', 'Kontakt und Öffnungszeiten',
'Adresse: Leopoldsgasse 4, 1020 Wien. Telefon: +43 1 212 2446. E-Mail: team@rollomax.at. Öffnungszeiten: Mo-Fr 08:00-17:00 Uhr. Schauraum zum Testen aller Produkte vor Ort verfügbar.',
'https://rollomax.at/kontakt'),

('unternehmen', 'Dienstleistungen',
'Kostenlose Beratung vor Ort. Professionelles Aufmaß und Planung. Fachgerechte Montage durch eigene Monteure. Reparatur und Wartung aller Systeme. Umrüstung von manuell auf elektrisch. Unterstützung bei Förderanträgen inklusive.',
NULL);

-- =====================================================
-- ROLLLÄDEN
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('rolllaeden', 'Rollläden Übersicht',
'Typen: Vorbaurollläden (außen montiert), Aufsatzrollläden (auf Fensterrahmen), Solar-Rollläden (ohne Stromanschluss). Vorteile: Wärmeschutz, Einbruchschutz, komplette Verdunkelung, 25+ Jahre Lebensdauer. Auch für Altbau-Nachrüstung geeignet, sogar bei Kastenfenstern.',
'https://rollomax.at/rolllaeden'),

('rolllaeden', 'Rollläden Preise',
'Vorbaurollläden Richtpreise (nur Material):
- 100x120cm: ca. 360-400 EUR
- 120x150cm: ca. 460-500 EUR
- 140x180cm: ca. 560-600 EUR
- 200x200cm: ca. 650-750 EUR
Montage: 120 EUR/Stk (1-3 Stk), 96 EUR/Stk (4-10 Stk), 87 EUR/Stk (ab 10 Stk).
Fahrkosten: 65 EUR (1020/1200 Bezirk), 110 EUR (andere Bezirke).
Mit Förderung oft 50% günstiger!',
NULL),

('rolllaeden', 'Rollläden mit Insektenschutz',
'Vorsatzrollladen mit integriertem Fliegengitter. Kombilösung: Sonnenschutz und Insektenschutz in einem System. Preise ca. 15-20% höher als Standard-Rollläden. Maximale Größen etwas eingeschränkt durch Fliegengitter-Gewebe. Ideal für Schlafzimmer und Küche.',
NULL),

('rolllaeden', 'Antriebsoptionen',
'Manuell: Gurt- oder Kurbelbedienung (günstigste Option).
Elektrisch nachrüsten: Rohrmotor in bestehende Welle (150-250 EUR).
Solar-Motor: Mit Akku und Solarpanel, kein Stromanschluss nötig (300-400 EUR).
Elektrischer Gurtwickler: Einfachste Nachrüstlösung (150-200 EUR).
Verkabelung & Programmierung: 120 EUR pro Stück.',
NULL),

('rolllaeden', 'Solar-Rollläden',
'Funktionieren komplett ohne Stromanschluss durch Solarpanel und Akku. Ideal für Nachrüstung ohne Elektriker-Kosten (spart 200-400 EUR). Funktionieren auch bei Stromausfall. Aufpreis ca. 150-200 EUR pro Fenster gegenüber kabelgebunden. Volle Förderungsfähigkeit.',
NULL);

-- =====================================================
-- AUSSENJALOUSIEN / RAFFSTOREN
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('aussenjalousien', 'Außenjalousien vs Rollläden',
'Rollläden: Feste Lamellen, komplette Verdunkelung, Lärmschutz, Einbruchschutz.
Außenjalousien/Raffstoren: Verstellbare Lamellen, flexible Lichtsteuerung, Sicht nach außen möglich.
Raffstoren kosten ca. 20-30% mehr als Rollläden. Beide voll förderungsfähig.',
NULL),

('aussenjalousien', 'Außenjalousien Preise',
'Richtwert: 500-1.000 EUR pro Fenster inkl. Montage. Variiert je nach Größe, Lamellentyp und Antrieb. Mit Wiener Förderung (50%) reduziert sich der Eigenanteil erheblich.',
NULL);

-- =====================================================
-- MARKISEN
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('markisen', 'Markisen Übersicht',
'Typen: Gelenkarmmarkisen (klassisch, ab ca. 1.500 EUR), Kassettenmarkisen (Stoff geschützt, langlebiger), Pergolamarkisen (für große Flächen, ab ca. 3.000 EUR), Wintergartenmarkisen (für Glasdächer). Alle mit Motor nachrüstbar.',
NULL),

('markisen', 'Gelenkarmmarkise vs Kassettenmarkise',
'Gelenkarmmarkise: Klassische Bauform, günstiger Einstieg, ideal bis 4m Ausfall, Stoff offen (weniger geschützt).
Kassettenmarkise: Stoff vollständig im Gehäuse versenkt, dadurch langlebiger, Ausfall bis ca. 6m möglich, empfohlen für dauerhaften Außeneinsatz.',
NULL),

('markisen', 'Markisen Hinweis Förderung',
'ACHTUNG: Gelenkarmmarkisen sind NICHT förderungsfähig! Nur Markisen die parallel zur Glasfläche positioniert sind (z.B. Senkrechtmarkisen, Fassadenmarkisen) werden gefördert.',
NULL);

-- =====================================================
-- FÖRDERUNG
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('foerderung', 'Wiener Sonnenschutz-Förderung Übersicht',
'Förderhöhe: Bis zu 1.500 EUR pro Wohneinheit, maximal 50% der Kosten. Kein Rechtsanspruch, abhängig vom Budget. WICHTIG: Antrag VOR der Montage stellen! RolloMax unterstützt kostenlos bei der Antragstellung.',
'https://www.wien.gv.at/amtshelfer/bauen-wohnen/wohnbaufoerderung/foerderungsantraege/sonnenschutz.html'),

('foerderung', 'Förderung Voraussetzungen',
'Gebäude: Mehrgeschossig mit mindestens 3 Wohneinheiten. Gebäudealter: Über 20 Jahre. NICHT gefördert: Einfamilienhäuser, Zweifamilienhäuser, Reihenhäuser, Geschäftslokale. In Schutzzonen: MA 19 Baubewilligung erforderlich (wird meist genehmigt wenn Farbe zur Fassade passt).',
NULL),

('foerderung', 'Geförderte Produkte',
'Gefördert: Rollläden, Textilrollos, Solar-Rollläden, Außenjalousien/Raffstoren, Senkrechtmarkisen. NICHT gefördert: Gelenkarmmarkisen, Markisen die nicht parallel zur Glasfläche sind.',
NULL),

('foerderung', 'Förderung Ablauf',
'1. Kostenlose Beratung bei RolloMax vereinbaren. 2. Angebot erstellen lassen. 3. Förderantrag ONLINE stellen (vor Montage!). 4. Auf Förderzusage warten. 5. Montage durchführen. 6. Rechnung einreichen. Benötigte Unterlagen: Zustimmung Hauseigentümer/Verwaltung, Rechnung, ggf. MA 19 Bewilligung.',
NULL);

-- =====================================================
-- FAQ
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('faq', 'Rollläden im Altbau nachrüsten',
'Ja, einfach möglich! Vorbaurollläden werden außen montiert, kein Fenstertausch nötig. Solar-Antriebe eliminieren Elektriker-Kosten. In Schutzzonen: MA 19 Genehmigung erforderlich, wird aber meist erteilt wenn Farbe zur Fassade passt.',
NULL),

('faq', 'Elektrisch oder manuell',
'Elektrisch ist heute Standard, Aufpreis nur ca. 100-150 EUR pro Fenster. Vorteile: Komfort, Zeitschaltung, Smart-Home-Integration möglich. Für Nachrüstung: Solar-Motoren benötigen keinen Stromanschluss. Beide Varianten sind förderungsfähig.',
NULL),

('faq', 'Bestehende Rollläden elektrisch nachrüsten',
'Oft möglich! Motor wird in bestehende Welle eingebaut. Kosten: 200-350 EUR pro Fenster inkl. Montage. Solar-Nachrüstmotor ohne Stromanschluss: 300-400 EUR.',
NULL),

('faq', 'Qualitätsmerkmale Rollläden',
'Gute Qualität erkennen: Aluminium-Lamellen, Marken-Motoren (Somfy, Becker), UV-beständige Beschichtung, Windwiderstandsklasse 2+, deutsche/österreichische Fertigung, mindestens 5 Jahre Garantie.',
NULL),

('faq', 'Zimmer richtig abdunkeln',
'Außenrollläden sind am effektivsten - sie blockieren Licht bevor es ans Fenster kommt. Innenrollos haben immer Lichtschlitze an den Rändern. Für Mieter ohne Bohren: Klemmträger oder Verdunkelungsfolie (aber weniger effektiv).',
NULL),

('faq', 'Montagezeit',
'Installation: Ca. 1-2 Stunden pro Fenster bei motorisierten Rollläden. Endpunkte werden programmiert für automatisches Stoppen oben/unten.',
NULL);

-- =====================================================
-- PREISTABELLEN (für Kalkulation)
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('preise', 'Vorbaurollläden Preistabelle',
'Preise in EUR (nur Material, ohne Montage):
Breite 80cm: Höhe 80cm=319, 100cm=337, 120cm=359, 150cm=385, 180cm=416, 200cm=433
Breite 100cm: Höhe 80cm=341, 100cm=361, 120cm=387, 150cm=419, 180cm=454, 200cm=474
Breite 120cm: Höhe 80cm=362, 100cm=386, 120cm=416, 150cm=453, 180cm=492, 200cm=516
Breite 150cm: Höhe 80cm=399, 100cm=428, 120cm=464, 150cm=508, 180cm=557, 200cm=608
Breite 180cm: Höhe 80cm=441, 100cm=477, 120cm=520, 150cm=574, 180cm=633, 200cm=674
Breite 200cm: Höhe 80cm=465, 100cm=503, 120cm=551, 150cm=610, 180cm=675, 200cm=714',
NULL),

('preise', 'Montage und Nebenkosten',
'Montagekosten pro Stück: 1-3 Stück = 120 EUR, 4-10 Stück = 96 EUR, ab 10 Stück = 87 EUR.
Fahrkosten: 1020 & 1200 Bezirk = 65 EUR, andere Wiener Bezirke = 110 EUR.
Verkabelung & Programmierung: 120 EUR pro Stück.
Solar-Aufpreis: ca. 150-200 EUR pro Fenster.',
NULL),

('preise', 'Preisbeispiel Kalkulation',
'Beispiel: 3 Fenster je 120x150cm in 1020 Wien:
- Material: 3 x 464 EUR = 1.392 EUR
- Montage: 3 x 120 EUR = 360 EUR
- Fahrkosten: 65 EUR
- GESAMT: ca. 1.817 EUR
- Mit 50% Förderung: ca. 909 EUR Eigenanteil',
NULL);

-- =====================================================
-- ÜBERDACHUNGEN
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('ueberdachungen', 'Überdachungen Übersicht',
'Lamellendach: Verstellbare Lamellen, Regen- und Sonnenschutz, ab ca. 8.000 EUR. Glasdach: Maximale Helligkeit, mit Beschattung kombinierbar. Pergolamarkise: Textile Lösung, ab ca. 3.000 EUR. SHADE-System: German Design Award Winner, Premium-Lösung.',
NULL);

-- =====================================================
-- SONSTIGES
-- =====================================================

INSERT INTO knowledge_base (category, title, content, url) VALUES
('sonstiges', 'Reparatur Service',
'RolloMax repariert: Gurte, Schnüre, Motoren, Funksteuerungen. Schnelle Termine, faire Preise. Auch Fremdprodukte werden repariert. Anruf genügt: +43 1 212 2446.',
NULL),

('sonstiges', 'Smart Home Integration',
'Rollläden und Jalousien können in Smart-Home-Systeme integriert werden. Steuerung per App, Sprachassistent oder Zeitschaltuhr. Nachrüstung bestehender Motoren oft möglich. Beratung vor Ort kostenlos.',
NULL);

-- Verify
SELECT category, COUNT(*) as count FROM knowledge_base GROUP BY category ORDER BY category;
