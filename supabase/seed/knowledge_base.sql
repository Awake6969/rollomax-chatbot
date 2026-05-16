-- ============================================================
-- knowledge_base.sql
-- RolloMax KI-Chatbot: Wissensdatenbank Seed-Daten
-- Quelle: rollomax.at
-- ============================================================

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
    'Das Plissee ist ein flexibler Sonnenschutz, der von oben und unten verstellbar ist. Es eignet sich ideal für Dachfenster und Sonderformen. Durch die flexible Positionierung koennen Sie den Lichteinfall praezise steuern.',
    ARRAY['Plissee', 'Dachfenster', 'Sonderformen', 'flexibel', 'verstellbar', 'Sonnenschutz'],
    'https://rollomax.at/plissee/'
),
(
    'innenbeschattung',
    'Duette (Wabenplissee)',
    'Das Duette, auch Wabenplissee genannt, verfuegt ueber eine spezielle Wabenstruktur für optimale Waermedaemmung. Es wirkt energiesparend sowohl im Winter als auch im Sommer und traegt zur Reduktion Ihrer Heiz- und Kuehlkosten bei.',
    ARRAY['Duette', 'Wabenplissee', 'Waermedaemmung', 'energiesparend', 'Isolation', 'Waben'],
    'https://rollomax.at/duette/'
),
(
    'innenbeschattung',
    'Jalousie',
    'Die Aluminium-Jalousie bietet praezise Lichtsteuerung für den Innenbereich. Die Lamellen lassen sich individuell einstellen, sodass Sie den Lichteinfall genau nach Ihren Wuenschen regulieren koennen.',
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
    'Die Vertikaljalousie ist ideal für große Fensterflaechen und Schiebtueren. Die vertikalen Lamellen sorgen für einen eleganten Sonnenschutz und lassen sich einfach zur Seite schieben.',
    ARRAY['Vertikaljalousie', 'vertikal', 'Lamellen', 'große Fenster', 'Schiebtueren', 'Sonnenschutz'],
    'https://rollomax.at/vertikaljalousie/'
);

-- =========================
-- Kategorie: Außenbeschattung
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'Außenbeschattung',
    'Rolllaeden',
    'Rolllaeden bieten effektiven Waerme-, Kaelte- und Laermschutz für Ihr Zuhause. Sie erhoehen die Sicherheit und sind elektrisch oder manuell bedienbar. Eine zuverlaessige Loesung für jede Jahreszeit.',
    ARRAY['Rolllaeden', 'Waermeschutz', 'Kaelteschutz', 'Laermschutz', 'Sicherheit', 'elektrisch', 'manuell'],
    'https://rollomax.at/rolllaeden/'
),
(
    'Außenbeschattung',
    'Textilrollos (Screens)',
    'Textilrollos, auch Screens genannt, sind ein aussenliegender textiler Sonnenschutz. Sie bieten blendfreien Durchblick nach aussen und schuetzen gleichzeitig vor Hitze und UV-Strahlung.',
    ARRAY['Textilrollos', 'Screens', 'textil', 'aussen', 'Sonnenschutz', 'blendfrei', 'UV-Schutz'],
    'https://rollomax.at/textilrollos/'
),
(
    'Außenbeschattung',
    'Solar Rolllaeden',
    'Solarbetriebene Rolllaeden funktionieren kabellos und unabhaengig vom Stromnetz. Sie sind besonders einfach nachzuruesten, da keine Verkabelung notwendig ist. Eine umweltfreundliche und praktische Loesung.',
    ARRAY['Solar', 'Rolllaeden', 'solarbetrieben', 'kabellos', 'Nachruestung', 'Stromnetz', 'umweltfreundlich'],
    'https://rollomax.at/solar-rolllaeden/'
),
(
    'Außenbeschattung',
    'Aussenjalousien/Raffstores',
    'Aussenjalousien, auch Raffstores genannt, ermoeglichen praezise Lichtsteuerung von aussen. Sie blockieren 75 bis 80 Prozent der Sonnenhitze und sind die beste Loesung für sommerlichen Waermeschutz.',
    ARRAY['Aussenjalousien', 'Raffstores', 'Lichtsteuerung', 'aussen', 'Waermeschutz', 'Sonnenhitze', 'Hitzeschutz'],
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
    'Die Gelenkarmmarkise ist die klassische Terrassenmarkise. Sie ist in einer großen Stoff- und Farbauswahl erhaeltlich und kann elektrisch oder manuell bedient werden. Ideal für die Beschattung Ihrer Terrasse oder Ihres Balkons.',
    ARRAY['Gelenkarmmarkise', 'Terrasse', 'Markise', 'Stoff', 'elektrisch', 'manuell', 'Balkon'],
    'https://rollomax.at/gelenkarmmarkise/'
),
(
    'markisen',
    'Pergolamarkisen',
    'Pergolamarkisen sind besonders robuste Markisen für groessere Flaechen. Sie zeichnen sich durch hohe Windstabilitaet und Langlebigkeit aus und eignen sich hervorragend für große Terrassenbereiche.',
    ARRAY['Pergolamarkisen', 'Pergola', 'robust', 'windstabil', 'langlebig', 'große Flaechen'],
    'https://rollomax.at/pergolamarkisen/'
),
(
    'markisen',
    'Wintergartenmarkisen',
    'Wintergartenmarkisen wurden speziell für Wintergaerten und Glasdaecher entwickelt. Sie sind sowohl für die Aussen- als auch für die Innenmontage geeignet und schuetzen zuverlaessig vor Ueberhitzung.',
    ARRAY['Wintergartenmarkisen', 'Wintergarten', 'Glasdach', 'Aussenmontage', 'Innenmontage', 'Ueberhitzung'],
    'https://rollomax.at/wintergartenmarkisen/'
);

