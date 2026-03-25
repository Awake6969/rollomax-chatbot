# Ergaenzung zur Datenschutzerklaerung: KI-Chatbot

> Dieser Text ist zur Uebernahme in die bestehende Datenschutzerklaerung auf rollomax.at vorgesehen. Er kann direkt kopiert und eingefuegt werden.

---

## 1. Verantwortlicher

Verantwortlicher fuer die Datenverarbeitung im Zusammenhang mit dem KI-Chatbot:

**RolloMax**
Adis Kavaz
Leopoldsgasse 4
1020 Wien
E-Mail: team@rollomax.at

---

## 2. Beschreibung des KI-Chatbots

Auf unserer Website setzen wir einen KI-gestuetzten Chatbot ein, der auf dem Sprachmodell Claude von Anthropic basiert. Der Chatbot beantwortet Fragen rund um Sonnenschutzprodukte, unsere Dienstleistungen und allgemeine Informationen zu RolloMax.

**Kennzeichnung gemaess EU AI Act:**
Gemaess Artikel 50 der EU-Verordnung ueber kuenstliche Intelligenz (AI Act) weisen wir Sie darauf hin, dass Sie mit einem KI-System kommunizieren. Der Chatbot ist deutlich als "KI-Assistent" gekennzeichnet, und jede Antwort traegt ein KI-Badge. Es handelt sich nicht um einen Live-Chat mit einem menschlichen Mitarbeiter.

---

## 3. Rechtsgrundlage

Die Verarbeitung Ihrer Daten im Rahmen der Chatbot-Nutzung erfolgt auf Grundlage Ihrer **Einwilligung gemaess Art. 6 Abs. 1 lit. a DSGVO**.

Bevor Sie den Chatbot nutzen koennen, wird Ihre ausdrueckliche Einwilligung ueber einen Consent-Screen eingeholt. Die Checkbox ist nicht vorausgewaehlt, und der Chat kann erst nach aktiver Zustimmung gestartet werden.

Sie koennen Ihre Einwilligung jederzeit widerrufen (siehe Abschnitt 8).

---

## 4. Verarbeitete Daten

Im Rahmen der Chatbot-Nutzung werden folgende Daten verarbeitet:

- **Anonymisierter Hash der IP-Adresse:** Ihre IP-Adresse wird mittels SHA-256 gehasht und nur in anonymisierter Form gespeichert. Eine Rueckfuehrung auf die Original-IP-Adresse ist nicht moeglich.
- **Chat-Nachrichten:** Ihre Fragen sowie die Antworten des Chatbots werden fuer die Dauer der Speicherfrist gespeichert.
- **Freiwillig angegebene Kontaktdaten:** Falls Sie im Rahmen des Chats Kontaktdaten angeben (Name, E-Mail-Adresse, Telefonnummer), werden diese zur Kontaktaufnahme und Terminvereinbarung gespeichert. Die Angabe dieser Daten ist freiwillig.
- **Technische Daten:** Zeitstempel der Nachrichten und die URL der Seite, auf der der Chat gestartet wurde.

---

## 5. Zweck der Verarbeitung

Ihre Daten werden zu folgenden Zwecken verarbeitet:

- Beantwortung Ihrer Anfragen zu Sonnenschutzprodukten und Dienstleistungen von RolloMax
- Individuelle Beratung zu Produkten wie Rolllaeden, Jalousien, Markisen und Insektenschutz
- Lead-Generierung fuer Beratungstermine und Angebotserstellung, sofern Sie freiwillig Ihre Kontaktdaten angeben

---

## 6. Speicherdauer

- **Chat-Verlaeufe** (Nachrichten und zugehoerige Session-Daten): werden **90 Tage** nach der letzten Aktivitaet automatisch geloescht.
- **Kontaktdaten (Leads):** werden **2 Jahre** nach der Erfassung automatisch geloescht.

Die automatische Loeschung erfolgt taeglich ueber einen serverseitigen Cron-Job. Eine vorzeitige Loeschung ist auf Anfrage jederzeit moeglich.

---

## 7. Auftragsverarbeiter

Fuer den Betrieb des KI-Chatbots setzen wir folgende Auftragsverarbeiter ein:

### Anthropic PBC (USA)

- **Zweck:** Verarbeitung der Chat-Nachrichten durch das KI-Modell Claude
- **Daten:** Chat-Nachrichten (Fragen und Kontext) werden zur Generierung von Antworten an die Claude API uebermittelt
- **Absicherung:** EU-Standardvertragsklauseln (SCCs) gemaess Art. 46 Abs. 2 lit. c DSGVO
- **Website:** [anthropic.com](https://www.anthropic.com)

### Supabase Inc. (USA)

- **Zweck:** Speicherung der Chat-Verlaeufe, Lead-Daten und Knowledge Base
- **Daten:** Chat-Nachrichten, anonymisierte IP-Hashes, freiwillig angegebene Kontaktdaten
- **Absicherung:** EU-Standardvertragsklauseln (SCCs) gemaess Art. 46 Abs. 2 lit. c DSGVO
- **Website:** [supabase.com](https://supabase.com)

### Hostinger International Ltd.

- **Zweck:** Hosting des Chatbot-Servers (VPS), auf dem die Workflow-Engine und der Reverse Proxy laufen
- **Daten:** Technische Serverdaten, verschluesselte Kommunikation
- **Website:** [hostinger.com](https://www.hostinger.com)

---

## 8. Ihre Rechte

Sie haben im Zusammenhang mit der Verarbeitung Ihrer personenbezogenen Daten folgende Rechte:

- **Auskunftsrecht (Art. 15 DSGVO):** Sie koennen Auskunft ueber Ihre bei uns gespeicherten Daten verlangen.
- **Recht auf Berichtigung (Art. 16 DSGVO):** Sie koennen die Berichtigung unrichtiger Daten verlangen.
- **Recht auf Loeschung (Art. 17 DSGVO):** Sie koennen die Loeschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
- **Recht auf Einschraenkung (Art. 18 DSGVO):** Sie koennen die Einschraenkung der Verarbeitung Ihrer Daten verlangen.
- **Recht auf Datenportabilitaet (Art. 20 DSGVO):** Sie koennen verlangen, dass Ihre Daten in einem strukturierten, gaengigen und maschinenlesbaren Format bereitgestellt werden.
- **Widerspruchsrecht (Art. 21 DSGVO):** Sie koennen der Verarbeitung Ihrer Daten widersprechen.

### Widerruf der Einwilligung

Sie koennen Ihre Einwilligung zur Datenverarbeitung durch den Chatbot jederzeit widerrufen. Der Widerruf ist moeglich:

- **Im Chat-Widget:** Ueber das Einstellungs-Menue (Zahnrad-Symbol) koennen Sie Ihre Einwilligung direkt widerrufen. Dadurch werden Ihre lokalen Chat-Daten geloescht und der Consent-Screen wird erneut angezeigt.
- **Per E-Mail:** Senden Sie eine formlose Nachricht an team@rollomax.at mit dem Betreff "Widerruf Chatbot-Einwilligung".

Der Widerruf beruehrt nicht die Rechtmaessigkeit der bis dahin erfolgten Verarbeitung.

---

## 9. Beschwerderecht

Sie haben das Recht, sich bei der zustaendigen Datenschutzbehoerde zu beschweren:

**Oesterreichische Datenschutzbehoerde**
Barichgasse 40-42
1030 Wien
E-Mail: dsb@dsb.gv.at
Website: [dsb.gv.at](https://www.dsb.gv.at)
