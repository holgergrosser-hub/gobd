import { useEffect, useState } from 'react'
import DocumentUpload from './components/DocumentUpload.jsx'
import DataForm from './components/DataForm.jsx'
import DataPreview from './components/DataPreview.jsx'
import GenerateDoc from './components/GenerateDoc.jsx'
import Settings from './components/Settings.jsx'
import KundenManager from './components/KundenManager.jsx'

const TABS = [
  { id: 'upload',   label: '1 · Dokumente hochladen', icon: '📄' },
  { id: 'form',     label: '2 · Daten prüfen & ergänzen', icon: '✏️' },
  { id: 'preview',  label: '3 · Vorschau', icon: '👁️' },
  { id: 'generate', label: '4 · Dokument erstellen', icon: '⬇️' },
  { id: 'settings', label: '⚙️ Einstellungen', icon: '' },
]

const EMPTY_DATA = {
  // A – Unternehmen
  firmenname: '', rechtsform: '', hrb: '', steuernummer: '', ust_id: '',
  finanzamt: '', anschrift: '', geschaeftsfuehrer: '', branche: '',
  mitarbeiter: '', geschaeftsjahr: '', unternehmensgegenstand: '',
  // B – Steuerberater
  stb_kanzlei: '', stb_name: '', stb_adresse: '', stb_zusammenarbeit: [],
  stb_umfang: '',
  // C – Software
  bsw_name: [], bsw_version: '', bsw_zertifikat: '', bsw_zertifikat_datum: '',
  bsw_ort: '', cloud_dienste: '',
  // D – Vorsysteme
  vorsysteme: [], schnittstellen: '',
  // E – Belegerfassung
  belegeingang: [], scan_ja: '', scan_zeitpunkt: '', scan_geraet: '',
  archiv_system: [], archiv_format: [], original_aufbewahrung: '',
  // F – Backup & Sicherheit
  backup_freq: '', backup_ort: [], backup_test: '',
  archiv_unveraenderlich: [], aufbewahrungsfristen: '',
  // G – IKS
  iks_benutzer: '', iks_rollen: '', iks_2fa: '',
  iks_zahlung_freigabe: '', iks_vier_augen: '',
  // H – Verantwortliche
  verantwortlich_buchhaltung: '', ersteller: '', freigebender: '',
  datum: new Date().toLocaleDateString('de-DE'),
}

export default function App() {
  const [tab, setTab] = useState('upload')
  const [data, setData] = useState({ ...EMPTY_DATA })
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('gasUrl') || '')
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '')
  const [templateDocUrl, setTemplateDocUrl] = useState(localStorage.getItem('templateDocUrl') || '')
  const [kundenId, setKundenId] = useState(localStorage.getItem('kundenId') || 'default')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!gasUrl || !kundenId) return
    loadFromSheet(kundenId, { alertOnError: false })
  }, [gasUrl, kundenId])

  function selectKunde(id) {
    if (!id || id === kundenId) return
    if (!saved) {
      const ok = window.confirm('Du hast ungespeicherte Änderungen. Wirklich den Kunden wechseln?')
      if (!ok) return
    }
    setKundenId(id)
    localStorage.setItem('kundenId', id)
    setSaved(false)
  }

  function updateData(patch) {
    setData(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  async function saveToSheet() {
    if (!gasUrl) return alert('Bitte zuerst die Google Apps Script URL in den Einstellungen eintragen.')
    const fd = new FormData()
    fd.append('action', 'save')
    fd.append('kundenId', kundenId)
    fd.append('data', JSON.stringify(data))
    try {
      const res = await fetch(gasUrl, { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.status === 'error') {
        throw new Error(json.message || res.statusText || 'Unbekannter Fehler')
      }
      setSaved(true)
      alert('✅ Daten erfolgreich ins Google Sheet gespeichert!')
    } catch (e) {
      alert('❌ Fehler beim Speichern: ' + e.message)
    }
  }

  async function loadFromSheet(id = kundenId, opts = { alertOnError: true }) {
    if (!gasUrl) return alert('Bitte zuerst die Google Apps Script URL eintragen.')
    const fd = new FormData()
    fd.append('action', 'load')
    fd.append('kundenId', id)
    try {
      const res = await fetch(gasUrl, { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.status === 'error') {
        throw new Error(json.message || res.statusText || 'Unbekannter Fehler')
      }
      const loaded = json.data || {}
      setData({ ...EMPTY_DATA, ...loaded })
      setSaved(true)
    } catch (e) {
      if (opts?.alertOnError !== false) alert('❌ Fehler beim Laden: ' + e.message)
      else console.warn('Load failed:', e)
    }
  }

  const filled = Object.values(data).filter(v =>
    Array.isArray(v) ? v.length > 0 : v && v.toString().trim()
  ).length
  const total = Object.keys(data).length
  const pct = Math.round(filled / total * 100)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Header */}
      <div style={{ background: '#1e40af', color: 'white', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>GoBD Verfahrensdokumentation</span>
            <span style={{ fontSize: 11, opacity: .7, background: 'rgba(255,255,255,.15)', padding: '2px 8px', borderRadius: 20 }}>System v1.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, opacity: .85 }}>
              Vollständigkeit: <strong>{pct}%</strong>
            </div>
            <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 3 }}>
              <div style={{ width: pct + '%', height: '100%', background: pct > 70 ? '#4ade80' : pct > 40 ? '#fbbf24' : '#f87171', borderRadius: 3, transition: 'width .3s' }} />
            </div>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.3)' }} onClick={loadFromSheet}>⬆️ Laden</button>
            <button className="btn btn-sm btn-success" onClick={saveToSheet}>💾 Speichern{saved ? ' ✓' : ''}</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '12px 18px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#1d4ed8' : '#6b7280',
              borderBottom: tab === t.id ? '2px solid #1d4ed8' : '2px solid transparent',
              background: 'none', transition: 'all .12s', whiteSpace: 'nowrap',
            }}>
              {t.icon && <span style={{ marginRight: 4 }}>{t.icon}</span>}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 24px' }}>
        {tab !== 'settings' && <KundenManager gasUrl={gasUrl} kundenId={kundenId} onSelect={selectKunde} />}
        {tab === 'upload'   && <DocumentUpload data={data} onUpdate={updateData} apiKey={apiKey} onNext={() => setTab('form')} />}
        {tab === 'form'     && <DataForm data={data} onUpdate={updateData} onNext={() => setTab('preview')} />}
        {tab === 'preview'  && <DataPreview data={data} onNext={() => setTab('generate')} />}
        {tab === 'generate' && <GenerateDoc data={data} gasUrl={gasUrl} kundenId={kundenId} templateDocUrl={templateDocUrl} />}
        {tab === 'settings' && (
          <Settings
            gasUrl={gasUrl}
            setGasUrl={v => { setGasUrl(v); localStorage.setItem('gasUrl', v) }}
            apiKey={apiKey}
            setApiKey={v => { setApiKey(v); localStorage.setItem('apiKey', v) }}
            templateDocUrl={templateDocUrl}
            setTemplateDocUrl={v => { setTemplateDocUrl(v); localStorage.setItem('templateDocUrl', v) }}
          />
        )}
      </div>
    </div>
  )
}
