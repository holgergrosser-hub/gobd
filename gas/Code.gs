// ═══════════════════════════════════════════════════════════════════════
// GoBD Verfahrensdokumentation — Google Apps Script Backend v2
//
// SETUP:
//  1. Google Sheet erstellen
//  2. SHEET_ID aus Sheet-URL eintragen (s. unten)
//  3. Bereitstellen → Neue Bereitstellung → Web-App
//     Ausführen als: Ich | Zugriff: Jeder
//  4. NACH JEDER ÄNDERUNG: Neue Bereitstellung erstellen!
// ═══════════════════════════════════════════════════════════════════════

const SHEET_ID     = 'HIER_DEINE_SHEET_ID_EINTRAGEN'
const TAB_DATEN    = 'GoBD_Daten'
const TAB_LOG      = 'Änderungsprotokoll'
const TAB_KUNDEN   = 'Kundenliste'

// Optional: Google Docs Musterdokument (ID aus der URL zwischen /d/ und /edit)
// Wenn gesetzt, wird beim Erstellen zuerst eine Kopie des Musterdocs erstellt.
const TEMPLATE_DOC_ID = ''

function assertSheetIdConfigured() {
  if (!SHEET_ID || SHEET_ID === 'HIER_DEINE_SHEET_ID_EINTRAGEN') {
    throw new Error('SHEET_ID ist nicht gesetzt. Bitte in Code.gs die SHEET_ID aus der Google-Sheet-URL eintragen (zwischen /d/ und /edit).')
  }
}

function jsonOk(data)    { return ContentService.createTextOutput(JSON.stringify({status:'ok',...data})).setMimeType(ContentService.MimeType.JSON) }
function jsonErr(msg)    { return ContentService.createTextOutput(JSON.stringify({status:'error',message:msg})).setMimeType(ContentService.MimeType.JSON) }

// ── Routing ──────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    let action, data, kundenId, templateDocId
    try {
      const b = JSON.parse(e.postData.contents)
      action=b.action; data=b.data; kundenId=b.kundenId; templateDocId=b.templateDocId
    } catch {
      action=e.parameter.action; kundenId=e.parameter.kundenId||'default'
      templateDocId=e.parameter.templateDocId||''
      data=e.parameter.data?JSON.parse(e.parameter.data):null
    }
    Logger.log('Action:%s Kunde:%s', action, kundenId)
    if (action==='save')          return doSave(data, kundenId||'default')
    if (action==='load')          return doLoad(kundenId||'default')
    if (action==='list_kunden')   return doListKunden()
    if (action==='generate_doc')  return doGenerateDoc(data, kundenId||'default', templateDocId)
    if (action==='ping')          return jsonOk({message:'API läuft',version:'2.0'})
    return jsonErr('Unbekannte Action: '+action)
  } catch(err) { Logger.log('FEHLER: %s',err.toString()); return jsonErr(err.toString()) }
}

function doGet(e) {
  const a = e.parameter.action
  if (a==='ping') return jsonOk({message:'GoBD API v2 läuft'})
  if (a==='list_kunden') return doListKunden()
  return jsonOk({message:'GoBD API v2'})
}

// ── SAVE ─────────────────────────────────────────────────────────────────
function doSave(data, kid) {
  if (!data) return jsonErr('Keine Daten')
  try { assertSheetIdConfigured() } catch (e) { return jsonErr(e.message) }
  const ss  = SpreadsheetApp.openById(SHEET_ID)
  const sh  = getOrCreate(ss, TAB_DATEN)
  ensureHeaders(sh, ['Feld','Wert','Geändert am'])
  clearKunde(sh, kid)
  const ts  = now()
  const rows = Object.entries(data).map(([k,v])=>[kid+'::'+k, Array.isArray(v)?v.join(', '):(v||''), ts])
  rows.push([kid+'::_meta_ts', ts, ts])
  appendRows(sh, rows)
  styleDataSheet(sh)
  updateKundenliste(ss, kid, data, ts)
  writeLog(ss, kid, 'SPEICHERN', data.firmenname||kid, rows.length+' Felder', ts)
  return jsonOk({message:rows.length+' Felder gespeichert', kundenId:kid, timestamp:ts})
}

