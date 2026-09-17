import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { saveFacility, generateId } from '../data/storage'

const FUEL_TYPES = ['Jet A', 'Jet A-1', '100LL AvGas', 'Other']

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function TankForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [fuelType, setFuelType] = useState(initial?.fuelType || 'Jet A')
  const [capacityGal, setCapacityGal] = useState(initial?.capacityGal ?? '')
  const [serialNumber, setSerialNumber] = useState(initial?.serialNumber || '')
  const [sumpCount, setSumpCount] = useState(initial?.sumpCount ?? 1)
  const [notes, setNotes] = useState(initial?.notes || '')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required'); return }
    onSave({
      type: 'tank',
      name: name.trim(),
      fuelType,
      capacityGal: capacityGal !== '' ? Number(capacityGal) : null,
      serialNumber: serialNumber.trim(),
      sumpCount: Number(sumpCount) || 1,
      notes: notes.trim(),
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Tank Name / Label <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Tank 1"
          className="input-field"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fuel Type</label>
          <select value={fuelType} onChange={e => setFuelType(e.target.value)} className="input-field">
            {FUEL_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Sump Points</label>
          <select value={sumpCount} onChange={e => setSumpCount(e.target.value)} className="input-field">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Capacity (gal)</label>
          <input
            type="number"
            inputMode="numeric"
            value={capacityGal}
            onChange={e => setCapacityGal(e.target.value)}
            placeholder="e.g. 5000"
            className="input-field"
            min="0"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Serial / ID #</label>
          <input
            type="text"
            value={serialNumber}
            onChange={e => setSerialNumber(e.target.value)}
            placeholder="optional"
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any additional details..."
          rows={2}
          className="input-field resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="btn-primary flex-1 text-sm">Save</button>
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Cancel</button>
      </div>
    </div>
  )
}

function TruckForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required'); return }
    onSave({ type: 'truck', name: name.trim(), notes: notes.trim() })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Truck Name / Label <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Refueler Truck 1"
          className="input-field"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any additional details..."
          rows={2}
          className="input-field resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="btn-primary flex-1 text-sm">Save</button>
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Cancel</button>
      </div>
    </div>
  )
}

function QRModal({ asset, facility, onClose }) {
  const qrValue = `ffi:asset:${asset.id}`
  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-white rounded-2xl p-6 text-center shadow-2xl pointer-events-auto max-w-xs w-full">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{facility?.name}</p>
          <p className="text-lg font-black text-gray-900 mb-4">{asset.name}</p>
          <div className="flex justify-center mb-4">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="M"
              includeMargin
            />
          </div>
          {asset.fuelType && (
            <p className="text-sm font-semibold text-gray-700 mb-1">{asset.fuelType}</p>
          )}
          {asset.serialNumber && (
            <p className="text-xs text-gray-400 font-mono">#{asset.serialNumber}</p>
          )}
          <p className="text-xs text-gray-300 mt-3 font-mono break-all">{qrValue}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}

