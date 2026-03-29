# GoBD Verfahrensdokumentation System

Vollständiges System zur automatisierten Erstellung von GoBD-konformen Verfahrensdokumentationen.

## Architektur

```
Frontend (Netlify)          Backend (Google Apps Script)
─────────────────           ────────────────────────────
React + Vite          ──→   Google Sheet (Datenspeicher)
KI-Dokumentenauslese        Google Docs (Dokumentgenerierung)
Anthropic API               
Word-Generierung (lokal)    
```

## Schnellstart

### 1. Google Sheet + Apps Script einrichten

1. Neues Google Sheet erstellen
2. URL kopieren: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
3. **SHEET_ID** aus der URL notieren
4. Im Sheet: **Erweiterungen → Apps Script**
5. Inhalt von `gas/Code.gs` einfügen
6. `SHEET_ID` in Zeile 8 eintragen
7. **Bereitstellen → Neue Bereitstellung:**
   - Typ: Web-App
   - Ausführen als: Ich
   - Zugriff: Jeder
8. URL der Bereitstellung kopieren

### 2. Netlify Deployment

```bash
# Lokale Entwicklung
npm install
npm run dev

# Build testen
npm run build
```

**Netlify Einstellungen:**
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_ANTHROPIC_KEY` = dein Anthropic API Key

### 3. GitHub Repository

```bash
git init
git add .
git commit -m "GoBD System v1.0"
git remote add origin https://github.com/USERNAME/gobd-system.git
git push -u origin main
```

Dann in Netlify: New site from Git → GitHub Repository auswählen.

## Hochladbare Dokumente (KI-Auslese)

| Dokument | Extrahierte Felder |
|---|---|
| Steuerbescheid | Steuernummer, Finanzamt, Firmenname, Adresse |
| Letzte B-Meldung (USt-VA) | USt-IdNr., Finanzamt, Zeitraum |
| Handelsregisterauszug | Firmenname, Rechtsform, HRB, GF, Gegenstand |
| Steuerberater Anschrift / Vollmacht | Kanzlei, Name, Adresse |
| GoBD-Softwarebescheinigung | Software, Version, Zertifikat-Nr., Datum |
| Datenschutzerklärung / AV-Vertrag | Cloud-Dienste, Auftragsverarbeiter |
| BWA / Jahresabschluss | Software (Footer), Geschäftsjahr |
| IT-Dienstleister-Vertrag | Backup-Dienste, Serverstandort |

**Weitere empfohlene Dokumente:**
- Gesellschaftsvertrag / Satzung
- Mietvertrag Büro
- Scanner-Handbuch / Gerätedatenblatt
- Cloud-Verträge (Azure, AWS, Google Workspace)
- Interne IT-Richtlinien / Datenschutzrichtlinie
- Backup-Software Lizenz

## System-Features

- ✅ **KI-Dokumentenauslese** — PDF/Bild hochladen, KI füllt Formular
- ✅ **Chip-basierte Eingabe** — Klicken statt Tippen
- ✅ **Google Sheet Backend** — Daten dauerhaft speichern & laden
- ✅ **Word-Dokument** — Sofort downloadbar (lokal via docx.js)
- ✅ **Google Docs** — Alternativ über Apps Script erstellen
- ✅ **Vollständigkeits-Anzeige** — Wie weit ist das Formular ausgefüllt?
- ✅ **Versionierung** — Änderungshistorie im Sheet
- ✅ **GoBD-konform** — Alle Pflichtfelder nach Tz. 151–155

## Rechtsgrundlagen

- BMF-Schreiben vom 11.03.2024 (GoBD, Az. IV D 2 – S 0316/21/10001:002)
- § 146, § 147 AO (Ordnungsvorschriften, Aufbewahrungspflichten)
- § 238 ff. HGB (Buchführungspflicht)
- § 158 AO (Beweiskraft der Buchführung)
