import { useState, useEffect } from 'react'

export default function KundenManager({ gasUrl, kundenId, onSelect }) {
  const [kunden, setKunden] = useState([])
  const [newId, setNewId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (gasUrl) loadKunden() }, [gasUrl])

  async function loadKunden() {
    if (!gasUrl) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('action', 'list_kunden')
      const res = await fetch(gasUrl, { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.status === 'error') {
        throw new Error(json.message || res.statusText || 'Unbekannter Fehler')
      }
      if (json.kunden) setKunden(json.kunden)
    } catch (e) {
      console.warn('Kundenliste:', e.message)
    } finally {
      setLoading(false)
    }
  }

  function createNew() {
    const id = newId.trim() || 'kunde-' + Date.now()
    onSelect(id)
    setNewId('')
  }

  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1d4ed8' }}>
          👤 Aktiver Kunde: <span style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace' }}>{kundenId || 'default'}</span>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={loadKunden} disabled={loading}>
          {loading ? '⏳' : '🔄'} Aktualisieren
        </button>
      </div>

      {kunden.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {kunden.map(k => (
            <button key={k.id} onClick={() => onSelect(k.id)}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
                background: k.id === kundenId ? '#dbeafe' : 'white',
                borderColor: k.id === kundenId ? '#3b82f6' : '#d1d5db',
                color: k.id === kundenId ? '#1d4ed8' : '#374151',
              }}>
              <strong>{k.name || k.id}</strong>
              <span style={{ marginLeft: 4, color: '#9ca3af', fontSize: 11 }}>{k.vollstaendigkeit}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" value={newId} onChange={e => setNewId(e.target.value)}
          placeholder="Neue Kunden-ID (z.B. empirea-2024)"
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }} />
        <button className="btn btn-primary btn-sm" onClick={createNew}>+ Neu</button>
      </div>
    </div>
  )
}