export default function AssetSetup({ facility, onClose, onUpdate }) {
  const [assets, setAssets] = useState(facility?.assets || [])
  const [editingId, setEditingId] = useState(null) // 'new-tank' | 'new-truck' | asset.id
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showQRFor, setShowQRFor] = useState(null) // asset.id

  const tanks = assets.filter(a => a.type === 'tank')
  const trucks = assets.filter(a => a.type === 'truck')

  const persist = (updated) => {
    saveFacility({ ...facility, assets: updated })
    setAssets(updated)
    if (onUpdate) onUpdate()
  }

  const handleSaveAsset = (assetData) => {
    if (editingId === 'new-tank' || editingId === 'new-truck') {
      persist([...assets, { ...assetData, id: generateId() }])
    } else {
      persist(assets.map(a => a.id === editingId ? { ...a, ...assetData } : a))
    }
    setEditingId(null)
  }

  const handleDelete = (id) => {
    persist(assets.filter(a => a.id !== id))
    setConfirmDeleteId(null)
    if (editingId === id) setEditingId(null)
  }

  const startEdit = (id) => {
    setEditingId(id)
    setConfirmDeleteId(null)
  }

  const startDelete = (id) => {
    setConfirmDeleteId(id)
    setEditingId(null)
  }

  return (
    <>
      {showQRFor && (() => {
        const asset = assets.find(a => a.id === showQRFor)
        return asset ? <QRModal asset={asset} facility={facility} onClose={() => setShowQRFor(null)} /> : null
      })()}
      <div className="fixed inset-0 bg-black/60 z-40" />
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col max-w-screen-sm mx-auto">

        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0 flex items-center gap-3 safe-top">
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white transition-colors -ml-1"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Asset Setup</h2>
            <p className="text-xs text-amber-400">{facility?.name}</p>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-8 max-w-lg mx-auto pb-8">

            {/* ── Tanks ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tanks</h3>
                {editingId !== 'new-tank' && (
                  <button
                    onClick={() => setEditingId('new-tank')}
                    className="text-xs text-gray-400 hover:text-amber-400 border border-gray-600 hover:border-amber-500 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    + Add Tank
                  </button>
                )}
              </div>

              {editingId === 'new-tank' && (
                <div className="card p-4 mb-3 border-amber-500/40 animate-fade-in">
                  <p className="text-xs text-amber-400 font-semibold mb-3 uppercase tracking-wider">New Tank</p>
                  <TankForm onSave={handleSaveAsset} onCancel={() => setEditingId(null)} />
                </div>
              )}

              {tanks.length === 0 && editingId !== 'new-tank' && (
                <p className="text-sm text-gray-600 italic">No tanks configured yet.</p>
              )}

              <div className="space-y-2">
                {tanks.map(tank => (
                  <div key={tank.id} className="card p-4">
                    {confirmDeleteId === tank.id ? (
                      <div>
                        <p className="text-sm text-red-400 mb-3">
                          Delete <strong>{tank.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(tank.id)} className="btn-danger text-sm flex-1">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary text-sm flex-1">Cancel</button>
                        </div>
                      </div>
                    ) : editingId === tank.id ? (
                      <div className="animate-fade-in">
                        <p className="text-xs text-amber-400 font-semibold mb-3 uppercase tracking-wider">Edit Tank</p>
                        <TankForm initial={tank} onSave={handleSaveAsset} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">TANK</span>
                            <span className="font-semibold text-white">{tank.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                            {tank.fuelType && <span>{tank.fuelType}</span>}
                            {tank.capacityGal != null && (
                              <span>{Number(tank.capacityGal).toLocaleString()} gal</span>
                            )}
                            <span>
                              {tank.sumpCount ?? 1} sump pt{(tank.sumpCount ?? 1) !== 1 ? 's' : ''}
                            </span>
                            {tank.serialNumber && (
                              <span className="font-mono"># {tank.serialNumber}</span>
                            )}
                          </div>
                          {tank.notes && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{tank.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => setShowQRFor(tank.id)}
                            className="p-1.5 text-gray-500 hover:text-amber-400 transition-colors"
                            aria-label={`Show QR code for ${tank.name}`}
                            title="Show QR code"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => startEdit(tank.id)}
                            className="p-1.5 text-gray-500 hover:text-amber-400 transition-colors"
                            aria-label={`Edit ${tank.name}`}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => startDelete(tank.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                            aria-label={`Delete ${tank.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Trucks ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trucks</h3>
                {editingId !== 'new-truck' && (
                  <button
                    onClick={() => setEditingId('new-truck')}
                    className="text-xs text-gray-400 hover:text-amber-400 border border-gray-600 hover:border-amber-500 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    + Add Truck
                  </button>
                )}
              </div>

              {editingId === 'new-truck' && (
                <div className="card p-4 mb-3 border-amber-500/40 animate-fade-in">
                  <p className="text-xs text-amber-400 font-semibold mb-3 uppercase tracking-wider">New Truck</p>
                  <TruckForm onSave={handleSaveAsset} onCancel={() => setEditingId(null)} />
                </div>
              )}

              {trucks.length === 0 && editingId !== 'new-truck' && (
                <p className="text-sm text-gray-600 italic">No trucks configured yet.</p>
              )}

              <div className="space-y-2">
                {trucks.map(truck => (
                  <div key={truck.id} className="card p-4">
                    {confirmDeleteId === truck.id ? (
                      <div>
                        <p className="text-sm text-red-400 mb-3">
                          Delete <strong>{truck.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(truck.id)} className="btn-danger text-sm flex-1">Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary text-sm flex-1">Cancel</button>
                        </div>
                      </div>
                    ) : editingId === truck.id ? (
                      <div className="animate-fade-in">
                        <p className="text-xs text-amber-400 font-semibold mb-3 uppercase tracking-wider">Edit Truck</p>
                        <TruckForm initial={truck} onSave={handleSaveAsset} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">TRUCK</span>
                            <span className="font-semibold text-white">{truck.name}</span>
                          </div>
                          {truck.notes && (
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{truck.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => startEdit(truck.id)}
                            className="p-1.5 text-gray-500 hover:text-amber-400 transition-colors"
                            aria-label={`Edit ${truck.name}`}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => startDelete(truck.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                            aria-label={`Delete ${truck.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
