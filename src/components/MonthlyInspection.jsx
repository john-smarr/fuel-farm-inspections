import React, { useState, useEffect } from 'react'
import { MONTHLY_ITEMS, MONTHLY_RATINGS } from '../data/constants'
import { getMonthlyInspection, saveMonthlyInspection, generateId, getSettings } from '../data/storage'
import { compressPhoto } from '../utils/photo'
import { buildMonthlyEmailUrl } from '../utils/email'
import { MonthlyExportView } from './ExportView'
import { getFormsForAsset } from '../data/formDefinitions'
import GenericFormRenderer from './GenericFormRenderer'


function getTodayYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatYearMonth(ym) {
  const [year, month] = ym.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const DEFAULT_ITEM = {
  rating: null,
  date: '',
  signature: '',
  maintenanceActionNotes: '',
  numericValue: null,
}

function buildDefaultItems() {
  const items = {}
  Object.keys(MONTHLY_ITEMS).forEach(key => {
    items[key] = { ...DEFAULT_ITEM }
  })
  return items
}

function formatTimestamp(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default function MonthlyInspection({ facilityId, facility }) {
  const assets = facility?.assets || []
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || null)
  const [yearMonth, setYearMonth] = useState(getTodayYearMonth())
  const [items, setItems] = useState(buildDefaultItems())
  const [existingRecord, setExistingRecord] = useState(null)
  const [saved, setSaved] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saved'
  const [errors, setErrors] = useState({})
  const [emailAlertUrl, setEmailAlertUrl] = useState(null)
  const [itemPhotos, setItemPhotos] = useState({})
  const [activeFormType, setActiveFormType] = useState('general') // 'general' | formDefinition.id
  const [showEquipmentForm, setShowEquipmentForm] = useState(null) // formDefinition or null

  const loadData = (assetId, ym) => {
    if (!facilityId || !assetId) return
    const existing = getMonthlyInspection(facilityId, assetId, ym)
    if (existing?.items) {
      const merged = buildDefaultItems()
      Object.keys(merged).forEach(key => {
        if (existing.items[key]) {
          merged[key] = { ...merged[key], ...existing.items[key] }
        }
      })
      setItems(merged)
      setItemPhotos(existing.itemPhotos || {})
      setExistingRecord(existing)
      setSaved(true)
    } else {
      setItems(buildDefaultItems())
      setItemPhotos({})
      setExistingRecord(null)
      setSaved(false)
    }
  }

  useEffect(() => {
    loadData(selectedAssetId, yearMonth)
  }, [facilityId, selectedAssetId, yearMonth])

  const handleAssetChange = (assetId) => {
    setSelectedAssetId(assetId)
    setErrors({})
    setEmailAlertUrl(null)
    setSaveStatus(null)
    setItemPhotos({})
    setActiveFormType('general')
    setShowEquipmentForm(null)
  }

  const prevMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number)
    if (m === 1) setYearMonth(`${y - 1}-12`)
    else setYearMonth(`${y}-${String(m - 1).padStart(2, '0')}`)
  }

  const nextMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number)
    if (m === 12) setYearMonth(`${y + 1}-01`)
    else setYearMonth(`${y}-${String(m + 1).padStart(2, '0')}`)
  }

  const updateItem = (key, field, value) => {
    setItems(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }))
    setSaveStatus(null)
    // Clear error for this item when rating changes away from C or notes are added
    if (field === 'rating' && value !== 'C') {
      setErrors(prev => { const ne = { ...prev }; delete ne[key]; return ne })
    }
    if (field === 'maintenanceActionNotes' && (value || '').trim()) {
      setErrors(prev => { const ne = { ...prev }; delete ne[key]; return ne })
    }
  }

  const handleSave = () => {
    if (!facilityId || !selectedAssetId) return

    const newErrors = {}
    Object.entries(items).forEach(([key, item]) => {
      if (item.rating === 'C' && !(item.maintenanceActionNotes || '').trim()) {
        newErrors[key] = 'Notes are required for items rated C'
      }
    })
    // Membrane filter test always requires a photo
    if (items.membraneFilterTest?.rating && !itemPhotos.membraneFilterTest) {
      newErrors.membraneFilterTestPhoto = 'Photo is required for Membrane Filter Test'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const now = new Date().toISOString()

    // Track edits to existing records
    let editHistory = existingRecord?.editHistory || []
    if (existingRecord) {
      editHistory = [...editHistory, { editedAt: now }]
    }

    const inspection = {
      id: existingRecord?.id || generateId(),
      facilityId,
      assetId: selectedAssetId,
      yearMonth,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
      editHistory,
      items,
      itemPhotos,
    }
    saveMonthlyInspection(inspection)
    setExistingRecord(inspection)
    setSaved(true)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2500)

    const settings = getSettings()
    const anyComment = Object.values(items).some(item => item.rating === 'C')
    if (anyComment && settings.emailRecipients.length > 0) {
      const url = buildMonthlyEmailUrl({ facility, inspection })
      setEmailAlertUrl(url)
    } else {
      setEmailAlertUrl(null)
    }
  }

  const handleExportInspection = () => ({
    id: existingRecord?.id || generateId(),
    facilityId,
    assetId: selectedAssetId,
    yearMonth,
    createdAt: existingRecord?.createdAt,
    updatedAt: existingRecord?.updatedAt,
    items,
    itemPhotos,
  })

  if (!facilityId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm font-medium">No facility selected</p>
          <p className="text-xs mt-1">Go to Settings to add and select a facility</p>
        </div>
      </div>
    )
  }

  if (showExport) {
    const selectedAsset = assets.find(a => a.id === selectedAssetId)
    return (
      <MonthlyExportView
        inspection={handleExportInspection()}
        facility={facility}
        asset={selectedAsset}
        onClose={() => setShowExport(false)}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 max-w-lg mx-auto pb-6">

        {/* Asset selector */}
        {assets.length === 0 ? (
          <div className="mb-4 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-3 py-2">
            No assets configured. Go to Settings → Facility to add tanks or trucks.
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Inspecting</p>
            <div className="flex flex-wrap gap-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAssetChange(asset.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                    selectedAssetId === asset.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                    asset.type === 'tank' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {asset.type === 'tank' ? 'T' : 'TR'}
                  </span>
                  {asset.name}
                </button>
              ))}
            </div>
            {existingRecord?.updatedAt && (
              <p className="text-xs text-gray-600 mt-2">
                Saved {formatTimestamp(existingRecord.updatedAt)}
              </p>
            )}
            {existingRecord?.editHistory?.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {existingRecord.editHistory.map((edit, i) => (
                  <p key={i} className="text-xs text-amber-500/70">
                    Edited {formatTimestamp(edit.editedAt)}{edit.editedBy ? ` by ${edit.editedBy}` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form type selector */}
        {selectedAssetId && (() => {
          const selectedAsset = assets.find(a => a.id === selectedAssetId)
          const equipmentForms = selectedAsset ? getFormsForAsset(selectedAsset).filter(f => f.frequency === 'monthly') : []
          if (equipmentForms.length === 0) return null
          return (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Form Type</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveFormType('general'); setShowEquipmentForm(null) }}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                    activeFormType === 'general'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  General
                </button>
                {equipmentForms.map(form => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => { setActiveFormType(form.id); setShowEquipmentForm(form) }}
                    className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      activeFormType === form.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {form.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Equipment-specific form */}
        {showEquipmentForm && selectedAssetId && (
          <GenericFormRenderer
            formDefinition={showEquipmentForm}
            facilityId={facilityId}
            facility={facility}
            asset={assets.find(a => a.id === selectedAssetId)}
            datePart={yearMonth}
            onClose={() => { setShowEquipmentForm(null); setActiveFormType('general') }}
            onSaved={() => {}}
          />
        )}

        {/* Month selector — only show for general form */}
        {activeFormType === 'general' && (
        <React.Fragment>

        {/* Month selector */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="font-bold text-white text-lg">{formatYearMonth(yearMonth)}</h2>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {saved && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Saved
                </span>
              )}
              {!saved && (
                <span className="text-xs text-gray-600">Not saved</span>
              )}
            </div>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Rating legend */}
        <div className="card px-3 py-2 mb-4 flex flex-wrap gap-x-4 gap-y-1">
          {MONTHLY_RATINGS.map(r => (
            <span key={r.value} className="text-xs text-gray-400">
              <span className="font-bold text-gray-200">{r.value}</span>
              <span className="text-gray-500 ml-1">= {r.title}</span>
            </span>
          ))}
        </div>

        {/* Inspection items */}
        <div className="space-y-4">
          {Object.entries(MONTHLY_ITEMS).map(([key, itemDef]) => {
            const item = items[key] || { ...DEFAULT_ITEM }
            return (
              <div key={key} className="card p-4 space-y-3">
                {/* Item header */}
                <div>
                  <h3 className="font-semibold text-white text-sm">{itemDef.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{itemDef.description}</p>
                </div>

                {/* Rating selector */}
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Rating</div>
                  <div className="flex gap-2">
                    {MONTHLY_RATINGS.map(r => {
                      const selected = item.rating === r.value
                      let colorClass = ''
                      if (selected) {
                        switch (r.value) {
                          case 'S': colorClass = 'bg-green-600 text-white border-green-600'; break
                          case 'C': colorClass = 'bg-yellow-600 text-white border-yellow-600'; break
                          case 'N/U': colorClass = 'bg-gray-600 text-white border-gray-600'; break
                          case 'N/A': colorClass = 'bg-blue-600 text-white border-blue-600'; break
                        }
                      } else {
                        colorClass = 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400 hover:text-gray-200'
                      }
                      return (
                        <button
                          key={r.value}
                          type="button"
                          title={r.title}
                          onClick={() => updateItem(key, 'rating', r.value)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${colorClass}`}
                        >
                          {r.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Membrane filter test photo (always required) */}
                {key === 'membraneFilterTest' && (
                  <div>
                    <label className={`block text-xs mb-1 ${errors.membraneFilterTestPhoto ? 'text-red-400' : 'text-gray-500'}`}>
                      Photo <span className="text-red-400">*</span>
                    </label>
                    {itemPhotos.membraneFilterTest ? (
                      <div className="space-y-1">
                        <img src={itemPhotos.membraneFilterTest} alt="Membrane filter" className="w-full max-h-32 object-cover rounded-lg border border-gray-700" />
                        <button type="button" onClick={() => setItemPhotos(prev => { const p = { ...prev }; delete p.membraneFilterTest; return p })} className="text-xs text-red-400 hover:text-red-300">Remove photo</button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 cursor-pointer border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 transition-colors w-fit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Take / Attach Photo
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) compressPhoto(file).then(img => {
                            setItemPhotos(prev => ({ ...prev, membraneFilterTest: img }))
                            if (errors.membraneFilterTestPhoto) setErrors(prev => { const ne = { ...prev }; delete ne.membraneFilterTestPhoto; return ne })
                          })
                          e.target.value = ''
                        }} />
                      </label>
                    )}
                    {errors.membraneFilterTestPhoto && (
                      <p className="text-xs text-red-400 mt-1">{errors.membraneFilterTestPhoto}</p>
                    )}
                  </div>
                )}

                {/* Numeric value (if applicable) */}
                {itemDef.hasNumeric && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Numeric Reading
                      {itemDef.numericUnit && (
                        <span className="text-gray-600 ml-1">({itemDef.numericUnit})</span>
                      )}
                      {itemDef.numericHint && (
                        <span className="text-gray-600 ml-1">— target: {itemDef.numericHint}</span>
                      )}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={item.numericValue ?? ''}
                      onChange={e => updateItem(key, 'numericValue', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder={itemDef.numericHint || 'Enter value'}
                      step="0.01"
                      className="input-field text-sm"
                    />
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={item.date}
                    onChange={e => updateItem(key, 'date', e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                {/* Signature */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Signature</label>
                  <input
                    type="text"
                    value={item.signature}
                    onChange={e => updateItem(key, 'signature', e.target.value)}
                    placeholder="Type full name as signature"
                    className="input-field text-sm"
                  />
                </div>

                {/* Maintenance Action Notes */}
                <div>
                  <label className={`block text-xs mb-1 ${errors[key] ? 'text-red-400' : item.rating === 'C' ? 'text-yellow-400' : 'text-gray-500'}`}>
                    Maintenance Action Notes
                    {item.rating === 'C' && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <textarea
                    value={item.maintenanceActionNotes}
                    onChange={e => updateItem(key, 'maintenanceActionNotes', e.target.value)}
                    placeholder="Describe any maintenance actions taken..."
                    rows={2}
                    className={`input-field text-sm resize-none ${
                      errors[key]
                        ? 'border-red-500 ring-1 ring-red-500'
                        : item.rating === 'C'
                        ? 'border-yellow-600 bg-yellow-900/10'
                        : ''
                    }`}
                  />
                  {errors[key] && (
                    <p className="text-xs text-red-400 mt-1">{errors[key]}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          {/* Email alert banner */}
          {emailAlertUrl && (
            <div className="flex items-center justify-between bg-amber-900/30 border border-amber-600/40 rounded-xl px-3 py-2.5">
              <span className="text-sm text-amber-300 font-medium">Comments recorded</span>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.open(emailAlertUrl)
                  setEmailAlertUrl(null)
                }}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Send Email Alert
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setShowExport(true)}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export / Print
            </button>
            <button
              onClick={handleSave}
              className={`btn-primary flex-1 flex items-center justify-center gap-2 text-sm transition-all ${
                saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-500' : ''
              }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Saved!
                </>
              ) : (
                'Save Inspection'
              )}
            </button>
          </div>
        </div>

        </React.Fragment>
        )}
      </div>
    </div>
  )
}
