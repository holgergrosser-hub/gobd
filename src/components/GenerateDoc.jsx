import { useState } from 'react'

export default function GenerateDoc({ data, gasUrl }) {
  const [status, setStatus] = useState('idle')
  const [log, setLog] = useState([])

  function addLog(msg, type = 'info') {
    setLog(l => [...l, { msg, type, time: new Date().toLocaleTimeString('de-DE') }])
  }

  async function generate() {
    setStatus('running')
    setLog([])
    addLog('Starte Dokumentgenerierung...')

    try {
      // 1. Send to Google Apps Script → generates doc and returns download URL
      if (gasUrl) {
        addLog('Sende Daten an Google Apps Script...')
        const fd = new FormData()
        fd.append('action', 'generate')
        fd.append('data', JSON.stringify(data))
        const res = await fetch(gasUrl, { method: 'POST', body: fd })
        const json = await res.json()
        if (json.docUrl) {
          addLog('✅ Dokument erstellt: ' + json.docUrl, 'success')
          window.open(json.docUrl, '_blank')
          setStatus('done')
          return
        }
      }

      // 2. Fallback: generate locally in browser using docx.js CDN
      addLog('Erstelle Word-Dokument lokal im Browser...')
      await generateLocalDocx(data)
      addLog('✅ Word-Dokument heruntergeladen!', 'success')
      setStatus('done')

    } catch (err) {
      addLog('❌ Fehler: ' + err.message, 'error')
      setStatus('error')
    }
  }

  async function generateLocalDocx(d) {
    // Dynamic import of docx
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel, PageNumber } = await import('docx')

    const val = v => Array.isArray(v) ? v.join(', ') : (v || '—')
    const ph = v => val(v) === '—' ? '⚠️ [nicht angegeben]' : val(v)

    const bdr = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' }
    const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr }

    function row(label, value, warn = false) {
      return new TableRow({ children: [
        new TableCell({ borders, width: { size: 3000, type: WidthType.DXA },
          shading: { fill: 'E8F0FE', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: 'Arial', size: 22 })] })] }),
        new TableCell({ borders, width: { size: 6200, type: WidthType.DXA },
          shading: { fill: warn && value === '—' ? 'FFF3CD' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: ph(value), font: 'Arial', size: 22, color: value === '—' ? '999999' : '000000' })] })] }),
      ]})
    }

    function h1(text) {
      return new Paragraph({
        children: [new TextRun({ text, font: 'Arial', size: 32, bold: true, color: 'FFFFFF' })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 120 },
        shading: { fill: '1E40AF', type: ShadingType.CLEAR },
      })
    }

    function h2(text) {
      return new Paragraph({
        children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: 'FFFFFF' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        shading: { fill: '2563EB', type: ShadingType.CLEAR },
      })
    }

    function table(rows) {
      return new Table({ width: { size: 9200, type: WidthType.DXA }, columnWidths: [3000, 6200], rows })
    }

    function p(text, opts = {}) {
      return new Paragraph({
        children: [new TextRun({ text, font: 'Arial', size: 20, color: opts.color || '444444', italic: opts.italic || false })],
        spacing: { before: 60, after: 60 }
      })
    }

    const doc = new Document({
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1440 } } },
        children: [
          // Titel
          new Paragraph({ children: [new TextRun({ text: 'VERFAHRENSDOKUMENTATION', bold: true, size: 44, font: 'Arial', color: '1E40AF' })], alignment: AlignmentType.CENTER, spacing: { before: 600, after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: 'Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung (GoBD)', size: 24, font: 'Arial', color: '6B7280', italic: true })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: 'BMF-Schreiben vom 11.03.2024 · Az. IV D 2 – S 0316/21/10001:002', size: 18, font: 'Arial', color: '9CA3AF' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 600 } }),

          table([
            row('Unternehmen:', d.firmenname, true),
            row('Rechtsform:', d.rechtsform, true),
            row('Stand / Datum:', d.datum || new Date().toLocaleDateString('de-DE')),
            row('Erstellt von:', d.ersteller),
            row('Freigegeben von:', d.freigebender),
          ]),

          new Paragraph({ children: [new TextRun('')], pageBreak: true }),

          // A
          h1('1  Unternehmensdaten'),
          p('GoBD Tz. 151 · § 146 AO · § 238 HGB', { italic: true }),
          table([
            row('Firmenname:', d.firmenname, true), row('Rechtsform:', d.rechtsform, true),
            row('HRB-Nummer:', d.hrb), row('Steuernummer:', d.steuernummer, true),
            row('USt-IdNr.:', d.ust_id), row('Finanzamt:', d.finanzamt, true),
            row('Anschrift:', d.anschrift, true), row('Geschäftsführer:', d.geschaeftsfuehrer, true),
            row('Branche:', d.branche), row('Mitarbeiter:', d.mitarbeiter),
            row('Unternehmensgegenstand:', d.unternehmensgegenstand),
          ]),

          // B
          h1('2  Steuerberater'),
          table([
            row('Kanzlei:', d.stb_kanzlei), row('Steuerberater:', d.stb_name),
            row('Adresse:', d.stb_adresse), row('Zusammenarbeit:', d.stb_zusammenarbeit),
            row('Umfang:', d.stb_umfang),
          ]),

          // C
          h1('3  Buchführungssoftware'),
          p('GoBD Tz. 153 — Für jedes DV-System ist eine Dokumentation erforderlich.', { italic: true }),
          table([
            row('Software:', d.bsw_name, true), row('Version:', d.bsw_version),
            row('GoBD-Zertifikat:', d.bsw_zertifikat), row('Zertifikat Datum:', d.bsw_zertifikat_datum),
            row('Installationsort:', d.bsw_ort), row('Cloud-Dienste:', d.cloud_dienste),
          ]),

          h2('3.1  Vorsysteme und Schnittstellen'),
          table([
            row('Vorsysteme:', d.vorsysteme),
            row('Schnittstellen:', d.schnittstellen),
          ]),

          // D
          h1('4  Belegerfassung und Archivierung'),
          p('GoBD Tz. 152 — Von der Entstehung der Information bis zur Archivierung.', { italic: true }),
          table([
            row('Eingangskanäle:', d.belegeingang, true),
            row('Ersetzendes Scannen:', d.scan_ja),
            row('Scan-Gerät / Software:', d.scan_geraet),
            row('Archivsystem:', d.archiv_system, true),
            row('Archivformat:', d.archiv_format),
            row('Original nach Scan:', d.original_aufbewahrung),
          ]),

          // E
          h1('5  Datensicherung und Aufbewahrung'),
          p('GoBD Tz. 101 · § 147 AO — Schutz vor Verlust, Unveränderlichkeit.', { italic: true }),
          table([
            row('Backup-Frequenz:', d.backup_freq, true),
            row('Backup-Speicherort:', d.backup_ort),
            row('Backup-Test:', d.backup_test),
            row('Unveränderlichkeit:', d.archiv_unveraenderlich),
            row('Aufbewahrungsfristen:', d.aufbewahrungsfristen),
          ]),

          // F
          h1('6  Internes Kontrollsystem (IKS)'),
          p('GoBD Tz. 100 — Zugangs-/Zugriffskontrollen, Funktionstrennungen.', { italic: true }),
          table([
            row('Benutzerkonten:', d.iks_benutzer),
            row('Rollen/Berechtigungen:', d.iks_rollen),
            row('2-Faktor-Auth:', d.iks_2fa),
            row('Vier-Augen-Prinzip:', d.iks_vier_augen),
            row('Zahlungsfreigabe:', d.iks_zahlung_freigabe),
          ]),

          // G
          h1('7  Aufbewahrungsfristen (§ 147 AO)'),
          new Table({
            width: { size: 9200, type: WidthType.DXA },
            columnWidths: [3500, 1200, 2300, 2200],
            rows: [
              new TableRow({ children: ['Unterlagenart','Frist','Rechtsgrundlage','Speicherort'].map((t, i) => new TableCell({
                borders, width: { size: [3500,1200,2300,2200][i], type: WidthType.DXA },
                shading: { fill: '1E40AF', type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })] })]
              })) }),
              ...([
                ['Bücher, Inventare, Jahresabschlüsse','10 Jahre','§ 147 Abs. 1 Nr. 1 AO'],
                ['Buchungsbelege (Rechnungen etc.)','10 Jahre','§ 147 Abs. 1 Nr. 4 AO'],
                ['Geschäftsbriefe empfangen','6 Jahre','§ 147 Abs. 1 Nr. 2 AO'],
                ['Geschäftsbriefe abgesandt','6 Jahre','§ 147 Abs. 1 Nr. 3 AO'],
                ['Verfahrensdokumentation selbst','10 Jahre','GoBD Tz. 151'],
              ]).map((r, idx) => new TableRow({ children: [...r, val(d.archiv_system) !== '—' ? val(d.archiv_system) : '⚠️ noch eintragen'].map((t, i) => new TableCell({
                borders, width: { size: [3500,1200,2300,2200][i], type: WidthType.DXA },
                shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F9FAFB', type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: t, font: 'Arial', size: 20 })] })]
              })) }))
            ]
          }),

          // H
          h1('8  Freigabe'),
          table([
            row('Verantwortlich Buchführung:', d.verantwortlich_buchhaltung),
            row('Erstellt von:', d.ersteller),
            row('Freigegeben von:', d.freigebender),
            row('Datum:', d.datum || new Date().toLocaleDateString('de-DE')),
            row('Nächste Überprüfung:', d.naechste_pruefung || '—'),
          ]),

          new Paragraph({ children: [new TextRun({ text: '', font: 'Arial', size: 20 })], spacing: { before: 300 } }),
          new Paragraph({ children: [new TextRun({ text: 'Unterschrift Geschäftsführung: _______________________________   Datum: ____________', font: 'Arial', size: 20, color: '6B7280' })], spacing: { before: 200 } }),
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `GoBD_Verfahrensdokumentation_${(d.firmenname || 'Unternehmen').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>⬇️ GoBD-Verfahrensdokumentation erstellen</div>
        <div style={{ fontSize: 13, opacity: .9 }}>
          Das Word-Dokument wird mit allen eingegebenen Daten befüllt und ist sofort einsatzbereit.
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Alle Daten auf einen Blick:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, marginBottom: 20 }}>
          {[
            ['Unternehmen', data.firmenname], ['Rechtsform', data.rechtsform],
            ['Finanzamt', data.finanzamt], ['Steuernummer', data.steuernummer],
            ['Software', Array.isArray(data.bsw_name) ? data.bsw_name.join(', ') : data.bsw_name],
            ['Steuerberater', data.stb_name],
          ].map(([label, val]) => (
            <div key={label} style={{ padding: '6px 10px', background: val ? '#f0fdf4' : '#fef2f2', borderRadius: 6, display: 'flex', gap: 6 }}>
              <span style={{ color: '#6b7280', minWidth: 100 }}>{label}:</span>
              <span style={{ fontWeight: 500, color: val ? '#15803d' : '#dc2626' }}>{val || '⚠️ fehlt'}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-success" style={{ fontSize: 15, padding: '12px 28px', width: '100%' }}
          onClick={generate} disabled={status === 'running'}>
          {status === 'running' ? '⏳ Wird erstellt...' : '📥 Word-Dokument herunterladen'}
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="card" style={{ background: '#1a202c', color: '#e2e8f0' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.type === 'success' ? '#4ade80' : l.type === 'error' ? '#f87171' : '#94a3b8' }}>
                <span style={{ opacity: .5 }}>[{l.time}]</span> {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#15803d' }}>✅ Fertig!</div>
          <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
            Das Dokument wurde erstellt. Bitte prüfen und bei Bedarf Felder ergänzen.
            Die rot markierten Felder (⚠️) im Dokument zeigen noch fehlende Angaben.
          </div>
        </div>
      )}
    </div>
  )
}
