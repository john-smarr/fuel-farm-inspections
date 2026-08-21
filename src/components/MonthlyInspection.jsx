import React, { useState, useEffect } from 'react'
import { MONTHLY_ITEMS, MONTHLY_RATINGS } from '../data/constants'
import { getMonthlyInspection, saveMonthlyInspection, generateId, getSettings } from '../data/storage'
import { buildMonthlyEmailUrl } from '../utils/email'
import { MonthlyExportView } from './ExportView'

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

export default function MonthlyInspection({ facilityId, facility }) {
  const [yearMonth, setYearMonth] = useState(getTodayYearMonth())
  const [items, setItems] = useState(buildDefaultItems())
  const [saved, setSaved] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saved'
  const [errors, setErrors] = useState({})
  const [emailAlertUrl, setEmailAlertUrl] = useState(null)

  const loadData = () => {
    if (!facilityId) return
    const existing = getMonthlyInspection(facilityId, yearMonth)
    if (existing?.items) {
      // Merge with defaults in case new keys were added
      const merged = buildDefaultItems()
      Object.keys(merged).forEach(key => {
        if (existing.items[key]) {
          merged[key] = { ...merged[key], ...existing.items[key] }
        }
      })
      setItems(merged)
      setSaved(true)
    } else {
      setItems(buildDefaultItems())
      setSaved(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [facilityId, yearMonth])

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
    if (!facilityId) return

    // Validate: 'C' rated items must have maintenanceActionNotes
    const newErrors = {}
    Object.entries(items).forEach(([key, item]) => {
      if (item.rating === 'C' && !(item.maintenanceActionNotes || '').trim()) {
        newErrors[key] = 'Notes are required for items rated C'
      }
    })
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const existingRecord = getMonthlyInspection(facilityId, yearMonth)
    const inspection = {
      id: existingRecord?.id || generateId(),
      facilityId,
      yearMonth,
      items,
    }
    saveMonthlyInspection(inspection)
    setSaved(true)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2500)

    // Offer email alert if any 'C' items and recipients configured
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
    id: generateId(),
    facilityId,
    yearMonth,
    items,
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
    return (
      <MonthlyExportView
        inspection={handleExportInspection()}
        facility={facility}
        onClose={() => setShowExport(false)}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 max-w-lg mx-auto pb-6">
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
      </div>
    </div>
  )
}
