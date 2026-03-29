import { useState } from 'react'

function Chips({ options, value, onChange, multi = false }) {
  function toggle(opt) {
    if (multi) {
      const arr = Array.isArray(value) ? value : []
      onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt])
    } else {
      onChange(value === opt ? '' : opt)
    }
  }
  const active = multi ? (Array.isArray(value) ? value : []) : value
  return (
    <div className="chip-group">
      {options.map(o => (
        <span key={o} className={`chip ${multi ? (active.includes(o) ? 'active-multi' : '') : (active === o ? 'active-single' : '')}`}
          onClick={() => toggle(o)}>{o}</span>
      ))}
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req"> *</span>}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: open ? 16 : 0 }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        </div>
        <span style={{ color: '#9ca3af', fontSize: 18 }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>}
    </div>
  )
}

export default function DataForm({ data, onUpdate, onNext }) {
  const u = (field) => (val) => onUpdate({ [field]: val })
  const inp = (field) => ({ value: data[field] || '', onChange: e => u(field)(e.target.value) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>✏️ Daten prüfen und ergänzen</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Von der KI vorausgefüllte Felder bitte prüfen. Fehlende Angaben manuell ergänzen.</div>
        </div>
        <button className="btn btn-primary" onClick={onNext}>Weiter →</button>
      </div>

      {/* A – Unternehmen */}
      <Section title="A — Unternehmensdaten" icon="🏢">
        <div className="grid-2">
          <Field label="Firmenname" required>
            <input type="text" {...inp('firmenname')} placeholder="Mustermann GmbH" />
          </Field>
          <Field label="Rechtsform" required>
            <Chips options={['GmbH','UG','GmbH & Co. KG','AG','e.K.','GbR','Einzelunternehmen']} value={data.rechtsform} onChange={u('rechtsform')} />
          </Field>
        </div>
        <div className="grid-3">
          <Field label="Handelsregisternummer">
            <input type="text" {...inp('hrb')} placeholder="HRB 12345 AG Nürnberg" />
          </Field>
          <Field label="Steuernummer" required>
            <input type="text" {...inp('steuernummer')} placeholder="123/456/78901" />
          </Field>
          <Field label="USt-IdNr.">
            <input type="text" {...inp('ust_id')} placeholder="DE123456789" />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Finanzamt" required>
            <input type="text" {...inp('finanzamt')} placeholder="Finanzamt Nürnberg-Nord" />
          </Field>
          <Field label="Geschäftsführer / Inhaber" required>
            <input type="text" {...inp('geschaeftsfuehrer')} placeholder="Max Mustermann" />
          </Field>
        </div>
        <Field label="Anschrift (Straße, PLZ, Ort)" required>
          <input type="text" {...inp('anschrift')} placeholder="Musterstraße 1, 90402 Nürnberg" />
        </Field>
        <div className="grid-2">
          <Field label="Branche" required>
            <select value={data.branche || ''} onChange={e => u('branche')(e.target.value)}>
              <option value="">— bitte wählen —</option>
              {['Beratung / Dienstleistung','Handel (Einzel/Groß)','Produktion / Fertigung','Handwerk','Gastronomie / Hotel','IT / Software','Gesundheitswesen','Freie Berufe','Immobilien','Bildung / Weiterbildung','Sonstiges'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Anzahl Mitarbeiter">
            <Chips options={['1–9','10–49','50–249','250+']} value={data.mitarbeiter} onChange={u('mitarbeiter')} />
          </Field>
        </div>
        <Field label="Unternehmensgegenstand" hint="Aus Handelsregister oder Gesellschaftsvertrag">
          <textarea {...inp('unternehmensgegenstand')} placeholder="Beratung und Vermittlung im Bereich ISO-Zertifizierungen..." />
        </Field>
      </Section>

      {/* B – Steuerberater */}
      <Section title="B — Steuerberater" icon="👔">
        <div className="grid-2">
          <Field label="Kanzleiname">
            <input type="text" {...inp('stb_kanzlei')} placeholder="StB Müller & Partner" />
          </Field>
          <Field label="Name des Steuerberaters">
            <input type="text" {...inp('stb_name')} placeholder="Dipl.-Kfm. Franz Müller" />
          </Field>
        </div>
        <Field label="Adresse der Kanzlei">
          <input type="text" {...inp('stb_adresse')} placeholder="Steuerstraße 5, 90402 Nürnberg" />
        </Field>
        <Field label="Art der Zusammenarbeit">
          <Chips multi options={['DATEV Unternehmen Online','E-Mail PDF','Persönliche Übergabe','VPN-Zugang','Steuerfix Portal']} value={data.stb_zusammenarbeit} onChange={u('stb_zusammenarbeit')} />
        </Field>
        <Field label="Umfang der Buchführung durch StB" hint="Was übernimmt der Steuerberater?">
          <Chips options={['Vollständige FiBu','Nur Jahresabschluss','Lohnbuchhaltung','USt-Voranmeldungen','Nur Beratung']} value={data.stb_umfang} onChange={u('stb_umfang')} />
        </Field>
      </Section>

      {/* C – Buchführungssoftware */}
      <Section title="C — Buchführungssoftware (Hauptsystem)" icon="💾">
        <Field label="Eingesetzte Software" required>
          <Chips multi options={['DATEV','Lexware','SAP','SAGE','sevDesk','Haufe','Buchhaltungsbutler','FastBill','Xero','QuickBooks','Sonstiges']} value={data.bsw_name} onChange={u('bsw_name')} />
        </Field>
        <div className="grid-2">
          <Field label="Version / Release" hint="z.B. DATEV Rechnungswesen 13.0 (2024)">
            <input type="text" {...inp('bsw_version')} placeholder="Version / Jahr" />
          </Field>
          <Field label="GoBD-Zertifikat / Bescheinigung vorhanden?">
            <Chips options={['Ja','Nein','In Bearbeitung']} value={data.bsw_zertifikat} onChange={u('bsw_zertifikat')} />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Datum der GoBD-Bescheinigung">
            <input type="text" {...inp('bsw_zertifikat_datum')} placeholder="TT.MM.JJJJ" />
          </Field>
          <Field label="Installationsort">
            <Chips options={['Lokal (eigener PC)','Eigener Server','Cloud (Hersteller-RZ)','Cloud (eigene)','DATEV-Rechenzentrum']} value={data.bsw_ort} onChange={u('bsw_ort')} />
          </Field>
        </div>
        <Field label="Eingesetzte Cloud-Dienste" hint="Alle cloud-basierten Systeme die steuerrelevante Daten verarbeiten">
          <input type="text" {...inp('cloud_dienste')} placeholder="Microsoft 365, Dropbox, Google Drive..." />
        </Field>
      </Section>

      {/* D – Vorsysteme */}
      <Section title="D — Vorsysteme und Schnittstellen" icon="🔗">
        <Field label="Vorhandene Vorsysteme">
          <Chips multi options={['Kassensystem','Warenwirtschaft','Webshop','CRM','Zeiterfassung','Lohnbuchhaltung','Anlagenbuchhaltung','Reisekostenabrechnung','Keine']}
            value={data.vorsysteme} onChange={u('vorsysteme')} />
        </Field>
        <Field label="Schnittstellen (kurz beschreiben)" hint="Wie fließen Daten zwischen den Systemen?">
          <textarea {...inp('schnittstellen')} placeholder="z.B. Kassensystem → DATEV über CSV-Export täglich&#10;Webshop → FiBu über API-Schnittstelle" />
        </Field>
      </Section>

      {/* E – Belegerfassung */}
      <Section title="E — Belegerfassung und Archivierung" icon="📂">
        <Field label="Eingangskanäle für Belege" required>
          <Chips multi options={['Post (Papier)','E-Mail (PDF)','E-Rechnung (XRechnung)','ZUGFeRD','EDI','Portal / Download','Eigenbelege']}
            value={data.belegeingang} onChange={u('belegeingang')} />
        </Field>
        <div className="grid-2">
          <Field label="Ersetzendes Scannen (Papier → digital)?" required>
            <Chips options={['Ja — sofort nach Eingang','Ja — gesammelt','Nein — Papier bleibt']} value={data.scan_ja} onChange={u('scan_ja')} />
          </Field>
          <Field label="Zeitpunkt des Scannens">
            <input type="text" {...inp('scan_zeitpunkt')} placeholder="z.B. innerhalb 24h nach Eingang" />
          </Field>
        </div>
        <Field label="Scan-Gerät / Software">
          <input type="text" {...inp('scan_geraet')} placeholder="z.B. Canon DR-C230, Adobe Scan App" />
        </Field>
        <Field label="Archivsystem" required>
          <Chips multi options={['In Buchführungssoftware integriert','DMS (z.B. DocuWare)','Dateiablage Netzwerk','OneDrive / SharePoint','Google Drive','DATEV DMS','Eigener Server']}
            value={data.archiv_system} onChange={u('archiv_system')} />
        </Field>
        <div className="grid-2">
          <Field label="Archivierungsformat">
            <Chips multi options={['PDF/A','PDF','TIFF','Original-Format','XML / XRechnung']}
              value={data.archiv_format} onChange={u('archiv_format')} />
          </Field>
          <Field label="Papieroriginal nach dem Scannen">
            <Chips options={['Wird vernichtet','Bleibt X Monate','Bleibt dauerhaft']} value={data.original_aufbewahrung} onChange={u('original_aufbewahrung')} />
          </Field>
        </div>
      </Section>

      {/* F – Backup */}
      <Section title="F — Datensicherung und Aufbewahrung" icon="🔒">
        <div className="grid-2">
          <Field label="Backup-Frequenz" required>
            <Chips options={['Täglich automatisch','Täglich manuell','Wöchentlich','Monatlich','Kein geregeltes Backup']} value={data.backup_freq} onChange={u('backup_freq')} />
          </Field>
          <Field label="Backup-Speicherort">
            <Chips multi options={['Lokaler Server','Externes Laufwerk','Cloud (Azure/AWS)','DATEV-RZ','Steuerberater']}
              value={data.backup_ort} onChange={u('backup_ort')} />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Backup-Wiederherstellung getestet?">
            <Chips options={['Ja — regelmäßig','Ja — einmalig','Nein']} value={data.backup_test} onChange={u('backup_test')} />
          </Field>
          <Field label="Unveränderlichkeit der Archive sichergestellt durch">
            <Chips multi options={['WORM-Speicher','Prüfsummen/Hashwerte','Software-Schutz','Organisatorische Anweisung']}
              value={data.archiv_unveraenderlich} onChange={u('archiv_unveraenderlich')} />
          </Field>
        </div>
        <Field label="Aufbewahrungsfristen bekannt und umgesetzt?">
          <Chips options={['Ja — 10 Jahre für Buchungsbelege','Ja — mit Löschkonzept','Teilweise','Nein']} value={data.aufbewahrungsfristen} onChange={u('aufbewahrungsfristen')} />
        </Field>
      </Section>

      {/* G – IKS */}
      <Section title="G — Internes Kontrollsystem (IKS)" icon="🛡️">
        <Field label="Benutzerkonten / Zugriffskontrolle">
          <input type="text" {...inp('iks_benutzer')} placeholder="z.B. Individuelle Benutzerkonten, Rollen-basiert" />
        </Field>
        <Field label="Benutzerrollen und Berechtigungen">
          <textarea {...inp('iks_rollen')} placeholder="z.B. Admin (GF), Buchhalter (lesen/buchen), Steuerberater (lesen)" />
        </Field>
        <div className="grid-2">
          <Field label="Zwei-Faktor-Authentifizierung">
            <Chips options={['Ja — für alle Systeme','Ja — für externe Zugänge','Nein']} value={data.iks_2fa} onChange={u('iks_2fa')} />
          </Field>
          <Field label="Vier-Augen-Prinzip bei Zahlungen">
            <Chips options={['Ja — konsequent','Teilweise','Nein — Einzelperson']} value={data.iks_vier_augen} onChange={u('iks_vier_augen')} />
          </Field>
        </div>
        <Field label="Freigabeprozess Zahlungen">
          <input type="text" {...inp('iks_zahlung_freigabe')} placeholder="Wer genehmigt Zahlungen? Ab welchem Betrag Vier-Augen?" />
        </Field>
      </Section>

      {/* H – Verantwortliche */}
      <Section title="H — Verantwortlichkeiten und Freigabe" icon="✍️">
        <div className="grid-3">
          <Field label="Verantwortlich für Buchführung" required>
            <input type="text" {...inp('verantwortlich_buchhaltung')} placeholder="Name, Funktion" />
          </Field>
          <Field label="Erstellt durch">
            <input type="text" {...inp('ersteller')} placeholder="Name, Funktion" />
          </Field>
          <Field label="Freigegeben durch">
            <input type="text" {...inp('freigebender')} placeholder="Name, Funktion (z.B. GF)" />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Datum der Erstellung">
            <input type="date" value={data.datum || ''} onChange={e => onUpdate({ datum: e.target.value })} />
          </Field>
          <Field label="Nächste Überprüfung">
            <input type="date" value={data.naechste_pruefung || ''} onChange={e => onUpdate({ naechste_pruefung: e.target.value })} />
          </Field>
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onNext} style={{ padding: '10px 24px', fontSize: 14 }}>
          Weiter zur Vorschau →
        </button>
      </div>
    </div>
  )
}
