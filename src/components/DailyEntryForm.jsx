import React, { useState } from 'react'
import { DAILY_CHECK_LABELS } from '../data/constants'
import { saveDailyInspection, getDailyInspection, deleteDailyInspection, generateId, getSettings } from '../data/storage'
import { buildDailyEmailUrl } from '../utils/email'
import SumpCodePicker from './SumpCodePicker'
import { DailyExportView } from './ExportView'

const DEFAULT_CHECKS = {
  generalHousekeeping: true,
  securityFireSafety: true,
  fuelLeaks: true,
  bondingCablesClamps: true,
  fireExtinguishers: true,
  wasteFuelTanks: true,
  hosesSwivelsNozzles: true,
}

const DEFAULT_SUMP = { solidsCode: null, waterCode: null }

async function compressPhoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function DailyEntryForm({ date, facilityId, facility, onClose, onSaved }) {
  const existing = getDailyInspection(facilityId, date)

  const [managerTrainer, setManagerTrainer] = useState(existing?.managerTrainer || '')
  const [checks, setChecks] = useState(existing?.checks || { ...DEFAULT_CHECKS })
  const [failNotes, setFailNotes] = useState(existing?.failNotes || {})
  const [failPhotos, setFailPhotos] = useState(existing?.failPhotos || {})
  const [tankSump, setTankSump] = useState(existing?.tankSump || { ...DEFAULT_SUMP })
  const [filterVesselSump, setFilterVesselSump] = useState(existing?.filterVesselSump || { ...DEFAULT_SUMP })
  const [dpPressure, setDpPressure] = useState(existing?.dpPressure ?? '')
  const [comment, setComment] = useState(existing?.comment || '')
  const [signature, setSignature] = useState(existing?.signature || '')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [errors, setErrors] = useState({})
  const [emailAlertUrl, setEmailAlertUrl] = useState(null)

  const toggleCheck = (key) => {
    setChecks(prev => {
      const next = { ...prev, [key]: !prev[key] }
      // If toggled back to pass, clear its fail note/photo and any error
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

    if (!managerTrainer.trim()) newErrors.managerTrainer = 'Manager / Trainer name is required'
    if (!signature.trim()) newErrors.signature = 'Signature is required'

    // Every failed check needs a note
    Object.entries(checks).forEach(([key, pass]) => {
      if (!pass && !(failNotes[key] || '').trim()) {
        newErrors[key] = 'A note is required for failed items'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const inspection = {
      id: existing?.id || generateId(),
      facilityId,
      date,
      managerTrainer,
      checks,
      failNotes,
      failPhotos,
      tankSump,
      filterVesselSump,
      dpPressure: dpPressure !== '' ? Number(dpPressure) : null,
      signature,
      comment,
    }
    saveDailyInspection(inspection)
    if (onSaved) onSaved()

    // Offer email alert if there are failures and recipients configured
    const settings = getSettings()
    const anyFail = Object.values(checks).some(v => !v)
    if (anyFail && settings.emailRecipients.length > 0) {
      const url = buildDailyEmailUrl({ facility, inspection })
      if (url) {
        setEmailAlertUrl(url)
        return // Stay open to show the email prompt
      }
    }

    onClose()
  }

  const handleDelete = () => {
    deleteDailyInspection(facilityId, date)
    if (onSaved) onSaved()
    onClose()
  }

  const handleExportInspection = () => {
    return {
      id: existing?.id || generateId(),
      facilityId,
      date,
      managerTrainer,
      checks,
      failNotes,
      failPhotos,
      tankSump,
      filterVesselSump,
      dpPressure: dpPressure !== '' ? Number(dpPressure) : null,
      signature,
      comment,
    }
  }

  if (showExport) {
    return (
      <DailyExportView
        inspection={handleExportInspection()}
        facility={facility}
        onClose={() => setShowExport(false)}
      />
    )
  }

  // Format date for display
  const [year, month, day] = date.split('-')
  const displayDate = new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const allPass = Object.values(checks).every(Boolean)

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
                  allPass ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {Object.values(checks).filter(Boolean).length}/{Object.values(checks).length} Pass
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(DAILY_CHECK_LABELS).map(([key, label]) => {
                  const pass = checks[key]
                  const hasNoteError = !!errors[key]
                  return (
                    <div key={key}>
                      {/* Check row */}
                      <div
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
                          pass
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'border-red-500/40'
                        }`}
                        style={pass ? {} : { background: 'rgba(239,68,68,0.08)' }}
                      >
                        <span className="flex-1 text-sm text-gray-200">{label}</span>
                        <button
                          type="button"
                          onClick={() => toggleCheck(key)}
                          className={`relative w-14 h-7 rounded-full transition-all flex-shrink-0 ${
                            pass ? 'bg-green-500' : 'bg-red-600'
                          }`}
                        >
                          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                            pass ? 'right-0.5' : 'left-0.5'
                          }`} />
                          <span className={`absolute inset-0 flex items-center text-xs font-bold text-white ${
                            pass ? 'justify-start pl-1.5' : 'justify-end pr-1.5'
                          }`}>
                            {pass ? 'P' : 'F'}
                          </span>
                        </button>
                      </div>

                      {/* Fail note expansion */}
                      {!pass && (
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
            </div>

            {/* Tank Sump */}
            <div className="card p-4">
              <SumpCodePicker
                label="Tank Sump"
                value={tankSump}
                onChange={setTankSump}
              />
            </div>

            {/* Filter Vessel Sump */}
            <div className="card p-4">
              <SumpCodePicker
                label="Filter Vessel Sump"
                value={filterVesselSump}
                onChange={setFilterVesselSump}
              />
            </div>

            {/* DP Pressure */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Differential Pressure (DP)
                <span className="text-gray-500 font-normal ml-1 text-xs">psi</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={dpPressure}
                onChange={e => setDpPressure(e.target.value)}
                placeholder="Enter pressure reading"
                step="0.1"
                min="0"
                className="input-field"
              />
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

            {/* Delete button (existing entries) */}
            {existing && (
              <div>
                {showConfirmDelete ? (
                  <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-red-300">Delete this inspection record? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={handleDelete} className="btn-danger flex-1 text-sm">
                        Delete Record
                      </button>
                      <button onClick={() => setShowConfirmDelete(false)} className="btn-secondary flex-1 text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="w-full text-center text-sm text-red-400 hover:text-red-300 py-2 border border-red-800 rounded-lg hover:border-red-600 transition-colors"
                  >
                    Delete This Record
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900 safe-bottom">
          {/* Email alert prompt */}
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
            <button onClick={emailAlertUrl ? onClose : onClose} className="btn-secondary flex-1">
              {emailAlertUrl ? 'Skip & Close' : 'Cancel'}
            </button>
            {!emailAlertUrl && (
              <button onClick={handleSave} className="btn-primary flex-1">
                {existing ? 'Update' : 'Save'} Inspection
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
