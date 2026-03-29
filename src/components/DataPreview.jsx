const SECTIONS = [
  { title: 'A — Unternehmensdaten', icon: '🏢', fields: [
    ['Firmenname', 'firmenname'], ['Rechtsform', 'rechtsform'], ['HRB', 'hrb'],
    ['Steuernummer', 'steuernummer'], ['USt-IdNr.', 'ust_id'], ['Finanzamt', 'finanzamt'],
    ['Anschrift', 'anschrift'], ['Geschäftsführer', 'geschaeftsfuehrer'],
    ['Branche', 'branche'], ['Mitarbeiter', 'mitarbeiter'],
    ['Unternehmensgegenstand', 'unternehmensgegenstand'],
  ]},
  { title: 'B — Steuerberater', icon: '👔', fields: [
    ['Kanzlei', 'stb_kanzlei'], ['Name StB', 'stb_name'], ['Adresse', 'stb_adresse'],
    ['Zusammenarbeit', 'stb_zusammenarbeit'], ['Umfang', 'stb_umfang'],
  ]},
  { title: 'C — Buchführungssoftware', icon: '💾', fields: [
    ['Software', 'bsw_name'], ['Version', 'bsw_version'],
    ['GoBD-Zertifikat', 'bsw_zertifikat'], ['Zertifikat Datum', 'bsw_zertifikat_datum'],
    ['Installationsort', 'bsw_ort'], ['Cloud-Dienste', 'cloud_dienste'],
  ]},
  { title: 'D — Vorsysteme', icon: '🔗', fields: [
    ['Vorsysteme', 'vorsysteme'], ['Schnittstellen', 'schnittstellen'],
  ]},
  { title: 'E — Belegerfassung', icon: '📂', fields: [
    ['Eingangskanäle', 'belegeingang'], ['Ersetzendes Scannen', 'scan_ja'],
    ['Scan-Gerät', 'scan_geraet'], ['Archivsystem', 'archiv_system'],
    ['Archivformat', 'archiv_format'], ['Original nach Scan', 'original_aufbewahrung'],
  ]},
  { title: 'F — Datensicherung', icon: '🔒', fields: [
    ['Backup-Frequenz', 'backup_freq'], ['Backup-Ort', 'backup_ort'],
    ['Backup getestet', 'backup_test'], ['Unveränderlichkeit', 'archiv_unveraenderlich'],
    ['Aufbewahrungsfristen', 'aufbewahrungsfristen'],
  ]},
  { title: 'G — IKS', icon: '🛡️', fields: [
    ['Benutzerkonten', 'iks_benutzer'], ['Rollen', 'iks_rollen'],
    ['2FA', 'iks_2fa'], ['Vier-Augen', 'iks_vier_augen'],
    ['Zahlungsfreigabe', 'iks_zahlung_freigabe'],
  ]},
  { title: 'H — Verantwortliche', icon: '✍️', fields: [
    ['Verantwortlich Buchführung', 'verantwortlich_buchhaltung'],
    ['Erstellt durch', 'ersteller'], ['Freigabe', 'freigebender'], ['Datum', 'datum'],
  ]},
]

function val(v) {
  if (!v) return null
  if (Array.isArray(v)) return v.length ? v.join(', ') : null
  return v.toString().trim() || null
}

export default function DataPreview({ data, onNext }) {
  const filled = SECTIONS.flatMap(s => s.fields).filter(([, k]) => val(data[k])).length
  const total = SECTIONS.flatMap(s => s.fields).length
  const pct = Math.round(filled / total * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>👁️ Datenvorschau — {pct}% ausgefüllt</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{filled} von {total} Feldern befüllt</div>
        </div>
        <div style={{ display: 'flex', align: 'center', gap: 12 }}>
          <div style={{ width: 160, height: 8, background: '#e5e7eb', borderRadius: 4 }}>
            <div style={{ width: pct + '%', height: '100%', background: pct > 70 ? '#16a34a' : pct > 40 ? '#d97706' : '#dc2626', borderRadius: 4, transition: 'width .3s' }} />
          </div>
          <button className="btn btn-primary" onClick={onNext}>Dokument erstellen →</button>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
        {SECTIONS.map(sec => {
          const secFilled = sec.fields.filter(([, k]) => val(data[k])).length
          return (
            <div key={sec.title} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>{sec.icon}</span> {sec.title}
                </div>
                <span className={`badge ${secFilled === sec.fields.length ? 'badge-green' : secFilled > 0 ? 'badge-amber' : 'badge-gray'}`}>
                  {secFilled}/{sec.fields.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sec.fields.map(([label, key]) => {
                  const v = val(data[key])
                  return (
                    <div key={key} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ minWidth: 160, color: '#6b7280', fontSize: 12 }}>{label}</span>
                      <span style={{ color: v ? '#1a202c' : '#d1d5db', fontStyle: v ? 'normal' : 'italic', flex: 1 }}>
                        {v || '— fehlt noch'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
