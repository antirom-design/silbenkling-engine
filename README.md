# silbenkling

Eine lokale Intranet-KI für Gruppen, Organisationen und Teams.
Kein Chatbot. Ein gemeinsamer Wissenskörper.

## Konzept

Die KI lernt nicht durch Modelltraining – sie lernt durch strukturierte Wissenseinträge.
Alles Wissen entsteht durch Nutzung. Jede gute Antwort soll speicherbar sein.

## Drei Verben

- **PUT** – Wissen hinzufügen
- **GET** – Wissen abrufen
- **MONITOR** – Wissen beobachten

## Setup

### 1. Installieren

```bash
npm install
```

### 2. Konfigurieren

Kopiere `.env.example` zu `.env.local` und füge deinen API-Key hinzu:

```bash
cp .env.example .env.local
```

Wähle einen LLM-Provider (Anthropic oder OpenAI) und füge den entsprechenden API-Key ein.

### 3. Datenbank-Ordner erstellen

```bash
mkdir data
```

### 4. Starten

```bash
npm run dev
```

Die Anwendung läuft auf `http://localhost:3000`.

## Verwendung

### PUT - Wissen hinzufügen

Tab "PUT - Wissen hinzufügen":
- Wähle ein Topic (z.B. `/team/onboarding`)
- Wähle einen Typ (Dokument, Q&A, Fakt, etc.)
- Füge den Inhalt ein
- Klicke "Eintrag hinzufügen"

### GET - Wissen abrufen

Tab "GET - Fragen":
- Wähle ein Topic
- Stelle eine Frage
- Das System sucht in den Einträgen und formuliert eine Antwort
- Bei guten Antworten: "Als Q&A speichern" klicken

### API-Endpoints

#### POST /api/put

```json
{
  "topic": "/team/onboarding",
  "type": "doc",
  "content": "Neuer Mitarbeiter: siehe Wiki...",
  "actor": "user"
}
```

#### POST /api/get

```json
{
  "question": "Wie beantrage ich Urlaub?",
  "topic": "/team",
  "actor": "user"
}
```

#### POST /api/monitor

```json
{
  "topic": "/team",
  "actor": "user"
}
```

#### POST /api/qa

```json
{
  "question": "Wie beantrage ich Urlaub?",
  "answer": "Urlaub wird über das HR-Portal beantragt...",
  "topic": "/team",
  "actor": "user"
}
```

## Deployment

### Vercel

```bash
vercel
```

**Wichtig:** Vercel unterstützt SQLite nicht nativ im Production-Modus. Für Production:
- Entweder Vercel Postgres verwenden
- Oder externen Render Worker für SQLite nutzen

### Render

Siehe Render-Dokumentation für Worker-Setup.

## Architektur

```
src/
  types/          - TypeScript Interfaces
  db/             - SQLite Database
  engine/         - Core Logic (PUT, GET, MONITOR)
  app/
    api/          - Next.js API Routes
    page.tsx      - Web UI
```

## Datenmodell

### Entry

Ein Wissenseintrag mit:
- Topic (hierarchisch: `/team/onboarding`)
- Type (`doc`, `qa`, `fact`, `task`, `link`, `event`)
- Content (Text oder Referenz)
- Metadata (Tags, Kontext, Zeitstempel)
- Permissions (Read/Write)
- Version (nichts wird überschrieben)

### Event

Ein Zustandswechsel (append-only):
- `entry_added`, `entry_updated`
- `question_asked`, `question_answered`, `question_unanswered`
- `qa_confirmed`, `access_denied`

## Nicht im POC-Scope

- User-Auth (später)
- Multi-Tenant (später)
- Komplexe Permissions (später)
- Versionierungs-UI (später)

## Lizenz

Privat / Noch nicht festgelegt