-- =========================
-- Kategorie: ueberdachungen
-- =========================
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
    'Das textile Faltdach bietet flexible Beschattung für Ihre Terrasse. Es ist leicht, elegant und laesst sich bei Bedarf einfach zusammenfalten.',
    ARRAY['Faltdach', 'textil', 'flexibel', 'Beschattung', 'leicht', 'elegant', 'Terrasse'],
    'https://rollomax.at/faltdach/'
),
(
    'ueberdachungen',
    'Glasdach',
    'Das Glasdach ist eine feststehende Glasueberdachung, die lichtdurchlaessig und wettergeschuetzt ist. Ideal für eine helle, geschuetzte Terrasse oder einen Eingangsbereich.',
    ARRAY['Glasdach', 'Glas', 'Ueberdachung', 'lichtdurchlaessig', 'wettergeschuetzt', 'feststehend'],
    'https://rollomax.at/glasdach/'
),
(
    'ueberdachungen',
    'SHADE-System',
    'Das SHADE-System ist ein innovatives Beschattungssystem und Gewinner des German Design Award. Es ueberzeugt durch sein modernes Design und bietet hochwertige Beschattung für anspruchsvolle Architektur.',
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
    'Wir bieten hochwertige Fenster für Neubau und Sanierung. Unsere Fenster zeichnen sich durch beste Waermedaemmung und hohe Qualitaet aus.',
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

-- =========================
-- Kategorie: services
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'services',
    'Kostenlose Beratung',
    'Wir bieten Ihnen eine persoenliche Beratung im Schauraum oder bei Ihnen vor Ort. Die Beratung ist unverbindlich und kostenlos. Unsere Experten helfen Ihnen, die passende Loesung für Ihre Anforderungen zu finden.',
    ARRAY['Beratung', 'kostenlos', 'unverbindlich', 'Schauraum', 'vor Ort', 'persoenlich'],
    NULL
),
(
    'services',
    'Aufmass',
    'Wir fuehren ein professionelles Aufmass bei Ihnen zu Hause durch. Das Aufmass ist die Grundlage für massgeschneiderte Produkte, die exakt zu Ihren Fenstern und Tueren passen.',
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
    'Regelmaessige Wartung sorgt für eine lange Lebensdauer Ihrer Sonnenschutzprodukte. Wir prüfen, reinigen und justieren Ihre Anlagen fachgerecht.',
    ARRAY['Wartung', 'Lebensdauer', 'Pflege', 'regelmaessig', 'Justierung'],
    NULL
),
(
    'services',
    'Nachruestung',
    'Wir bieten die Umruestung von manuell auf elektrisch oder Smart-Home-Steuerung an. Modernisieren Sie Ihre bestehenden Sonnenschutzanlagen für mehr Komfort.',
    ARRAY['Nachruestung', 'Umruestung', 'elektrisch', 'Smart-Home', 'Modernisierung', 'Komfort'],
    NULL
),
(
    'services',
    'Montage ohne Bohren',
    'Viele unserer Produkte koennen ohne Bohren montiert werden. Wir verwenden Klemmtraeger für Fenster oder spezielle Klebehalter. Diese Loesung ist ideal für Mietwohnungen, da keine Schaeden an Fenstern oder Waenden entstehen.',
    ARRAY['Montage ohne Bohren', 'Klemmtraeger', 'Klebehalter', 'Mietwohnung', 'bohrfrei', 'schadensfrei'],
    NULL
);

