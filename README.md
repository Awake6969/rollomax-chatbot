# RolloMax KI-Chatbot

KI-gestuetzter Chatbot fuer RolloMax Wien (Sonnenschutz-Fachbetrieb).

---

## Architektur

Der RolloMax KI-Chatbot basiert auf folgendem Tech-Stack:

- **N8N** (laeuft als Docker-Container) als Workflow-Engine fuer die gesamte Chat-Logik
- **Claude API** (`claude-sonnet-4-6` von Anthropic) als KI-Modell fuer die Beantwortung von Kundenanfragen
- **Supabase** (PostgreSQL + REST API) als Datenbank fuer Chat-Verlaeufe, Leads und die Knowledge Base
- **Caddy 2** als Reverse Proxy mit automatischem SSL (Let's Encrypt)
- **Vanilla JS Widget** als leichtgewichtiges Chat-Widget, das auf rollomax.at eingebettet wird (Shadow DOM, kein Framework)

### Datenfluss

```
Besucher -> Widget -> chat.rollomax.at (Caddy) -> N8N -> Claude API
                                                      -> Supabase
```

1. Der Besucher oeffnet das Chat-Widget auf rollomax.at und gibt seine Einwilligung.
2. Das Widget sendet Nachrichten per HTTPS an `chat.rollomax.at`.
3. Caddy leitet die Anfrage an N8N weiter (Reverse Proxy).
4. N8N verarbeitet die Nachricht: Kontext aus Supabase laden, Claude API aufrufen, Antwort speichern.
5. Die Antwort geht zurueck ans Widget und wird dem Besucher angezeigt.

---

## Voraussetzungen

- **Git** (fuer Versionskontrolle und Deployment)
- **Docker + Docker Compose** (fuer N8N und Caddy)
- **Hostinger VPS mit SSH-Zugang** (oder vergleichbarer Linux-Server)
- **Supabase Account** (kostenlos auf supabase.com)
- **Anthropic API Key** (fuer Claude API-Zugang)
- **Domain chat.rollomax.at** (DNS A-Record muss auf die VPS IP-Adresse zeigen)

---

## Erstinstallation

```bash
# Auf dem Hostinger VPS:
cd /opt
git clone git@github.com:DEIN-USERNAME/rollomax-chatbot.git
cd rollomax-chatbot
cp .env.example .env
nano .env  # Echte API-Keys eintragen
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Das Deploy-Skript erledigt automatisch:
- Docker-Images herunterladen und starten
- Caddy konfigurieren (SSL-Zertifikat wird automatisch geholt)
- N8N starten und unter `chat.rollomax.at` verfuegbar machen

---

## Supabase einrichten

1. **Neues Projekt erstellen** auf [supabase.com](https://supabase.com)
2. **SQL Editor oeffnen** im Supabase Dashboard
3. **Migrations ausfuehren** in der richtigen Reihenfolge:
   - `supabase/migrations/001_create_tables.sql` (Tabellen anlegen)
   - `supabase/migrations/002_rls_policies.sql` (Row Level Security konfigurieren)
   - `supabase/migrations/003_auto_delete_cron.sql` (Automatische Datenloeschung einrichten)
4. **pg_cron Extension aktivieren**: Im Dashboard unter Database > Extensions nach `pg_cron` suchen und aktivieren
5. **Seed-Daten einfuegen**: `supabase/seed/knowledge_base.sql` im SQL Editor ausfuehren (RolloMax Produktwissen und Firmendaten)
6. **API Keys kopieren**: Im Dashboard unter Settings > API die folgenden Werte in die `.env` Datei uebertragen:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon / public Key)
   - `SUPABASE_SERVICE_KEY` (service_role Key, geheim halten!)

---

## DNS-Konfiguration

Beim Domain-Provider (z.B. Hostinger DNS-Verwaltung) folgenden Eintrag anlegen:

| Typ       | Name   | Wert              | TTL         |
|-----------|--------|--------------------|-------------|
| A-Record  | chat   | VPS IP-Adresse     | 300 (5 Min) |

- Der A-Record zeigt `chat.rollomax.at` auf die IP-Adresse des VPS.
- TTL auf 300 Sekunden (5 Minuten) setzen, damit DNS-Aenderungen schnell wirksam werden.
- Caddy holt sich automatisch ein SSL-Zertifikat via Let's Encrypt, sobald die Domain korrekt aufgeloest wird.

---

## N8N Workflow importieren

1. **N8N oeffnen**: [https://chat.rollomax.at](https://chat.rollomax.at) (Login mit Basic Auth, siehe `.env`)
2. **Workflows > Import from File** auswaehlen
3. **Datei hochladen**: `n8n-workflows/rollomax-chatbot-workflow.json`
4. **Credentials konfigurieren**:
   - In den HTTP Request Nodes die Supabase URL und den Service Key eintragen
   - Anthropic API Key in den entsprechenden Nodes hinterlegen
5. **Workflows aktivieren** (Toggle auf "Active" setzen)

Nach dem Aktivieren ist der Chatbot einsatzbereit und wartet auf eingehende Anfragen.

---

## Widget auf rollomax.at einbetten

### Bubble-Modus (alle Seiten)

Das Chat-Widget erscheint als schwebender Button unten rechts. Ideal fuer die gesamte Website.

```html
<script src="https://chat.rollomax.at/widget/rollomax-chat-widget.js"
  data-token="IHR_WIDGET_TOKEN"
  data-mode="bubble"
  async></script>
```

### Inline-Modus (Kontaktseite)

Das Chat-Widget wird direkt in einen Container auf der Seite eingebettet. Ideal fuer die Kontaktseite.

```html
<div id="rollomax-chat-embed" style="height: 600px;"></div>
<script src="https://chat.rollomax.at/widget/rollomax-chat-widget.js"
  data-token="IHR_WIDGET_TOKEN"
  data-mode="inline"
  data-container="#rollomax-chat-embed"
  async></script>
```

> **Hinweis:** Den Wert `IHR_WIDGET_TOKEN` durch den tatsaechlichen Token aus der `.env` Datei (`WIDGET_AUTH_TOKEN`) ersetzen.

---

## Update / Hotfix

```bash
# Lokal: Aenderungen machen und pushen
git add .
git commit -m "Fix: Beschreibung"
git push

# Auf dem VPS:
ssh user@dein-vps-ip
cd /opt/rollomax-chatbot
./scripts/deploy.sh
```

Das Deploy-Skript zieht automatisch die neuesten Aenderungen vom Repository, baut die Container bei Bedarf neu und startet die Dienste neu.

---

## Umgebungsvariablen

Alle Umgebungsvariablen werden in der `.env` Datei konfiguriert. Die `.env.example` dient als Vorlage.

| Variable | Beschreibung | Beispielwert |
|----------|-------------|--------------|
| `N8N_BASIC_AUTH_USER` | Benutzername fuer den N8N Login (Basic Auth) | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Passwort fuer den N8N Login (sicheres Passwort waehlen!) | `mein_sicheres_passwort_123` |
| `N8N_HOST` | Hostname, unter dem N8N erreichbar ist | `chat.rollomax.at` |
| `N8N_PROTOCOL` | Protokoll fuer N8N (immer `https` in Produktion) | `https` |
| `N8N_ENCRYPTION_KEY` | Schluessel zur Verschluesselung von Credentials in N8N (32 Zeichen, zufaellig generiert) | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| `WEBHOOK_URL` | Basis-URL fuer N8N Webhooks | `https://chat.rollomax.at` |
| `ANTHROPIC_API_KEY` | API Key fuer die Claude API (von Anthropic Console) | `sk-ant-api03-...` |
| `SUPABASE_URL` | URL des Supabase-Projekts | `https://abcdefgh.supabase.co` |
| `SUPABASE_ANON_KEY` | Oeffentlicher API Key von Supabase (fuer Row Level Security) | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_KEY` | Service Role Key von Supabase (voller Datenbankzugriff, geheim halten!) | `eyJhbGciOiJIUzI1NiIs...` |
| `ALLOWED_ORIGIN` | Erlaubte Domain fuer CORS (nur diese Domain darf Anfragen senden) | `https://rollomax.at` |
| `WIDGET_AUTH_TOKEN` | Authentifizierungs-Token fuer das Chat-Widget (zufaellig generiert) | `wt_a8f3b2e1d4c7...` |
| `RATE_LIMIT_PER_IP` | Maximale Anzahl Nachrichten pro IP-Adresse innerhalb des Zeitfensters | `20` |
| `RATE_LIMIT_WINDOW_MINUTES` | Zeitfenster fuer das Rate Limiting in Minuten | `10` |

> **Wichtig:** Die `.env` Datei enthaelt sensible Daten und ist in `.gitignore` eingetragen. Niemals ins Repository committen!

---

## Projektstruktur

```
rollomax-chatbot/
├── .gitignore
├── docker-compose.yml
├── .env.example
├── Caddyfile
├── scripts/
│   ├── deploy.sh
│   └── init-github.sh
├── widget/
│   └── rollomax-chat-widget.js
├── n8n-workflows/
│   └── rollomax-chatbot-workflow.json
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_auto_delete_cron.sql
│   └── seed/
│       └── knowledge_base.sql
├── docs/
│   ├── datenschutz-ergaenzung.md
│   └── test-scenarios.md
└── README.md
```

### Verzeichnisse im Ueberblick

| Verzeichnis | Inhalt |
|-------------|--------|
| `scripts/` | Deployment- und Setup-Skripte |
| `widget/` | Chat-Widget (Vanilla JS, Shadow DOM) |
| `n8n-workflows/` | Exportierter N8N Workflow als JSON |
| `supabase/migrations/` | SQL-Dateien fuer Tabellenstruktur, RLS-Policies und Cron-Jobs |
| `supabase/seed/` | Initiale Daten (Knowledge Base mit RolloMax Produktwissen) |
| `docs/` | Datenschutz-Ergaenzung und Test-Szenarien |

---

## Wartung

### Automatische Datenloeschung

Die Datenloeschung laeuft automatisch ueber pg_cron in Supabase:

- **Chat-Verlaeufe**: Werden nach 90 Tagen automatisch geloescht
- **Lead-Daten**: Werden nach 2 Jahren automatisch geloescht

Die Cron-Jobs werden durch die Migration `003_auto_delete_cron.sql` eingerichtet.

### Docker-Logs pruefen

```bash
# Alle Logs anzeigen (live):
docker compose logs -f

# Nur N8N Logs:
docker compose logs -f n8n

# Nur Caddy Logs:
docker compose logs -f caddy
```

### N8N und Caddy aktualisieren

```bash
# Neueste Docker-Images herunterladen und Container neu starten:
docker compose pull && docker compose up -d
```

### Haeufige Probleme

| Problem | Loesung |
|---------|---------|
| Widget laedt nicht | CORS pruefen: `ALLOWED_ORIGIN` in `.env` muss `https://rollomax.at` sein |
| SSL-Zertifikat fehlt | DNS pruefen: A-Record muss auf VPS IP zeigen, dann Caddy neu starten |
| Bot antwortet nicht | Claude API Key pruefen, N8N Workflow-Logs checken |
| Rate Limit greift zu frueh | `RATE_LIMIT_PER_IP` und `RATE_LIMIT_WINDOW_MINUTES` in `.env` anpassen |
| Supabase Verbindungsfehler | `SUPABASE_URL` und `SUPABASE_SERVICE_KEY` in N8N Credentials pruefen |

---

## Lizenz

Dieses Projekt ist proprietaer und gehoert RolloMax Wien. Keine oeffentliche Weitergabe ohne Genehmigung.
