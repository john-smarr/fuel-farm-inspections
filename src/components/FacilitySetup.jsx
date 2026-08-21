import React, { useState } from 'react'
import { getFacilities, saveFacility, deleteFacility, getActiveFacilityId, setActiveFacilityId, generateId, getSettings, saveSettings } from '../data/storage'

function exportAllData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('p66_')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)) }
      catch { data[key] = localStorage.getItem(key) }
    }
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `p66-inspection-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importAllData(file, onDone) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      let count = 0
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('p66_')) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
          count++
        }
      })
      onDone(null, count)
    } catch (err) {
      onDone('Invalid backup file')
    }
  }
  reader.readAsText(file)
}

export default function FacilitySetup({ onFacilityChange }) {
  const [facilities, setFacilities] = useState(() => getFacilities())
  const [activeFacilityId, setActive] = useState(() => getActiveFacilityId())
  const [showAddForm, setShowAddForm] = useState(false)
  const [facilityIdInput, setFacilityIdInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [error, setError] = useState('')
  const [importStatus, setImportStatus] = useState(null) // null | 'success:N' | 'error:msg'
  const [emailRecipients, setEmailRecipients] = useState(() => getSettings().emailRecipients || [])
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const refresh = () => {
    setFacilities(getFacilities())
    setActive(getActiveFacilityId())
  }

  const handleAdd = () => {
    setError('')
    const fid = facilityIdInput.trim()
    const name = nameInput.trim()
    if (!fid) { setError('Facility ID is required'); return }
    if (!name) { setError('Facility Name is required'); return }
    if (facilities.some(f => f.facilityId === fid)) {
      setError('A facility with that ID already exists')
      return
    }
    const newFacility = { id: generateId(), facilityId: fid, name }
    saveFacility(newFacility)
    // Auto-select if first facility
    if (facilities.length === 0) {
      setActiveFacilityId(newFacility.id)
    }
    refresh()
    setFacilityIdInput('')
    setNameInput('')
    setShowAddForm(false)
    if (onFacilityChange) onFacilityChange()
  }

  const handleSelect = (id) => {
    setActiveFacilityId(id)
    setActive(id)
    if (onFacilityChange) onFacilityChange()
  }

  const handleDelete = (id) => {
    deleteFacility(id)
    refresh()
    if (onFacilityChange) onFacilityChange()
    setConfirmDeleteId(null)
  }

  const handleAddEmail = () => {
    setEmailError('')
    const email = newEmail.trim().toLowerCase()
    if (!email) { setEmailError('Enter an email address'); return }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address')
      return
    }
    if (emailRecipients.includes(email)) {
      setEmailError('That address is already in the list')
      return
    }
    const updated = [...emailRecipients, email]
    setEmailRecipients(updated)
    saveSettings({ ...getSettings(), emailRecipients: updated })
    setNewEmail('')
  }

  const handleRemoveEmail = (email) => {
    const updated = emailRecipients.filter(e => e !== email)
    setEmailRecipients(updated)
    saveSettings({ ...getSettings(), emailRecipients: updated })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Facilities</h2>
            <p className="text-sm text-gray-400">Manage fuel farm locations</p>
          </div>
          <button
            onClick={() => { setShowAddForm(v => !v); setError('') }}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="card p-4 space-y-3 animate-fade-in">
            <h3 className="text-sm font-semibold text-amber-400">New Facility</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Facility ID</label>
              <input
                type="text"
                value={facilityIdInput}
                onChange={e => setFacilityIdInput(e.target.value)}
                placeholder="e.g. PDX-01"
                className="input-field"
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Facility Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Portland International Airport"
                className="input-field"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd} className="btn-primary flex-1 text-sm">
                Save Facility
              </button>
              <button onClick={() => { setShowAddForm(false); setError('') }} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Facilities list */}
        {facilities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm">No facilities yet</p>
            <p className="text-xs mt-1">Tap Add to create your first facility</p>
          </div>
        ) : (
          <div className="space-y-2">
            {facilities.map(facility => {
              const isActive = facility.id === activeFacilityId
              const confirmingDelete = confirmDeleteId === facility.id
              return (
                <div
                  key={facility.id}
                  className={`card p-4 transition-all ${
                    isActive ? 'border-amber-500/60 bg-amber-500/5' : ''
                  }`}
                >
                  {confirmingDelete ? (
                    <div>
                      <p className="text-sm text-red-400 mb-3">
                        Delete <strong>{facility.name}</strong>? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(facility.id)}
                          className="btn-danger text-sm flex-1"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn-secondary text-sm flex-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Select button */}
                      <button
                        onClick={() => handleSelect(facility.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className={`font-semibold ${isActive ? 'text-amber-400' : 'text-white'}`}>
                              {facility.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                              {facility.facilityId}
                            </div>
                          </div>
                        </div>
                        {isActive && (
                          <span className="text-xs text-amber-500 mt-1 block">Active Facility</span>
                        )}
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!isActive && (
                          <button
                            onClick={() => handleSelect(facility.id)}
                            className="text-xs text-gray-400 hover:text-amber-400 px-2 py-1 rounded border border-gray-600 hover:border-amber-500 transition-colors"
                          >
                            Select
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDeleteId(facility.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                          aria-label="Delete facility"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Email Alert Recipients */}
        <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Email Alert Recipients</h3>
            <p className="text-xs text-gray-500 mb-3">
              When an inspection has failures, the app will offer to send an alert to these addresses.
            </p>
          </div>

          {/* Current recipients list */}
          {emailRecipients.length > 0 && (
            <div className="space-y-1.5">
              {emailRecipients.map(email => (
                <div
                  key={email}
                  className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-gray-200 font-mono">{email}</span>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="text-gray-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                    aria-label={`Remove ${email}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {emailRecipients.length === 0 && (
            <p className="text-xs text-gray-600 italic">No recipients added yet.</p>
          )}

          {/* Add new email */}
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleAddEmail() }}
              placeholder="name@example.com"
              className={`input-field flex-1 text-sm ${emailError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            />
            <button
              onClick={handleAddEmail}
              className="btn-primary text-sm px-4 flex-shrink-0"
            >
              Add
            </button>
          </div>
          {emailError && (
            <p className="text-xs text-red-400">{emailError}</p>
          )}
        </div>

        {/* Data backup */}
        <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Data Backup</h3>
            <p className="text-xs text-gray-500 mb-3">Export all inspection records as JSON, or restore from a previous backup.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportAllData}
              className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <label className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  importAllData(file, (err, count) => {
                    if (err) {
                      setImportStatus(`error:${err}`)
                    } else {
                      setImportStatus(`success:${count}`)
                      refresh()
                      if (onFacilityChange) onFacilityChange()
                    }
                    setTimeout(() => setImportStatus(null), 4000)
                  })
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {importStatus && (
            <p className={`text-xs px-3 py-2 rounded-lg ${
              importStatus.startsWith('success')
                ? 'bg-green-900/30 text-green-400'
                : 'bg-red-900/30 text-red-400'
            }`}>
              {importStatus.startsWith('success')
                ? `Restored ${importStatus.split(':')[1]} records successfully.`
                : importStatus.split(':').slice(1).join(':')}
            </p>
          )}
        </div>

        {/* App info */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
                <span className="text-gray-900 font-black text-xs">P</span>
              </div>
              <span className="text-sm font-bold text-gray-300">P66 Fuel Farm Inspector</span>
            </div>
            <p className="text-xs text-gray-600">Phillips 66 Aviation Fueling Operations</p>
            <p className="text-xs text-gray-700 mt-1">v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