-- =========================
-- Kategorie: Förderung
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'Förderung',
    'Förderung Stadt Wien',
    'Die Stadt Wien fördert Außenbeschattung in mehrgeschossigen Wohnbauten mit bis zu 1.500 EUR. Die Förderung gilt für Rolllaeden, Aussenjalousien und Markisen. Wir beraten Sie gerne zu den Voraussetzungen und unterstuetzen Sie bei der Antragstellung.',
    ARRAY['Förderung', 'Stadt Wien', 'Außenbeschattung', '1500 EUR', 'Rolllaeden', 'Aussenjalousien', 'Markisen', 'Zuschuss'],
    NULL
);

-- =========================
-- Kategorie: faq
-- =========================
INSERT INTO public.knowledge_base (category, title, content, keywords, url) VALUES
(
    'faq',
    'Aussen vs. Innen Sonnenschutz',
    'Außenbeschattung blockiert 75 bis 80 Prozent der Sonnenhitze, bevor sie das Glas erreicht. Innenbeschattung schafft nur 15 bis 20 Prozent. für effektiven Waermeschutz ist Außenbeschattung daher die beste Wahl.',
    ARRAY['Außenbeschattung', 'Innenbeschattung', 'Vergleich', 'Waermeschutz', 'Sonnenhitze', 'Unterschied'],
    NULL
),
(
    'faq',
    'Rollo vs. Jalousie vs. Plissee',
    'Rollos bieten gleichmaessigen Sicht- und Sonnenschutz. Jalousien ermoeglichen praezise Lichtsteuerung durch verstellbare Lamellen. Plissees sind besonders flexibel und ideal für Sonderformen wie Dachfenster. Welches Produkt am besten zu Ihnen passt, klaeren wir gerne in einer persoenlichen Beratung.',
    ARRAY['Rollo', 'Jalousie', 'Plissee', 'Vergleich', 'Unterschied', 'Lichtsteuerung', 'Sichtschutz'],
    NULL
),
(
    'faq',
    'Beste Verdunkelung',
    'für maximale Verdunkelung empfehlen wir Rolllaeden für aussen oder Verdunkelungsrollos mit seitlichen Fuehrungsschienen für innen. Duette-Wabenplissees bieten zusaetzlich hervorragende Waermedaemmung und sind eine gute Ergaenzung.',
    ARRAY['Verdunkelung', 'Rolllaeden', 'Verdunkelungsrollo', 'Fuehrungsschienen', 'Duette', 'dunkel', 'Schlafzimmer'],
    NULL
),
(
    'faq',
    'Montage ohne Bohren',
    'Ja, viele unserer Produkte koennen ohne Bohren montiert werden. Wir verwenden Klemmtraeger für Fenster oder spezielle Klebehalter. Diese Loesung ist ideal für Mietwohnungen, da keine Schaeden an Fenstern oder Waenden entstehen.',
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
