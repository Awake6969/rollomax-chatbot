-- ============================================================
-- 009_umlaut_sanitization.sql
-- Vollstaendige Umlaut-Bereinigung der knowledge_base
-- Alle ae/oe/ue durch echte Umlaute ersetzt
-- URL-Slugs (rolllaeden, ueberdachungen) bleiben ASCII
-- Datum: 2026-05-16
-- ============================================================

TRUNCATE TABLE public.knowledge_base RESTART IDENTITY;

-- =========================
-- Kategorie: unternehmen
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'unternehmen',
    'RolloMax Wien Übersicht',
    'RolloMax ist ein Familienbetrieb für Sonnenschutz mit Sitz in der Leopoldsgasse 4, 1020 Wien. Inhaber ist Adis Kavaz. Das Unternehmen hat eine Bewertung von 4,7 Sternen auf Google bei 119 Rezensionen.',
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
    'Öffnungszeiten',
    'Unsere Öffnungszeiten sind Montag bis Donnerstag von 08:00 bis 12:00 Uhr und 13:00 bis 17:00 Uhr, Freitag von 08:00 bis 16:00 Uhr. Besuchen Sie auch unseren Schauraum in der Leopoldsgasse 4, 1020 Wien.',
    ARRAY['Öffnungszeiten', 'Schauraum', 'Montag', 'Freitag', 'Uhrzeit', 'offen', 'geöffnet'],
    NULL
),
(
    'unternehmen',
    'Anfahrt',
    'Sie finden uns in der Leopoldsgasse 4, 1020 Wien. Unser Standort ist öffentlich sehr gut erreichbar.',
    ARRAY['Anfahrt', 'Adresse', 'Leopoldsgasse', '1020 Wien', 'öffentlich', 'erreichbar', 'Standort'],
    NULL
);

-- =========================
-- Kategorie: innenbeschattung
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'innenbeschattung',
    'Rollo',
    'Der Rollo ist ein klassischer Sicht- und Sonnenschutz für den Innenbereich. Wir bieten eine große Stoff- und Farbauswahl für individuelle Gestaltung. Die Bedienung ist einfach und unkompliziert.',
    ARRAY['Rollo', 'Sichtschutz', 'Sonnenschutz', 'innen', 'Stoff', 'Farbe'],
    'https://rollomax.at/rollo/'
),
(
    'innenbeschattung',
    'Plissee',
    'Das Plissee ist ein flexibler Sonnenschutz, der von oben und unten verstellbar ist. Es eignet sich ideal für Dachfenster und Sonderformen. Durch die flexible Positionierung können Sie den Lichteinfall präzise steuern.',
    ARRAY['Plissee', 'Dachfenster', 'Sonderformen', 'flexibel', 'verstellbar', 'Sonnenschutz'],
    'https://rollomax.at/plissee/'
),
(
    'innenbeschattung',
    'Duette (Wabenplissee)',
    'Das Duette, auch Wabenplissee genannt, verfügt über eine spezielle Wabenstruktur für optimale Wärmedämmung. Es wirkt energiesparend sowohl im Winter als auch im Sommer und trägt zur Reduktion Ihrer Heiz- und Kühlkosten bei.',
    ARRAY['Duette', 'Wabenplissee', 'Wärmedämmung', 'energiesparend', 'Isolation', 'Waben'],
    'https://rollomax.at/duette/'
),
(
    'innenbeschattung',
    'Jalousie',
    'Die Aluminium-Jalousie bietet präzise Lichtsteuerung für den Innenbereich. Die Lamellen lassen sich individuell einstellen, sodass Sie den Lichteinfall genau nach Ihren Wünschen regulieren können.',
    ARRAY['Jalousie', 'Aluminium', 'Lichtsteuerung', 'Lamellen', 'innen'],
    'https://rollomax.at/jalousie/'
),
(
    'innenbeschattung',
    'Holzjalousie',
    'Die Holzjalousie besticht durch ihre natürliche Optik und hochwertige Holzlamellen. Sie schafft eine warme, einladende Atmosphäre in Ihren Räumen und verbindet Funktionalität mit elegantem Design.',
    ARRAY['Holzjalousie', 'Holz', 'Lamellen', 'natürlich', 'Atmosphäre', 'Design'],
    'https://rollomax.at/holzjalousie/'
),
(
    'innenbeschattung',
    'Vertikaljalousie',
    'Die Vertikaljalousie ist ideal für große Fensterflächen und Schiebetüren. Die vertikalen Lamellen sorgen für einen eleganten Sonnenschutz und lassen sich einfach zur Seite schieben.',
    ARRAY['Vertikaljalousie', 'vertikal', 'Lamellen', 'große Fenster', 'Schiebetüren', 'Sonnenschutz'],
    'https://rollomax.at/vertikaljalousie/'
);

