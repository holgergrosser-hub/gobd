export default function Settings({ gasUrl, setGasUrl, apiKey, setApiKey, templateDocUrl, setTemplateDocUrl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>⚙️ Systemeinstellungen</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Google Apps Script URL</label>
            <input type="url" value={gasUrl} onChange={e => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/xxx/exec" />
            <span className="hint">Backend-URL für Google Sheet Speicherung. Siehe Setup-Anleitung unten.</span>
          </div>

          <div className="field">
            <label>Anthropic API-Key (für KI-Dokumentenauslese)</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..." />
            <span className="hint">Wird lokal im Browser gespeichert, nicht übertragen.</span>
          </div>

          <div className="field">
            <label>Musterdokument (Google Docs) – optional</label>
            <input type="url" value={templateDocUrl} onChange={e => setTemplateDocUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/XXXX/edit" />
            <span className="hint">Wenn gesetzt, wird beim Erstellen eine Kopie dieses Docs erzeugt (z.B. mit Briefkopf/Format). Leer lassen = Standard-Dokument.</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#1d4ed8' }}>📋 Setup-Anleitung Google Apps Script</div>
        <ol style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Google Sheet erstellen → Blatt umbenennen in "GoBD_Daten"</li>
          <li>In Google Sheet: Erweiterungen → Apps Script</li>
          <li>Code aus <code style={{ background: '#dbeafe', padding: '1px 4px', borderRadius: 3 }}>gas/Code.gs</code> einfügen</li>
          <li>Sheet-ID in Code.gs eintragen (aus URL des Sheets)</li>
          <li>Bereitstellen → Neue Bereitstellung → Web-App → Jeder</li>
          <li>URL kopieren und hier oben eintragen</li>
        </ol>
      </div>

      <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#15803d' }}>🚀 Netlify Deployment</div>
        <ol style={{ fontSize: 13, color: '#166534', lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Repository auf GitHub pushen</li>
          <li>Netlify → New site from Git → Repository auswählen</li>
          <li>Build command: <code style={{ background: '#dcfce7', padding: '1px 4px', borderRadius: 3 }}>npm install && npm run build</code></li>
          <li>Publish directory: <code style={{ background: '#dcfce7', padding: '1px 4px', borderRadius: 3 }}>dist</code></li>
          <li>Environment variable: <code style={{ background: '#dcfce7', padding: '1px 4px', borderRadius: 3 }}>VITE_ANTHROPIC_KEY</code> = dein API Key</li>
        </ol>
      </div>
    </div>
  )
}