// ── LOAD ─────────────────────────────────────────────────────────────────
function doLoad(kid) {
  try { assertSheetIdConfigured() } catch (e) { return jsonErr(e.message) }
  const ss = SpreadsheetApp.openById(SHEET_ID)
  const sh = ss.getSheetByName(TAB_DATEN)
  if (!sh || sh.getLastRow()<2) return jsonOk({data:{},kundenId:kid})
  const rows = sh.getRange(2,1,sh.getLastRow()-1,2).getValues()
  const ARR  = ['stb_zusammenarbeit','bsw_name','vorsysteme','belegeingang','archiv_system','archiv_format','backup_ort','archiv_unveraenderlich']
  const data = {}
  rows.forEach(([k,v])=>{
    if (!k||!k.startsWith(kid+'::')) return
    const f = k.slice(kid.length+2)
    if (f.startsWith('_meta_')) return
    data[f] = ARR.includes(f)&&v ? v.toString().split(', ').filter(Boolean) : v.toString()
  })
  writeLog(ss, kid, 'LADEN', data.firmenname||kid, '', now())
  return jsonOk({data, kundenId:kid})
}

// ── KUNDENLISTE ───────────────────────────────────────────────────────────
function doListKunden() {
  try { assertSheetIdConfigured() } catch (e) { return jsonErr(e.message) }
  const ss = SpreadsheetApp.openById(SHEET_ID)
  const sh = ss.getSheetByName(TAB_KUNDEN)
  if (!sh||sh.getLastRow()<2) return jsonOk({kunden:[]})
  const kunden = sh.getRange(2,1,sh.getLastRow()-1,5).getValues()
    .filter(r=>r[0])
    .map(([id,name,rechtsform,ts,pct])=>({id,name,rechtsform,gespeichert:ts.toString(),vollstaendigkeit:pct.toString()}))
  return jsonOk({kunden})
}