-- =========================
-- Kategorie: Außenbeschattung
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'Außenbeschattung',
    'Rollläden',
    'Rollläden bieten effektiven Wärme-, Kälte- und Lärmschutz für Ihr Zuhause. Sie erhöhen die Sicherheit und sind elektrisch oder manuell bedienbar. Eine zuverlässige Lösung für jede Jahreszeit.',
    ARRAY['Rollläden', 'Wärmeschutz', 'Kälteschutz', 'Lärmschutz', 'Sicherheit', 'elektrisch', 'manuell'],
    'https://rollomax.at/rolllaeden/'
),
(
    'Außenbeschattung',
    'Textilrollos (Screens)',
    'Textilrollos, auch Screens genannt, sind ein aussenliegender textiler Sonnenschutz. Sie bieten blendfreien Durchblick nach aussen und schützen gleichzeitig vor Hitze und UV-Strahlung.',
    ARRAY['Textilrollos', 'Screens', 'textil', 'aussen', 'Sonnenschutz', 'blendfrei', 'UV-Schutz'],
    'https://rollomax.at/textilrollos/'
),
(
    'Außenbeschattung',
    'Solar Rollläden',
    'Solarbetriebene Rollläden funktionieren kabellos und unabhängig vom Stromnetz. Sie sind besonders einfach nachzurüsten, da keine Verkabelung notwendig ist. Eine umweltfreundliche und praktische Lösung.',
    ARRAY['Solar', 'Rollläden', 'solarbetrieben', 'kabellos', 'Nachrüstung', 'Stromnetz', 'umweltfreundlich'],
    'https://rollomax.at/solar-rolllaeden/'
),
(
    'Außenbeschattung',
    'Aussenjalousien/Raffstores',
    'Aussenjalousien, auch Raffstores genannt, ermöglichen präzise Lichtsteuerung von aussen. Sie blockieren 75 bis 80 Prozent der Sonnenhitze und sind die beste Lösung für sommerlichen Wärmeschutz.',
    ARRAY['Aussenjalousien', 'Raffstores', 'Lichtsteuerung', 'aussen', 'Wärmeschutz', 'Sonnenhitze', 'Hitzeschutz'],
    'https://rollomax.at/aussenjalousien/'
),
(
    'Außenbeschattung',
    'Insektenschutz',
    'Wir bieten 6 verschiedene Typen von Insektenschutz an: Spannrahmen, Drehrahmen, Schiebeanlagen, Rollos, Plissees und Lichtschachtabdeckungen. Jeder Insektenschutz wird als Massanfertigung für Ihr Fenster produziert.',
    ARRAY['Insektenschutz', 'Spannrahmen', 'Drehrahmen', 'Schiebeanlagen', 'Rollos', 'Plissees', 'Lichtschacht', 'Massanfertigung'],
    'https://rollomax.at/insektenschutz/'
);

-- =========================
-- Kategorie: markisen
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'markisen',
    'Gelenkarmmarkise',
    'Die Gelenkarmmarkise ist die klassische Terrassenmarkise. Sie ist in einer großen Stoff- und Farbauswahl erhältlich und kann elektrisch oder manuell bedient werden. Ideal für die Beschattung Ihrer Terrasse oder Ihres Balkons.',
    ARRAY['Gelenkarmmarkise', 'Terrasse', 'Markise', 'Stoff', 'elektrisch', 'manuell', 'Balkon'],
    'https://rollomax.at/gelenkarmmarkise/'
),
(
    'markisen',
    'Pergolamarkisen',
    'Pergolamarkisen sind besonders robuste Markisen für größere Flächen. Sie zeichnen sich durch hohe Windstabilität und Langlebigkeit aus und eignen sich hervorragend für große Terrassenbereiche.',
    ARRAY['Pergolamarkisen', 'Pergola', 'robust', 'windstabil', 'langlebig', 'große Flächen'],
    'https://rollomax.at/pergolamarkisen/'
),
(
    'markisen',
    'Wintergartenmarkisen',
    'Wintergartenmarkisen wurden speziell für Wintergärten und Glasdächer entwickelt. Sie sind sowohl für die Aussen- als auch für die Innenmontage geeignet und schützen zuverlässig vor Überhitzung.',
    ARRAY['Wintergartenmarkisen', 'Wintergarten', 'Glasdach', 'Aussenmontage', 'Innenmontage', 'Überhitzung'],
    'https://rollomax.at/wintergartenmarkisen/'
);

