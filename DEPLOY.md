# Deployment auf Render

## Voraussetzungen

- Render Account (https://render.com)
- GitHub Repository mit diesem Code
- Anthropic API Key (oder OpenAI API Key)

## Deployment-Schritte

### 1. GitHub Repository erstellen

```bash
git init
git add .
git commit -m "Initial commit: silbenkling engine"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Render Service erstellen

1. Gehe zu https://dashboard.render.com
2. Klicke auf "New +" → "Web Service"
3. Verbinde dein GitHub Repository
4. Render erkennt automatisch `render.yaml`

### 3. Environment Variables setzen

In den Render Service Settings:

```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=<dein-api-key>
DB_PATH=/data/silbenkling.db
```

### 4. Deploy

Render deployed automatisch bei jedem Push nach `main`.

## Wichtige Hinweise

### Persistent Disk

Die `render.yaml` definiert einen Persistent Disk:
- Name: `silbenkling-data`
- Mount Path: `/data`
- Size: 1GB

Hier wird die SQLite-Datenbank gespeichert. Die Daten bleiben bei Redeploys erhalten.

### SQLite auf Render

Render unterstützt SQLite mit Persistent Disks perfekt. Die Datenbank liegt in `/data/silbenkling.db`.

### API Keys

**WICHTIG:** Setze `ANTHROPIC_API_KEY` als Environment Variable in Render, nicht in `.env` oder im Code!

### Build-Prozess

1. `npm install` - Dependencies installieren (inkl. better-sqlite3)
2. `postinstall` - Datenbank-Ordner erstellen
3. `npm run build` - Next.js Build
4. `npm start` - Production Server starten

### Kosten

- Starter Plan: $7/Monat
- Persistent Disk (1GB): Included
- Kostenlos während Trial-Period

## Testen nach Deploy

1. Öffne die Render-URL (z.B. `https://silbenkling-engine.onrender.com`)
2. Füge einen Eintrag hinzu (PUT-Tab)
3. Stelle eine Frage (GET-Tab)
4. Speichere die Antwort als Q&A

## Troubleshooting

### Build schlägt fehl

- Prüfe Build Logs in Render Dashboard
- Stelle sicher, dass `better-sqlite3` korrekt kompiliert wird

### Datenbank-Fehler

- Prüfe, ob Persistent Disk gemountet ist: `/data`
- Prüfe Environment Variable: `DB_PATH=/data/silbenkling.db`

### LLM-Fehler

- Prüfe API Key in Environment Variables
- Prüfe API-Quota bei Anthropic/OpenAI

## Alternative: Lokales Testing

Falls du lokal testen willst (mit Node.js installiert):

```bash
npm install
cp .env.example .env.local
# API-Key in .env.local eintragen
npm run dev
```