// ── GENERATE DOC ─────────────────────────────────────────────────────────
function doGenerateDoc(data, kid, templateDocId) {
  if (!data) return jsonErr('Keine Daten')
  try { assertSheetIdConfigured() } catch (e) { return jsonErr(e.message) }
  const ss      = SpreadsheetApp.openById(SHEET_ID)
  const firma   = data.firmenname||kid||'Unternehmen'
  const datum   = Utilities.formatDate(new Date(),'Europe/Berlin','yyyy-MM-dd')
  const docName = 'GoBD_VFD_'+firma.replace(/\s+/g,'_')+'_'+datum

  const tpl = (templateDocId || TEMPLATE_DOC_ID || '').toString().trim()
  const doc = tpl
    ? DocumentApp.openById(DriveApp.getFileById(tpl).makeCopy(docName).getId())
    : DocumentApp.create(docName)

  const body    = doc.getBody()
  if (tpl) body.appendPageBreak()
  body.setMarginLeft(72).setMarginRight(72).setMarginTop(80).setMarginBottom(72)

  const BLAU = '#1E40AF', HELL = '#EFF6FF', GRAU = '#F9FAFB'
  function v(x)  { return Array.isArray(x)?x.join(', '):(x?x.toString():'') }
  function ph(x) { const s=v(x); return s||'⚠️ [noch ausfüllen]' }

  function h1(text) {
    const p=body.appendParagraph('▌ '+text)
    p.setHeading(DocumentApp.ParagraphHeading.HEADING1)
    p.editAsText().setBold(true).setFontSize(12).setForegroundColor(BLAU)
    p.setSpacingBefore(16).setSpacingAfter(4)
  }
  function h2(text) {
    const p=body.appendParagraph(text)
    p.setHeading(DocumentApp.ParagraphHeading.HEADING2)
    p.editAsText().setBold(true).setFontSize(10).setForegroundColor('#374151')
    p.setSpacingBefore(10).setSpacingAfter(2)
  }
  function row(label, value, warn) {
    const t=body.appendTable([[label, ph(value)]])
    t.setBorderWidth(0.5)
    t.getCell(0,0).setWidth(190).setBackgroundColor(HELL).editAsText().setBold(true).setFontSize(9).setForegroundColor('#374151')
    t.getCell(0,1).setBackgroundColor(warn&&!v(value)?'#FFF9C4':'#FFFFFF').editAsText().setFontSize(9).setForegroundColor(v(value)?'#111827':'#9CA3AF').setItalic(!v(value))
    for (let c=0;c<2;c++) t.getCell(0,c).setPaddingLeft(6).setPaddingRight(6).setPaddingTop(3).setPaddingBottom(3)
  }
  function sp() { body.appendParagraph('').editAsText().setFontSize(3) }
  function note(text) { body.appendParagraph(text).editAsText().setFontSize(8).setForegroundColor('#6B7280').setItalic(true) }

  // Titel
  body.appendParagraph('VERFAHRENSDOKUMENTATION GoBD').setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .editAsText().setBold(true).setFontSize(20).setForegroundColor(BLAU)
  body.appendParagraph('BMF-Schreiben 11.03.2024 · Az. IV D 2 – S 0316/21/10001:002')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .editAsText().setFontSize(8).setForegroundColor('#9CA3AF').setItalic(true)
  sp()
  const tt=body.appendTable([['Unternehmen:',ph(data.firmenname)],['Rechtsform:',ph(data.rechtsform)],['Stand:',v(data.datum)||datum],['Erstellt von:',ph(data.ersteller)],['Freigegeben von:',ph(data.freigebender)]])
  tt.setBorderWidth(0.5)
  for(let i=0;i<5;i++){tt.getCell(i,0).setBackgroundColor(HELL).editAsText().setBold(true).setFontSize(10);tt.getCell(i,1).editAsText().setFontSize(10)}
  body.appendPageBreak()

  h1('1  Unternehmensdaten  |  GoBD Tz. 151 · § 146 AO')
  row('Firmenname',data.firmenname,true); row('Rechtsform',data.rechtsform,true); row('HRB-Nummer',data.hrb)
  row('Steuernummer',data.steuernummer,true); row('USt-IdNr.',data.ust_id); row('Finanzamt',data.finanzamt,true)
  row('Anschrift',data.anschrift,true); row('Geschäftsführer',data.geschaeftsfuehrer,true)
  row('Branche',data.branche); row('Mitarbeiter',data.mitarbeiter); row('Unternehmensgegenstand',data.unternehmensgegenstand)
  sp()

  h1('2  Steuerberater')
  row('Kanzlei',data.stb_kanzlei); row('Steuerberater',data.stb_name); row('Adresse',data.stb_adresse)
  row('Zusammenarbeit',data.stb_zusammenarbeit); row('Umfang',data.stb_umfang)
  sp()

  h1('3  Buchführungssoftware  |  GoBD Tz. 153')
  note('Für jedes DV-System ist eine Verfahrensdokumentation vorgeschrieben (GoBD Tz. 151).')
  row('Software (Hauptsystem)',data.bsw_name,true); row('Version',data.bsw_version)
  row('GoBD-Zertifikat',data.bsw_zertifikat); row('Zertifikat Datum',data.bsw_zertifikat_datum)
  row('Installationsort',data.bsw_ort); row('Cloud-Dienste',data.cloud_dienste)
  h2('Vorsysteme und Schnittstellen  |  GoBD Tz. 38')
  row('Vorsysteme',data.vorsysteme); row('Schnittstellen',data.schnittstellen)
  sp()

  h1('4  Belegerfassung und Archivierung  |  GoBD Tz. 152')
  note('Von der Entstehung der Information über die Indizierung, Verarbeitung und Speicherung bis zur Reproduktion (GoBD Tz. 152).')
  row('Eingangskanäle',data.belegeingang,true); row('Ersetzendes Scannen',data.scan_ja)
  row('Scan-Zeitpunkt',data.scan_zeitpunkt); row('Scan-Gerät / Software',data.scan_geraet)
  row('Archivsystem',data.archiv_system,true); row('Speicherformat',data.archiv_format)
  row('Papieroriginal nach Scan',data.original_aufbewahrung)
  sp()

  h1('5  Datensicherung und Aufbewahrung  |  GoBD Tz. 101 · § 147 AO')
  row('Backup-Frequenz',data.backup_freq,true); row('Backup-Speicherort',data.backup_ort)
  row('Backup-Wiederherstellung getestet',data.backup_test)
  row('Unveränderlichkeit sichergestellt durch',data.archiv_unveraenderlich)
  row('Aufbewahrungsfristen eingehalten',data.aufbewahrungsfristen)
  h2('Aufbewahrungsfristen nach § 147 AO')
  const ft=body.appendTable([['Unterlagenart','Frist','Rechtsgrundlage'],['Bücher, Inventare, Jahresabschlüsse','10 J.','§ 147 Abs. 1 Nr. 1 AO'],['Buchungsbelege','10 J.','§ 147 Abs. 1 Nr. 4 AO'],['Geschäftsbriefe (empfangen)','6 J.','§ 147 Abs. 1 Nr. 2 AO'],['Geschäftsbriefe (abgesandt)','6 J.','§ 147 Abs. 1 Nr. 3 AO'],['Verfahrensdokumentation','10 J.','GoBD Tz. 151']])
  ft.setBorderWidth(0.5)
  for(let c=0;c<3;c++){ft.getCell(0,c).setBackgroundColor(BLAU).editAsText().setBold(true).setFontSize(9).setForegroundColor('#FFFFFF')}
  for(let r=1;r<6;r++)for(let c=0;c<3;c++){ft.getCell(r,c).setBackgroundColor(r%2===0?GRAU:'#FFFFFF').editAsText().setFontSize(9)}
  sp()

  h1('6  Internes Kontrollsystem (IKS)  |  GoBD Tz. 100')
  note('Zugangs-/Zugriffskontrollen, Funktionstrennungen, Erfassungs- und Verarbeitungskontrollen (GoBD Tz. 100).')
  row('Benutzerkonten / Zugriffskontrolle',data.iks_benutzer); row('Rollen und Berechtigungen',data.iks_rollen)
  row('2-Faktor-Authentifizierung',data.iks_2fa); row('Vier-Augen-Prinzip',data.iks_vier_augen)
  row('Freigabeprozess Zahlungen',data.iks_zahlung_freigabe)
  sp()

  h1('7  Freigabe und Verantwortlichkeiten')
  row('Verantwortlich Buchführung',data.verantwortlich_buchhaltung,true)
  row('Erstellt von',data.ersteller); row('Freigegeben von',data.freigebender)
  row('Datum',v(data.datum)||datum); row('Nächste Überprüfung',data.naechste_pruefung)
  sp()
  body.appendParagraph('Unterschrift:  _______________________________   Datum:  ____________')
    .editAsText().setFontSize(9).setForegroundColor('#9CA3AF')

  doc.saveAndClose()
  const ts = now()
  writeLog(ss, kid, 'DOKUMENT ERSTELLT', firma, doc.getId(), ts)
  const docUrl = 'https://docs.google.com/document/d/'+doc.getId()+'/edit'
  Logger.log('Erstellt: %s', docUrl)
  return jsonOk({docUrl, docId:doc.getId(), docName, message:'Dokument erstellt'})
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────
function now() { return Utilities.formatDate(new Date(),'Europe/Berlin','dd.MM.yyyy HH:mm:ss') }

function getOrCreate(ss, name) {
  let sh = ss.getSheetByName(name)
  return sh || ss.insertSheet(name)
}

function ensureHeaders(sh, headers) {
  if (sh.getLastRow()>0) return
  sh.getRange(1,1,1,headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#1E40AF').setFontColor('#FFFFFF').setFontSize(10)
  sh.setFrozenRows(1)
}

function clearKunde(sh, kid) {
  if (sh.getLastRow()<2) return
  const vals = sh.getRange(2,1,sh.getLastRow()-1,1).getValues()
  for (let i=vals.length-1;i>=0;i--) {
    if (vals[i][0]&&vals[i][0].toString().startsWith(kid+'::')) sh.deleteRow(i+2)
  }
}

function appendRows(sh, rows) {
  if (!rows.length) return
  const s = sh.getLastRow()+1
  sh.getRange(s,1,rows.length,rows[0].length).setValues(rows)
  rows.forEach((_,i)=>sh.getRange(s+i,1,1,rows[0].length).setBackground(i%2===0?'#F9FAFB':'#FFFFFF'))
}

function styleDataSheet(sh) {
  try {
    sh.setColumnWidth(1,260).setColumnWidth(2,420)
    if (sh.getMaxColumns()>=3) sh.setColumnWidth(3,160)
    if (sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,1).setFontWeight('bold').setFontColor('#374151')
  } catch(e) { Logger.log('Style warn: %s', e) }
}

function updateKundenliste(ss, kid, data, ts) {
  const sh = getOrCreate(ss, TAB_KUNDEN)
  ensureHeaders(sh, ['Kunden-ID','Firmenname','Rechtsform','Zuletzt gespeichert','Vollständigkeit'])
  const PFLICHT = ['firmenname','rechtsform','steuernummer','finanzamt','anschrift','geschaeftsfuehrer','bsw_name','archiv_system','backup_freq']
  const pct = Math.round(PFLICHT.filter(f=>data[f]&&(Array.isArray(data[f])?data[f].length:data[f].toString().trim())).length/PFLICHT.length*100)+'%'
  const newRow = [kid, data.firmenname||'', data.rechtsform||'', ts, pct]
  if (sh.getLastRow()>=2) {
    const ids = sh.getRange(2,1,sh.getLastRow()-1,1).getValues()
    for (let i=0;i<ids.length;i++) {
      if (ids[i][0]===kid) { sh.getRange(i+2,1,1,5).setValues([newRow]); return }
    }
  }
  const r = sh.getLastRow()+1
  sh.getRange(r,1,1,5).setValues([newRow]).setBackground(r%2===0?'#F9FAFB':'#FFFFFF')
}

function writeLog(ss, kid, action, name, detail, ts) {
  const sh = getOrCreate(ss, TAB_LOG)
  ensureHeaders(sh, ['Zeitstempel','Kunden-ID','Firmenname','Aktion','Details'])
  sh.insertRowAfter(1)
  sh.getRange(2,1,1,5).setValues([[ts,kid,name,action,detail.toString().slice(0,200)]]).setBackground('#EFF6FF')
}

// ── Tests ─────────────────────────────────────────────────────────────────
function testPing()  { Logger.log(doGet({parameter:{action:'ping'}}).getContent()) }
function testSave()  { Logger.log(doSave({firmenname:'Test GmbH',rechtsform:'GmbH',steuernummer:'123/456',bsw_name:['DATEV']},'test-001').getContent()) }
function testLoad()  { Logger.log(doLoad('test-001').getContent()) }
function testDoc()   { Logger.log(doGenerateDoc({firmenname:'Test GmbH',rechtsform:'GmbH',ersteller:'Max',freigebender:'GF'},'test-001').getContent()) }