-- =========================
-- Kategorie: überdachungen
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'ueberdachungen',
    'Lamellendach',
    'Das Lamellendach verfügt über verstellbare Aluminiumlamellen und bietet sowohl Regen- als auch Sonnenschutz. Es ermöglicht die Ganzjahres-Nutzung Ihrer Terrasse bei jeder Witterung.',
    ARRAY['Lamellendach', 'Aluminium', 'Lamellen', 'Regenschutz', 'Sonnenschutz', 'Terrasse', 'ganzjährig'],
    'https://rollomax.at/lamellendach/'
),
(
    'ueberdachungen',
    'Faltdach',
    'Das textile Faltdach bietet flexible Beschattung für Ihre Terrasse. Es ist leicht, elegant und lässt sich bei Bedarf einfach zusammenfalten.',
    ARRAY['Faltdach', 'textil', 'flexibel', 'Beschattung', 'leicht', 'elegant', 'Terrasse'],
    'https://rollomax.at/faltdach/'
),
(
    'ueberdachungen',
    'Glasdach',
    'Das Glasdach ist eine feststehende Glasüberdachung, die lichtdurchlässig und wettergeschützt ist. Ideal für eine helle, geschützte Terrasse oder einen Eingangsbereich.',
    ARRAY['Glasdach', 'Glas', 'Überdachung', 'lichtdurchlässig', 'wettergeschützt', 'feststehend'],
    'https://rollomax.at/glasdach/'
),
(
    'ueberdachungen',
    'SHADE-System',
    'Das SHADE-System ist ein innovatives Beschattungssystem und Gewinner des German Design Award. Es überzeugt durch sein modernes Design und bietet hochwertige Beschattung für anspruchsvolle Architektur.',
    ARRAY['SHADE', 'SHADE-System', 'innovativ', 'German Design Award', 'modern', 'Design', 'Beschattung'],
    'https://rollomax.at/shade-system/'
);

-- =========================
-- Kategorie: rund_ums_haus
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'rund_ums_haus',
    'Fenster',
    'Wir bieten hochwertige Fenster für Neubau und Sanierung. Unsere Fenster zeichnen sich durch beste Wärmedämmung und hohe Qualität aus.',
    ARRAY['Fenster', 'Neubau', 'Sanierung', 'Wärmedämmung', 'Qualität'],
    'https://rollomax.at/fenster/'
),
(
    'rund_ums_haus',
    'Türen',
    'Unser Sortiment umfasst Eingangstüren, Balkontüren und Schiebetüren. Alle Türen vereinen Sicherheit mit ansprechendem Design.',
    ARRAY['Türen', 'Eingangstür', 'Balkontür', 'Schiebetür', 'Sicherheit', 'Design'],
    'https://rollomax.at/tueren/'
),
(
    'rund_ums_haus',
    'Rolltore',
    'Wir bieten Garagentore und Rolltore, die elektrisch bedienbar sind. Zuverlässig, sicher und komfortabel.',
    ARRAY['Rolltore', 'Garagentore', 'elektrisch', 'Garage', 'Tor'],
    'https://rollomax.at/rolltore/'
),
(
    'rund_ums_haus',
    'Carport Modena',
    'Der Carport Modena ist ein moderner Aluminium-Carport mit optionaler Seitenbeschattung. Er verbindet Funktionalität mit zeitgemäßem Design.',
    ARRAY['Carport', 'Modena', 'Aluminium', 'Seitenbeschattung', 'modern'],
    'https://rollomax.at/carport-modena/'
);

-- =========================
-- Kategorie: services
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'services',
    'Kostenlose Beratung',
    'Wir bieten Ihnen eine persönliche Beratung im Schauraum oder bei Ihnen vor Ort. Die Beratung ist unverbindlich und kostenlos. Unsere Experten helfen Ihnen, die passende Lösung für Ihre Anforderungen zu finden.',
    ARRAY['Beratung', 'kostenlos', 'unverbindlich', 'Schauraum', 'vor Ort', 'persönlich'],
    NULL
),
(
    'services',
    'Aufmaß',
    'Wir führen ein professionelles Aufmaß bei Ihnen zu Hause durch. Das Aufmaß ist die Grundlage für maßgeschneiderte Produkte, die exakt zu Ihren Fenstern und Türen passen.',
    ARRAY['Aufmaß', 'professionell', 'maßgeschneidert', 'Vermessung', 'zu Hause'],
    NULL
),
(
    'services',
    'Montage',
    'Unser erfahrenes Team führt die fachgerechte Montage Ihrer Sonnenschutzprodukte durch. Sauber, zuverlässig und termingerecht.',
    ARRAY['Montage', 'fachgerecht', 'Installation', 'Team', 'zuverlässig'],
    NULL
),
(
    'services',
    'Reparatur',
    'Wir reparieren alle gängigen Sonnenschutzprodukte, darunter Gurt, Schnur, Motor und Funk. Auch Fremdprodukte werden von uns instand gesetzt.',
    ARRAY['Reparatur', 'Gurt', 'Schnur', 'Motor', 'Funk', 'Fremdprodukte', 'Instandsetzung'],
    NULL
),
(
    'services',
    'Wartung',
    'Regelmäßige Wartung sorgt für eine lange Lebensdauer Ihrer Sonnenschutzprodukte. Wir prüfen, reinigen und justieren Ihre Anlagen fachgerecht.',
    ARRAY['Wartung', 'Lebensdauer', 'Pflege', 'regelmäßig', 'Justierung'],
    NULL
),
(
    'services',
    'Nachrüstung',
    'Wir bieten die Umrüstung von manuell auf elektrisch oder Smart-Home-Steuerung an. Modernisieren Sie Ihre bestehenden Sonnenschutzanlagen für mehr Komfort.',
    ARRAY['Nachrüstung', 'Umrüstung', 'elektrisch', 'Smart-Home', 'Modernisierung', 'Komfort'],
    NULL
),
(
    'services',
    'Montage ohne Bohren',
    'Viele unserer Produkte können ohne Bohren montiert werden. Wir verwenden Klemmträger für Fenster oder spezielle Klebehalter. Diese Lösung ist ideal für Mietwohnungen, da keine Schäden an Fenstern oder Wänden entstehen.',
    ARRAY['Montage ohne Bohren', 'Klemmträger', 'Klebehalter', 'Mietwohnung', 'bohrfrei', 'schadensfrei'],
    NULL
);

