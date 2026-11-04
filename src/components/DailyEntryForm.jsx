import React, { useState } from 'react'
import { DAILY_CHECK_LABELS } from '../data/constants'
import { saveDailyInspection, getDailyInspection, generateId, getSettings } from '../data/storage'
import { buildDailyEmailUrl } from '../utils/email'
import { compressPhoto } from '../utils/photo'
import SumpCodePicker from './SumpCodePicker'
import { DailyExportView } from './ExportView'

const DEFAULT_CHECKS = {
  generalHousekeeping: null,
  securityFireSafety: null,
  fuelLeaks: null,
  bondingCablesClamps: null,
  fireExtinguishers: null,
  reclaimTankSystem: null,
  hosesSwivelsNozzles: null,
}

const DEFAULT_SUMP = { solidsCode: null, waterCode: null }

function initTankSumps(inspection, asset) {
  const count = asset?.sumpCount || 1
  const blank = () => ({ ...DEFAULT_SUMP })
  if (inspection?.tankSumps?.length > 0) {
    const arr = inspection.tankSumps.map(s => ({ ...s }))
    while (arr.length < count) arr.push(blank())
    return arr.slice(0, count)
  }
  // Backwards compat: old single tankSump field
  const first = inspection?.tankSump ? { ...inspection.tankSump } : blank()
  const arr = [first]
  while (arr.length < count) arr.push(blank())
  return arr
}


