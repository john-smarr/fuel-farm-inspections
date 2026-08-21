import React from 'react'
import { DAILY_CHECK_LABELS, MONTHLY_ITEMS, MONTHLY_RATINGS } from '../data/constants'

function isCapacitor() {
  return typeof window !== 'undefined' && !!window.Capacitor
}

// ─── Daily Export ────────────────────────────────────────────────────────────

export function DailyExportView({ inspection, facility, onClose }) {
  const handlePrint = () => {
    if (!isCapacitor()) {
      window.print()
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
      {/* Toolbar - hidden on print */}
      <div className="no-print sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-300 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
        <h2 className="text-sm font-semibold text-white">Daily Inspection Report</h2>
        {!isCapacitor() && (
          <button onClick={handlePrint} className="btn-primary text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        )}
        {isCapacitor() && <div className="w-12" />}
      </div>

      {/* Report content */}
      <div className="p-4 max-w-2xl mx-auto pb-8">
        <div className="bg-white text-black rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-amber-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-gray-900">PHILLIPS 66</h1>
                <p className="text-sm font-semibold text-gray-800">AVIATION FUEL FARM</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-800">DAILY INSPECTION</p>
                <p className="text-sm font-bold text-gray-900">{inspection.date}</p>
              </div>
            </div>
          </div>

          {/* Facility info */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold">Facility</span>
                <p className="font-semibold text-gray-900">{facility?.name || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold">Facility ID</span>
                <p className="font-semibold font-mono text-gray-900">{facility?.facilityId || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold">Manager / Trainer</span>
                <p className="font-semibold text-gray-900">{inspection.managerTrainer || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold">Signature</span>
                <p className="font-semibold text-gray-900">{inspection.signature || '—'}</p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Inspection Checklist</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 text-xs text-gray-500 font-semibold">Item</th>
                  <th className="text-center pb-2 text-xs text-gray-500 font-semibold w-20">Result</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DAILY_CHECK_LABELS).map(([key, label]) => {
                  const pass = inspection.checks?.[key]
                  return (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{label}</td>
                      <td className="py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          pass
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {pass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Sump Codes & DP */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Readings</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Tank Sump</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                  {inspection.tankSump?.solidsCode || '?'}-{inspection.tankSump?.waterCode || '?'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Filter Vessel Sump</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                  {inspection.filterVesselSump?.solidsCode || '?'}-{inspection.filterVesselSump?.waterCode || '?'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">DP Pressure</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                  {inspection.dpPressure != null && inspection.dpPressure !== '' ? inspection.dpPressure : '—'}
                  {inspection.dpPressure != null && inspection.dpPressure !== '' && <span className="text-sm font-normal ml-1">psi</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Comments */}
          {inspection.comment && (
            <div className="px-6 py-3 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Comments</span>
              <p className="text-sm text-gray-800">{inspection.comment}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-800 text-gray-400 text-xs">
            <p>Phillips 66 Aviation Fuel Quality Program · Confidential</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Monthly Export ──────────────────────────────────────────────────────────

export function MonthlyExportView({ inspection, facility, onClose }) {
  const handlePrint = () => {
    if (!isCapacitor()) {
      window.print()
    }
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'S': return 'bg-green-100 text-green-700'
      case 'C': return 'bg-yellow-100 text-yellow-800'
      case 'N/U': return 'bg-gray-100 text-gray-600'
      case 'N/A': return 'bg-blue-50 text-blue-600'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
      {/* Toolbar */}
      <div className="no-print sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-300 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
        <h2 className="text-sm font-semibold text-white">Monthly Inspection Report</h2>
        {!isCapacitor() && (
          <button onClick={handlePrint} className="btn-primary text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        )}
        {isCapacitor() && <div className="w-12" />}
      </div>

      {/* Report */}
      <div className="p-4 max-w-3xl mx-auto pb-8">
        <div className="bg-white text-black rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-amber-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-gray-900">PHILLIPS 66</h1>
                <p className="text-sm font-semibold text-gray-800">AVIATION FUEL FARM</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-800">MONTHLY INSPECTION</p>
                <p className="text-sm font-bold text-gray-900">{inspection.yearMonth}</p>
              </div>
            </div>
          </div>

          {/* Facility info */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold">Facility</span>
                <p className="font-semibold text-gray-900">{facility?.name || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase font-semibold">Facility ID</span>
                <p className="font-semibold font-mono text-gray-900">{facility?.facilityId || '—'}</p>
              </div>
            </div>
          </div>

          {/* Rating legend */}
          <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-3 flex-wrap text-xs">
              <span className="font-semibold text-gray-500">Ratings:</span>
              {MONTHLY_RATINGS.map(r => (
                <span key={r.value}>
                  <span className={`font-bold px-1 py-0.5 rounded ${getRatingColor(r.value)}`}>{r.value}</span>
                  <span className="text-gray-500 ml-1">{r.title}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left pb-2 text-xs text-gray-500 font-semibold">Inspection Item</th>
                  <th className="text-center pb-2 text-xs text-gray-500 font-semibold w-14">Rating</th>
                  <th className="text-center pb-2 text-xs text-gray-500 font-semibold w-16">Reading</th>
                  <th className="text-center pb-2 text-xs text-gray-500 font-semibold w-24">Date</th>
                  <th className="text-left pb-2 text-xs text-gray-500 font-semibold">Signature</th>
                  <th className="text-left pb-2 text-xs text-gray-500 font-semibold">Maint. Notes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(MONTHLY_ITEMS).map(([key, itemDef]) => {
                  const item = inspection.items?.[key] || {}
                  return (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-gray-900">{itemDef.label}</div>
                        <div className="text-xs text-gray-400">{itemDef.description}</div>
                      </td>
                      <td className="py-2 text-center">
                        {item.rating ? (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getRatingColor(item.rating)}`}>
                            {item.rating}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2 text-center font-mono text-gray-700">
                        {itemDef.hasNumeric && item.numericValue != null
                          ? `${item.numericValue} ${itemDef.numericUnit}`
                          : '—'}
                      </td>
                      <td className="py-2 text-center text-xs text-gray-600">{item.date || '—'}</td>
                      <td className="py-2 text-xs text-gray-600">{item.signature || '—'}</td>
                      <td className="py-2 text-xs text-gray-600">{item.maintenanceActionNotes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-800 text-gray-400 text-xs">
            <p>Phillips 66 Aviation Fuel Quality Program · Confidential</p>
          </div>
        </div>
      </div>
    </div>
  )
}
