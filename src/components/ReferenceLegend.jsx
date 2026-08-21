import React from 'react'
import { SOLIDS_CODES, WATER_CODES, FUEL_COLOR_GUIDE } from '../data/constants'

export default function ReferenceLegend({ onClose }) {
  return (
    <div className="bg-gray-850 rounded-xl border border-gray-600 overflow-hidden" style={{ background: '#1a2234' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">Reference Legend</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Solids Codes */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Solids Codes</h4>
          <div className="space-y-1">
            {Object.entries(SOLIDS_CODES).map(([code, info]) => (
              <div key={code} className="flex items-center gap-3">
                <span className="w-7 h-7 flex items-center justify-center rounded-md bg-amber-500 text-gray-900 text-xs font-bold flex-shrink-0">
                  {code}
                </span>
                <span className="text-sm text-gray-300">{info.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700" />

        {/* Water Codes */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Water Codes</h4>
          <div className="space-y-1">
            {Object.entries(WATER_CODES).map(([code, info]) => (
              <div key={code} className="flex items-center gap-3">
                <span className="w-7 h-7 flex items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                  {code}
                </span>
                <span className="text-sm text-gray-300">{info.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700" />

        {/* Fuel Color Guide */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fuel Color Guide</h4>
          <div className="space-y-2">
            {FUEL_COLOR_GUIDE.map((item) => (
              <div key={item.fuel} className="flex items-start gap-3 bg-gray-800 rounded-lg p-2">
                <div className={`w-7 h-7 rounded-md flex-shrink-0 border border-gray-600 ${item.colorClass}`} />
                <div>
                  <div className="text-sm font-medium text-gray-200">{item.fuel}</div>
                  <div className="text-xs text-gray-400">{item.color}</div>
                  <div className="text-xs text-yellow-400 mt-0.5">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