function formatTimestamp(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function isNon1A(sump) {
  if (!sump?.solidsCode || !sump?.waterCode) return false
  return sump.solidsCode !== 1 || sump.waterCode !== 'A'
}

function loadInspectionForAsset(facilityId, assetId, date) {
  if (!assetId) return null
  return getDailyInspection(facilityId, assetId, date)
}

export default function DailyEntryForm({ date, facilityId, facility, initialAssetId, onClose, onSaved }) {
  const assets = facility?.assets || []
  const firstAssetId = initialAssetId || assets[0]?.id || null
  const firstAsset = assets.find(a => a.id === firstAssetId) || assets[0] || null

  const initialInspection = loadInspectionForAsset(facilityId, firstAssetId, date)

  const [selectedAssetId, setSelectedAssetId] = useState(firstAssetId)
  const [existingRecord, setExistingRecord] = useState(initialInspection)
  const [managerTrainer, setManagerTrainer] = useState(initialInspection?.managerTrainer || '')
  const [checks, setChecks] = useState(initialInspection?.checks || { ...DEFAULT_CHECKS })
  const [failNotes, setFailNotes] = useState(initialInspection?.failNotes || {})
  const [failPhotos, setFailPhotos] = useState(initialInspection?.failPhotos || {})
  const [tankSumps, setTankSumps] = useState(() => initTankSumps(initialInspection, firstAsset))
  const [filterVesselSump, setFilterVesselSump] = useState(initialInspection?.filterVesselSump || { ...DEFAULT_SUMP })
  const [sumpNotes, setSumpNotes] = useState(initialInspection?.sumpNotes || {})
  const [sumpPhotos, setSumpPhotos] = useState(initialInspection?.sumpPhotos || {})
  const [dpPressure, setDpPressure] = useState(initialInspection?.dpPressure ?? '')
  const [dpUnavailable, setDpUnavailable] = useState(initialInspection?.dpUnavailable || false)
  const [dpNote, setDpNote] = useState(initialInspection?.dpNote || '')
  const [comment, setComment] = useState(initialInspection?.comment || '')
  const [signature, setSignature] = useState(initialInspection?.signature || '')
  const [showExport, setShowExport] = useState(false)
  const [errors, setErrors] = useState({})
  const [emailAlertUrl, setEmailAlertUrl] = useState(null)

  const handleAssetChange = (assetId) => {
    const insp = loadInspectionForAsset(facilityId, assetId, date)
    const asset = assets.find(a => a.id === assetId)
    setSelectedAssetId(assetId)
    setExistingRecord(insp)
    setManagerTrainer(insp?.managerTrainer || '')
    setChecks(insp?.checks || { ...DEFAULT_CHECKS })
    setFailNotes(insp?.failNotes || {})
    setFailPhotos(insp?.failPhotos || {})
    setTankSumps(initTankSumps(insp, asset))
    setFilterVesselSump(insp?.filterVesselSump || { ...DEFAULT_SUMP })
    setSumpNotes(insp?.sumpNotes || {})
    setSumpPhotos(insp?.sumpPhotos || {})
    setDpPressure(insp?.dpPressure ?? '')
    setDpUnavailable(insp?.dpUnavailable || false)
    setDpNote(insp?.dpNote || '')
    setComment(insp?.comment || '')
    setSignature(insp?.signature || '')
    setErrors({})
    setEmailAlertUrl(null)
  }

  const toggleCheck = (key) => {
    setChecks(prev => {
      const current = prev[key]
      // null → true (pass) → false (fail) → true (pass)
      const next = { ...prev, [key]: current === null ? true : current === true ? false : true }
      if (next[key] === true) {
        setFailNotes(fn => { const n = { ...fn }; delete n[key]; return n })
        setFailPhotos(fp => { const p = { ...fp }; delete p[key]; return p })
        setErrors(e => { const ne = { ...e }; delete ne[key]; return ne })
      }
      return next
    })
  }

  const handleFailNoteChange = (key, value) => {
    setFailNotes(prev => ({ ...prev, [key]: value }))
    if (value.trim()) {
      setErrors(prev => { const ne = { ...prev }; delete ne[key]; return ne })
    }
  }

  const handlePhotoCapture = async (key, file) => {
    if (!file) return
    const compressed = await compressPhoto(file)
    setFailPhotos(prev => ({ ...prev, [key]: compressed }))
  }

  const handleSave = () => {
    const newErrors = {}

    if (!selectedAssetId) newErrors.asset = 'Select an asset to inspect'
    if (!managerTrainer.trim()) newErrors.managerTrainer = 'Manager / Trainer name is required'
    if (!signature.trim()) newErrors.signature = 'Signature is required'

    const uncheckedItems = Object.entries(checks).filter(([, v]) => v === null)
    if (uncheckedItems.length > 0) {
      newErrors.checks = 'All inspection items must be marked Pass or Fail'
    }

    Object.entries(checks).forEach(([key, val]) => {
      if (val === false && !(failNotes[key] || '').trim()) {
        newErrors[key] = 'A note is required for failed items'
      }
    })

    // Validate non-1A sump codes require note + photo
    tankSumps.forEach((sump, idx) => {
      if (isNon1A(sump)) {
        const sumpKey = `tank_${idx}`
        if (!(sumpNotes[sumpKey] || '').trim()) newErrors[`sumpNote_${sumpKey}`] = 'Explanation required for non-1A result'
        if (!sumpPhotos[sumpKey]) newErrors[`sumpPhoto_${sumpKey}`] = 'Photo required for non-1A result'
      }
    })
    if (isNon1A(filterVesselSump)) {
      if (!(sumpNotes.filter || '').trim()) newErrors.sumpNote_filter = 'Explanation required for non-1A result'
      if (!sumpPhotos.filter) newErrors.sumpPhoto_filter = 'Photo required for non-1A result'
    }

    if (!dpUnavailable && dpPressure === '') {
      newErrors.dpPressure = 'DP pressure reading is required'
    }
    if (dpUnavailable && !(dpNote || '').trim()) {
      newErrors.dpNote = 'Explanation is required when reading is unavailable'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const now = new Date().toISOString()
    const today = new Date().toISOString().slice(0, 10)

    // Track edits to past records
    let editHistory = existingRecord?.editHistory || []
    if (existingRecord && date !== today) {
      editHistory = [...editHistory, { editedAt: now, editedBy: signature }]
    }

    const inspection = {
      id: existingRecord?.id || generateId(),
      facilityId,
      assetId: selectedAssetId,
      date,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
      editHistory,
      managerTrainer,
      checks,
      failNotes,
      failPhotos,
      tankSumps,
      filterVesselSump,
      sumpNotes,
      sumpPhotos,
      dpPressure: dpPressure !== '' ? Number(dpPressure) : null,
      dpUnavailable,
      dpNote: dpUnavailable ? dpNote : '',
      signature,
      comment,
    }
    saveDailyInspection(inspection)
    setExistingRecord(inspection)
    if (onSaved) onSaved()

    const settings = getSettings()
    const anyFail = Object.values(checks).some(v => v === false)
    if (anyFail && settings.emailRecipients.length > 0) {
      const url = buildDailyEmailUrl({ facility, inspection })
      if (url) {
        setEmailAlertUrl(url)
        return
      }
    }

    onClose()
  }


  const buildCurrentInspection = () => ({
    id: existingRecord?.id || generateId(),
    facilityId,
    assetId: selectedAssetId,
    date,
    createdAt: existingRecord?.createdAt,
    updatedAt: existingRecord?.updatedAt,
    managerTrainer,
    checks,
    failNotes,
    failPhotos,
    tankSumps,
    filterVesselSump,
    sumpNotes,
    sumpPhotos,
    dpPressure: dpPressure !== '' ? Number(dpPressure) : null,
    dpUnavailable,
    dpNote: dpUnavailable ? dpNote : '',
    signature,
    comment,
  })

  if (showExport) {
    const selectedAsset = assets.find(a => a.id === selectedAssetId)
    return (
      <DailyExportView
        inspection={buildCurrentInspection()}
        facility={facility}
        asset={selectedAsset}
        onClose={() => setShowExport(false)}
      />
    )
  }

  const [year, month, day] = date.split('-')
  const displayDate = new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const allChecked = Object.values(checks).every(v => v !== null)
  const allPass = allChecked && Object.values(checks).every(v => v === true)
  const selectedAsset = assets.find(a => a.id === selectedAssetId)

  return (
    <>
      {/* Overlay */}
      <div className="sheet-overlay animate-fade-in" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="bottom-sheet animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-white text-lg">Daily Inspection</h2>
            <p className="text-sm text-gray-400">{displayDate}</p>
            <p className="text-xs text-amber-500 mt-0.5">{facility?.name || 'No facility'}</p>
            {existingRecord?.updatedAt && (
              <p className="text-xs text-gray-600 mt-0.5">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="p-2 text-gray-400 hover:text-amber-400 transition-colors"
              title="Export / Print"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-6 pb-6">

            {/* Asset selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Inspecting
                <span className="text-red-400 ml-1">*</span>
              </label>
              {assets.length === 0 ? (
                <p className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-3 py-2">
                  No assets configured. Go to Settings → Facility to add tanks or trucks.
                </p>
              ) : (
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
                      {getDailyInspection(facilityId, asset.id, date) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {errors.asset && (
                <p className="text-xs text-red-400 mt-1">{errors.asset}</p>
              )}
            </div>

            {/* Manager/Trainer */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Manager / Trainer
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={managerTrainer}
                onChange={e => {
                  setManagerTrainer(e.target.value)
                  if (e.target.value.trim()) setErrors(prev => { const ne = { ...prev }; delete ne.managerTrainer; return ne })
                }}
                placeholder="Full name"
                className={`input-field ${errors.managerTrainer ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {errors.managerTrainer && (
                <p className="text-xs text-red-400 mt-1">{errors.managerTrainer}</p>
              )}
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">Inspection Items</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  !allChecked ? 'bg-gray-500/20 text-gray-400'
                    : allPass ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {Object.values(checks).filter(v => v === true).length}/{Object.values(checks).length} Pass
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(DAILY_CHECK_LABELS).map(([key, label]) => {
                  const val = checks[key] // null | true | false
                  const hasNoteError = !!errors[key]
                  return (
                    <div key={key}>
                      <div
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
                          val === null
                            ? 'bg-gray-800/50 border-gray-600'
                            : val === true
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'border-red-500/40'
                        }`}
                        style={val === false ? { background: 'rgba(239,68,68,0.08)' } : {}}
                      >
                        <span className="flex-1 text-sm text-gray-200">{label}</span>
                        <button
                          type="button"
                          onClick={() => toggleCheck(key)}
                          className={`relative w-14 h-7 rounded-full transition-all flex-shrink-0 ${
                            val === null ? 'bg-gray-600' : val === true ? 'bg-green-500' : 'bg-red-600'
                          }`}
                        >
                          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                            val === null ? 'left-1/2 -translate-x-1/2' : val === true ? 'right-0.5' : 'left-0.5'
                          }`} />
                          {val !== null && (
                            <span className={`absolute inset-0 flex items-center text-xs font-bold text-white ${
                              val ? 'justify-start pl-1.5' : 'justify-end pr-1.5'
                            }`}>
                              {val ? 'P' : 'F'}
                            </span>
                          )}
                        </button>
                      </div>

                      {val === false && (
                        <div className="mt-1 rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-3 space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              <span className="text-red-300">Failure Note</span>
                              <span className="text-red-400 ml-1">*</span>
                            </label>
                            <textarea
                              value={failNotes[key] || ''}
                              onChange={e => handleFailNoteChange(key, e.target.value)}
                              placeholder="Describe the issue..."
                              rows={2}
                              className={`input-field text-sm resize-none ${hasNoteError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                            />
                            {hasNoteError && (
                              <p className="text-xs text-red-400 mt-1">{errors[key]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Photo (optional)
                            </label>
                            {failPhotos[key] ? (
                              <div className="space-y-1">
                                <img
                                  src={failPhotos[key]}
                                  alt="Failure photo"
                                  className="w-full max-h-32 object-cover rounded-lg border border-gray-700"
                                />
                                <button
                                  type="button"
                                  onClick={() => setFailPhotos(prev => { const p = { ...prev }; delete p[key]; return p })}
                                  className="text-xs text-red-400 hover:text-red-300"
                                >
                                  Remove photo
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 cursor-pointer border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 transition-colors w-fit">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Take / Attach Photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (file) handlePhotoCapture(key, file)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {errors.checks && (
                <p className="text-xs text-red-400 mt-2">{errors.checks}</p>
              )}
            </div>

            {/* Tank Sump(s) */}
            {tankSumps.map((sump, idx) => {
              const sumpKey = `tank_${idx}`
              return (
                <div key={idx} className="card p-4">
                  <SumpCodePicker
                    label={tankSumps.length === 1 ? 'Tank Sump' : `Tank Sump ${idx + 1}`}
                    value={sump}
                    onChange={(val) => {
                      const updated = [...tankSumps]
                      updated[idx] = val
                      setTankSumps(updated)
                    }}
                  />
                  {isNon1A(sump) && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs text-amber-300 font-medium">Non-1A result — explanation and photo required</span>
                      </div>
                      <div>
                        <textarea
                          value={sumpNotes[sumpKey] || ''}
                          onChange={e => setSumpNotes(prev => ({ ...prev, [sumpKey]: e.target.value }))}
                          placeholder="Explain the non-1A reading..."
                          rows={2}
                          className={`input-field text-sm resize-none ${errors[`sumpNote_${sumpKey}`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        />
                        {errors[`sumpNote_${sumpKey}`] && (
                          <p className="text-xs text-red-400 mt-1">{errors[`sumpNote_${sumpKey}`]}</p>
                        )}
                      </div>
                      <div>
                        {sumpPhotos[sumpKey] ? (
                          <div className="space-y-1">
                            <img src={sumpPhotos[sumpKey]} alt="Sump photo" className="w-full max-h-32 object-cover rounded-lg border border-gray-700" />
                            <button type="button" onClick={() => setSumpPhotos(prev => { const p = { ...prev }; delete p[sumpKey]; return p })} className="text-xs text-red-400 hover:text-red-300">Remove photo</button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 cursor-pointer border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 transition-colors w-fit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Take / Attach Photo
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) compressPhoto(file).then(img => setSumpPhotos(prev => ({ ...prev, [sumpKey]: img }))); e.target.value = '' }} />
                          </label>
                        )}
                        {errors[`sumpPhoto_${sumpKey}`] && (
                          <p className="text-xs text-red-400 mt-1">{errors[`sumpPhoto_${sumpKey}`]}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Filter Vessel Sump */}
            <div className="card p-4">
              <SumpCodePicker
                label="Filter Vessel Sump"
                value={filterVesselSump}
                onChange={setFilterVesselSump}
              />
              {isNon1A(filterVesselSump) && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs text-amber-300 font-medium">Non-1A result — explanation and photo required</span>
                  </div>
                  <div>
                    <textarea
                      value={sumpNotes.filter || ''}
                      onChange={e => setSumpNotes(prev => ({ ...prev, filter: e.target.value }))}
                      placeholder="Explain the non-1A reading..."
                      rows={2}
                      className={`input-field text-sm resize-none ${errors.sumpNote_filter ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {errors.sumpNote_filter && (
                      <p className="text-xs text-red-400 mt-1">{errors.sumpNote_filter}</p>
                    )}
                  </div>
                  <div>
                    {sumpPhotos.filter ? (
                      <div className="space-y-1">
                        <img src={sumpPhotos.filter} alt="Sump photo" className="w-full max-h-32 object-cover rounded-lg border border-gray-700" />
                        <button type="button" onClick={() => setSumpPhotos(prev => { const p = { ...prev }; delete p.filter; return p })} className="text-xs text-red-400 hover:text-red-300">Remove photo</button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 cursor-pointer border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 transition-colors w-fit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Take / Attach Photo
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) compressPhoto(file).then(img => setSumpPhotos(prev => ({ ...prev, filter: img }))); e.target.value = '' }} />
                      </label>
                    )}
                    {errors.sumpPhoto_filter && (
                      <p className="text-xs text-red-400 mt-1">{errors.sumpPhoto_filter}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DP Pressure */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Differential Pressure (DP)
                <span className="text-gray-500 font-normal ml-1 text-xs">psi</span>
                <span className="text-red-400 ml-1">*</span>
              </label>
              {!dpUnavailable && (
                <input
                  type="number"
                  inputMode="decimal"
                  value={dpPressure}
                  onChange={e => {
                    setDpPressure(e.target.value)
                    if (errors.dpPressure) setErrors(prev => { const ne = { ...prev }; delete ne.dpPressure; return ne })
                  }}
                  placeholder="Enter pressure reading"
                  step="0.1"
                  min="0"
                  className={`input-field ${errors.dpPressure ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
              )}
              {!dpUnavailable && dpPressure !== '' && Number(dpPressure) > 10 && (
                <div className="mt-1.5 flex items-center gap-2 bg-amber-900/30 border border-amber-600/40 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs text-amber-300 font-medium">DP over 10 psi — verify reading and investigate</span>
                </div>
              )}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dpUnavailable}
                  onChange={e => {
                    setDpUnavailable(e.target.checked)
                    if (e.target.checked) {
                      setDpPressure('')
                      if (errors.dpPressure) setErrors(prev => { const ne = { ...prev }; delete ne.dpPressure; return ne })
                    } else {
                      setDpNote('')
                    }
                  }}
                  className="rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-400">Unable to obtain reading</span>
              </label>
              {dpUnavailable && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-600/40 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs text-amber-300 font-medium">DP reading unavailable — requires follow-up</span>
                  </div>
                  <textarea
                    value={dpNote}
                    onChange={e => {
                      setDpNote(e.target.value)
                      if (errors.dpNote) setErrors(prev => { const ne = { ...prev }; delete ne.dpNote; return ne })
                    }}
                    placeholder="Explain why the reading could not be obtained..."
                    rows={2}
                    className={`input-field text-sm resize-none ${errors.dpNote ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  {errors.dpNote && (
                    <p className="text-xs text-red-400">{errors.dpNote}</p>
                  )}
                </div>
              )}
              {errors.dpPressure && (
                <p className="text-xs text-red-400 mt-1">{errors.dpPressure}</p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Comments
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Any observations or issues..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Signature
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={signature}
                onChange={e => {
                  setSignature(e.target.value)
                  if (e.target.value.trim()) setErrors(prev => { const ne = { ...prev }; delete ne.signature; return ne })
                }}
                placeholder="Type full name as signature"
                className={`input-field ${errors.signature ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {errors.signature && (
                <p className="text-xs text-red-400 mt-1">{errors.signature}</p>
              )}
            </div>

          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900 safe-bottom">
          {emailAlertUrl && (
            <div className="mb-3 flex items-center justify-between bg-amber-900/30 border border-amber-600/40 rounded-xl px-3 py-2.5">
              <span className="text-sm text-amber-300 font-medium">Failures recorded</span>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.open(emailAlertUrl)
                  onClose()
                }}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Send Email Alert
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              {emailAlertUrl ? 'Skip & Close' : 'Cancel'}
            </button>
            {!emailAlertUrl && (
              <button onClick={handleSave} className="btn-primary flex-1">
                {existingRecord ? 'Update' : 'Save'} Inspection
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
