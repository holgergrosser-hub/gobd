import { useState } from 'react'

const DOC_TYPES = [
  {
    id: 'steuerbescheid',
    label: 'Steuerbescheid',
    icon: '🏛️',
    desc: 'Einkommensteuer, KSt, GewSt',
    fields: ['steuernummer', 'finanzamt', 'geschaeftsfuehrer', 'firmenname', 'anschrift'],
    prompt: `Du bist ein Experte für deutsche Steuerdokumente. Extrahiere aus diesem Steuerbescheid folgende Felder als JSON:
{
  "steuernummer": "Steuernummer des Unternehmens",
  "finanzamt": "Name des zuständigen Finanzamts",
  "firmenname": "Name des Unternehmens / Steuerpflichtigen",
  "anschrift": "Adresse des Unternehmens",
  "geschaeftsfuehrer": "Name des Geschäftsführers / Inhabers falls erkennbar",
  "rechtsform": "Rechtsform falls erkennbar (GmbH, e.K. etc.)",
  "veranlagungsjahr": "Veranlagungsjahr"
}
Antworte NUR mit dem JSON-Objekt, ohne Erklärungen. Felder die nicht erkennbar sind mit leerem String "".`
  },
  {
    id: 'bst_meldung',
    label: 'Letzte B-Meldung (USt-VA)',
    icon: '📊',
    desc: 'USt-Voranmeldung, USt-IdNr',
    fields: ['ust_id', 'finanzamt', 'steuernummer'],
    prompt: `Extrahiere aus dieser USt-Voranmeldung (B-Meldung) folgende Felder als JSON:
{
  "ust_id": "USt-Identifikationsnummer (z.B. DE123456789)",
  "steuernummer": "Steuernummer",
  "finanzamt": "Finanzamt",
  "firmenname": "Unternehmensname",
  "voranmeldezeitraum": "Zeitraum der Voranmeldung",
  "anschrift": "Adresse falls vorhanden"
}
Antworte NUR mit dem JSON-Objekt. Nicht erkannte Felder als leerer String "".`
  },
  {
    id: 'handelsregister',
    label: 'Handelsregisterauszug',
    icon: '📜',
    desc: 'HRB, Rechtsform, GF, Gegenstand',
    fields: ['firmenname', 'rechtsform', 'hrb', 'geschaeftsfuehrer', 'anschrift', 'unternehmensgegenstand'],
    prompt: `Extrahiere aus diesem Handelsregisterauszug folgende Felder als JSON:
{
  "firmenname": "Vollständiger Firmenname",
  "rechtsform": "Rechtsform (GmbH, UG, e.K., AG etc.)",
  "hrb": "Handelsregisternummer (z.B. HRB 12345)",
  "anschrift": "Sitz / Adresse des Unternehmens",
  "geschaeftsfuehrer": "Name(n) des Geschäftsführers / Inhabers / Vorstands",
  "unternehmensgegenstand": "Gegenstand des Unternehmens / Geschäftstätigkeit",
  "gruendungsdatum": "Gründungsdatum falls erkennbar",
  "stammkapital": "Stammkapital falls vorhanden"
}
Antworte NUR mit dem JSON-Objekt. Nicht erkannte Felder als leerer String "".`
  },
  {
    id: 'steuerberater',
    label: 'Steuerberater Anschrift / Vollmacht',
    icon: '👔',
    desc: 'Kanzlei, Name, Kontakt',
    fields: ['stb_kanzlei', 'stb_name', 'stb_adresse'],
    prompt: `Extrahiere aus diesem Dokument (Steuerberater-Briefkopf, Vollmacht oder Anschreiben) folgende Felder als JSON:
{
  "stb_kanzlei": "Name der Steuerberaterkanzlei",
  "stb_name": "Name des Steuerberaters",
  "stb_adresse": "Adresse der Kanzlei (Straße, PLZ, Ort)",
  "stb_telefon": "Telefonnummer",
  "stb_email": "E-Mail-Adresse",
  "stb_steuernummer": "Steuernummer der Kanzlei falls vorhanden"
}
Antworte NUR mit dem JSON-Objekt. Nicht erkannte Felder als leerer String "".`
  },
  {
    id: 'gobd_zertifikat',
    label: 'GoBD-Softwarebescheinigung',
    icon: '✅',
    desc: 'Software, Version, Zertifikat',
    fields: ['bsw_name', 'bsw_version', 'bsw_zertifikat', 'bsw_zertifikat_datum'],
    prompt: `Extrahiere aus dieser GoBD-Softwarebescheinigung / Software-Zertifikat folgende Felder als JSON:
{
  "bsw_software_name": "Name der Software",
  "bsw_hersteller": "Name des Herstellers",
  "bsw_version": "Versionsnummer der Software",
  "bsw_zertifikat_nr": "Zertifikatsnummer / Bescheinigungsnummer",
  "bsw_zertifikat_datum": "Datum der Ausstellung",
  "bsw_gueltig_bis": "Gültig bis / Ablaufdatum falls vorhanden",
  "bsw_zertifiziert_von": "Ausstellende Organisation (z.B. DATEV, TÜV)"
}
Antworte NUR mit dem JSON-Objekt. Nicht erkannte Felder als leerer String "".`
  },
  {
    id: 'datenschutz',
    label: 'Datenschutzerklärung / AV-Vertrag',
    icon: '🔒',
    desc: 'Cloud-Dienste, Auftragsverarbeiter',
    fields: ['cloud_dienste'],
    prompt: `Extrahiere aus dieser Datenschutzerklärung oder diesem Auftragsverarbeitungsvertrag folgende Felder als JSON:
{
  "cloud_dienste": "Alle genannten Cloud-Dienste und Software-Anbieter (kommagetrennt)",
  "auftragsverarbeiter": "Liste der Auftragsverarbeiter",
  "drittlaender": "Datenübermittlungen in Drittländer falls genannt",
  "datenschutzbeauftragter": "Name des Datenschutzbeauftragten falls genannt"
}
Antworte NUR mit dem JSON-Objekt. Nicht erkannte Felder als leerer String "".`
  },
  {
    id: 'bwa',
    label: 'BWA / Jahresabschluss',
    icon: '📈',
    desc: 'Software-Footer, Geschäftsjahr',
    fields: ['bsw_name', 'bsw_version'],
    prompt: `Extrahiere aus dieser BWA oder diesem Jahresabschluss folgende Felder als JSON:
{
  "bsw_software_name": "Name der Buchhaltungssoftware (oft im Footer oder Kopf)",
  "bsw_version": "Softwareversion falls erkennbar",
  "firmenname": "Unternehmensname",
  "geschaeftsjahr": "Geschäftsjahr / Berichtszeitraum",
  "steuerberater": "Name des erstellenden Steuerberaters falls erkennbar"
}
Antworte NUR mit dem JSON-Objekt. Nicht erkannte Felder als leerer String "".`
  },
  {
    id: 'it_vertrag',
    label: 'IT-Dienstleister-Vertrag',
    icon: '💻',
    desc: 'Backup, Server, IT-Infrastruktur',
    fields: ['backup_ort', 'cloud_dienste'],
    prompt: `Extrahiere aus diesem IT-Dienstleistungsvertrag oder Hosting-Vertrag folgende Felder als JSON:
{
  "it_dienstleister": "Name des IT-Dienstleisters",
  "leistungsumfang": "Beschreibung der IT-Leistungen",
  "backup_dienst": "Backup-/Archivierungsdienste die genannt werden",
  "serverstandort": "Standort der Server / Rechenzentrum",
  "cloud_dienste": "Genannte Cloud-Dienste",
  "datenschutz_vereinbarung": "Datenschutzvereinbarung / AV-Vertrag vorhanden Ja/Nein"
}
Antworte NUR mit dem JSON-Objekt. Nicht erkannte Felder als leerer String "".`
  },
]