-- =========================
-- Kategorie: Förderung
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'Förderung',
    'Förderung Stadt Wien',
    'Die Stadt Wien fördert Außenbeschattung in mehrgeschossigen Wohnbauten mit bis zu 1.500 EUR. Die Förderung gilt für Rollläden, Aussenjalousien und Markisen. Wir beraten Sie gerne zu den Voraussetzungen und unterstützen Sie bei der Antragstellung.',
    ARRAY['Förderung', 'Stadt Wien', 'Außenbeschattung', '1500 EUR', 'Rollläden', 'Aussenjalousien', 'Markisen', 'Zuschuss'],
    NULL
);

-- =========================
-- Kategorie: faq
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'faq',
    'Aussen vs. Innen Sonnenschutz',
    'Außenbeschattung blockiert 75 bis 80 Prozent der Sonnenhitze, bevor sie das Glas erreicht. Innenbeschattung schafft nur 15 bis 20 Prozent. Für effektiven Wärmeschutz ist Außenbeschattung daher die beste Wahl.',
    ARRAY['Außenbeschattung', 'Innenbeschattung', 'Vergleich', 'Wärmeschutz', 'Sonnenhitze', 'Unterschied'],
    NULL
),
(
    'faq',
    'Rollo vs. Jalousie vs. Plissee',
    'Rollos bieten gleichmäßigen Sicht- und Sonnenschutz. Jalousien ermöglichen präzise Lichtsteuerung durch verstellbare Lamellen. Plissees sind besonders flexibel und ideal für Sonderformen wie Dachfenster. Welches Produkt am besten zu Ihnen passt, klären wir gerne in einer persönlichen Beratung.',
    ARRAY['Rollo', 'Jalousie', 'Plissee', 'Vergleich', 'Unterschied', 'Lichtsteuerung', 'Sichtschutz'],
    NULL
),
(
    'faq',
    'Beste Verdunkelung',
    'Für maximale Verdunkelung empfehlen wir Rollläden für aussen oder Verdunkelungsrollos mit seitlichen Führungsschienen für innen. Duette-Wabenplissees bieten zusätzlich hervorragende Wärmedämmung und sind eine gute Ergänzung.',
    ARRAY['Verdunkelung', 'Rollläden', 'Verdunkelungsrollo', 'Führungsschienen', 'Duette', 'dunkel', 'Schlafzimmer'],
    NULL
),
(
    'faq',
    'Montage ohne Bohren',
    'Ja, viele unserer Produkte können ohne Bohren montiert werden. Wir verwenden Klemmträger für Fenster oder spezielle Klebehalter. Diese Lösung ist ideal für Mietwohnungen, da keine Schäden an Fenstern oder Wänden entstehen.',
    ARRAY['Montage ohne Bohren', 'Klemmträger', 'Klebehalter', 'Mietwohnung', 'bohrfrei', 'ohne Bohren'],
    NULL
),
(
    'faq',
    'Pflege-Tipps',
    'Die meisten Sonnenschutzprodukte lassen sich einfach mit einem feuchten Tuch reinigen. Jalousie-Lamellen können mit einem Lamellenreiniger gesäubert werden. Bei Stoffprodukten empfehlen wir regelmäßiges Absaugen mit niedriger Stufe.',
    ARRAY['Pflege', 'Reinigung', 'Tipps', 'Tuch', 'Lamellenreiniger', 'Absaugen', 'Wartung'],
    NULL
);