const FIELD_MAP = {
  steuernummer: 'steuernummer', finanzamt: 'finanzamt',
  firmenname: 'firmenname', anschrift: 'anschrift',
  geschaeftsfuehrer: 'geschaeftsfuehrer', rechtsform: 'rechtsform',
  ust_id: 'ust_id', hrb: 'hrb',
  unternehmensgegenstand: 'unternehmensgegenstand',
  stb_kanzlei: 'stb_kanzlei', stb_name: 'stb_name', stb_adresse: 'stb_adresse',
  bsw_version: 'bsw_version', bsw_zertifikat_datum: 'bsw_zertifikat_datum',
  cloud_dienste: 'cloud_dienste',
  bsw_software_name: 'bsw_name',
  bsw_zertifikat_nr: 'bsw_zertifikat',
}

export default function DocumentUpload({ data, onUpdate, apiKey, onNext }) {
  const [uploads, setUploads] = useState({})
  const [extracting, setExtracting] = useState({})
  const [results, setResults] = useState({})
  const [dragOver, setDragOver] = useState(null)

  async function handleFile(docType, file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = e.target.result.split(',')[1]
      const mime = file.type || 'image/jpeg'
      setUploads(u => ({ ...u, [docType.id]: { name: file.name, size: file.size } }))
      await extractData(docType, b64, mime)
    }
    reader.readAsDataURL(file)
  }

  async function extractData(docType, b64, mime) {
    const key = apiKey || import.meta.env.VITE_ANTHROPIC_KEY
    if (!key) {
      alert('Bitte Anthropic API-Key in den Einstellungen eintragen.')
      return
    }
    setExtracting(x => ({ ...x, [docType.id]: true }))
    try {
      const isImage = mime.startsWith('image/')
      const content = isImage
        ? [
            { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } },
            { type: 'text', text: docType.prompt }
          ]
        : [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
            { type: 'text', text: docType.prompt }
          ]

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content }]
        })
      })
      const json = await res.json()
      const text = json.content?.find(b => b.type === 'text')?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      const extracted = JSON.parse(clean)

      setResults(r => ({ ...r, [docType.id]: extracted }))

      // Map to data fields
      const patch = {}
      Object.entries(extracted).forEach(([k, v]) => {
        if (!v) return
        const mapped = FIELD_MAP[k]
        if (mapped) {
          if (Array.isArray(data[mapped])) {
            if (!data[mapped].includes(v)) patch[mapped] = [...(data[mapped] || []), v]
          } else {
            if (!data[mapped]) patch[mapped] = v
          }
        }
      })
      if (Object.keys(patch).length) onUpdate(patch)

    } catch (err) {
      setResults(r => ({ ...r, [docType.id]: { error: err.message } }))
    } finally {
      setExtracting(x => ({ ...x, [docType.id]: false }))
    }
  }

  const uploadCount = Object.keys(uploads).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>📄 Dokumente hochladen — KI liest automatisch aus</div>
            <div style={{ fontSize: 13, opacity: .85 }}>Laden Sie die verfügbaren Dokumente hoch. Die KI extrahiert alle relevanten Felder automatisch.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{uploadCount}</div>
            <div style={{ fontSize: 12, opacity: .8 }}>Dokument{uploadCount !== 1 ? 'e' : ''} hochgeladen</div>
          </div>
        </div>
        {uploadCount > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,.2)', borderRadius: 2 }}>
              <div style={{ width: Math.round(uploadCount / DOC_TYPES.length * 100) + '%', height: '100%', background: '#4ade80', borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Document Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {DOC_TYPES.map(dt => {
          const uploaded = uploads[dt.id]
          const loading = extracting[dt.id]
          const result = results[dt.id]
          const isDrag = dragOver === dt.id

          return (
            <div key={dt.id} className="card" style={{
              border: uploaded ? '2px solid #16a34a' : isDrag ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
              background: uploaded ? '#f0fdf4' : isDrag ? '#eff6ff' : 'white',
              transition: 'all .15s', position: 'relative'
            }}
              onDragOver={e => { e.preventDefault(); setDragOver(dt.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); handleFile(dt, e.dataTransfer.files[0]) }}
            >
              {/* Status Badge */}
              {uploaded && (
                <span className="badge badge-green" style={{ position: 'absolute', top: 10, right: 10 }}>✓ Hochgeladen</span>
              )}
              {loading && (
                <span className="badge badge-blue" style={{ position: 'absolute', top: 10, right: 10 }}>⏳ KI liest aus...</span>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{dt.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{dt.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{dt.desc}</div>
                </div>
              </div>

              {/* Extracted fields preview */}
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {dt.fields.map(f => (
                  <span key={f} style={{ padding: '1px 6px', background: data[f] ? '#dcfce7' : '#f3f4f6', borderRadius: 10, color: data[f] ? '#15803d' : '#9ca3af' }}>
                    {data[f] ? '✓' : '○'} {f}
                  </span>
                ))}
              </div>

              {/* Upload zone */}
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" style={{ display: 'none' }}
                  onChange={e => handleFile(dt, e.target.files[0])} />
                <div style={{
                  border: '1px dashed #d1d5db', borderRadius: 6, padding: '10px',
                  textAlign: 'center', fontSize: 12, color: '#6b7280',
                  background: uploaded ? '#dcfce7' : '#fafafa',
                }}>
                  {uploaded
                    ? <span>📎 {uploaded.name} <span style={{ color: '#9ca3af' }}>({Math.round(uploaded.size / 1024)} KB)</span></span>
                    : <span>PDF, PNG, JPG hierher ziehen oder <span style={{ color: '#2563eb' }}>klicken</span></span>
                  }
                </div>
              </label>

              {/* Extracted results */}
              {result && !result.error && (
                <div style={{ marginTop: 10, padding: 8, background: '#f0fdf4', borderRadius: 6, fontSize: 11, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 600, color: '#15803d', marginBottom: 4 }}>✅ KI hat extrahiert:</div>
                  {Object.entries(result).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                      <span style={{ color: '#6b7280', minWidth: 120 }}>{k}:</span>
                      <span style={{ color: '#1a202c', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {result?.error && (
                <div style={{ marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 6, fontSize: 11, color: '#dc2626' }}>
                  ❌ Fehler: {result.error}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Additional documents hint */}
      <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#92400e' }}>💡 Weitere hochladbare Dokumente</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6, fontSize: 12, color: '#78350f' }}>
          {[
            ['📋', 'Gesellschaftsvertrag / Satzung', 'GF-Namen, Stammkapital, Gegenstand'],
            ['🏢', 'Mietvertrag Büro', 'Unternehmensstandort, Adresse'],
            ['👥', 'Organigramm / Stellenbeschreibungen', 'Mitarbeiterstruktur, Zuständigkeiten'],
            ['🖨️', 'Scanner-Handbuch / Geräte-Datenblatt', 'Gerätebezeichnung, Modell für Scanprozess'],
            ['☁️', 'Cloud-Verträge (Azure, AWS, Google)', 'Serverstandorte, AV-Verträge'],
            ['🔐', 'Datenschutzrichtlinie intern', 'IKS-Maßnahmen, Zugriffskonzept'],
            ['📦', 'Backup-Software Lizenz / Handbuch', 'Backup-System, Konfiguration'],
            ['📧', 'E-Mail-Archivierungslösung', 'E-Mail als Beleg, Archivierung'],
          ].map(([icon, title, hint]) => (
            <div key={title} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span>{icon}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{title}</div>
                <div style={{ opacity: .7 }}>{hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onNext} style={{ padding: '10px 24px', fontSize: 14 }}>
          Weiter zu Daten prüfen →
        </button>
      </div>
    </div>
  )
}
