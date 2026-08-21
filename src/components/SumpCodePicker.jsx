import React, { useState } from 'react'
import { SOLIDS_CODES, WATER_CODES } from '../data/constants'
import ReferenceLegend from './ReferenceLegend'

export default function SumpCodePicker({ label, value, onChange }) {
  const [showLegend, setShowLegend] = useState(false)

  const solidsCodes = Object.keys(SOLIDS_CODES)
  const waterCodes = Object.keys(WATER_CODES)

  const handleSolids = (code) => {
    onChange({ ...value, solidsCode: Number(code) })
  }

  const handleWater = (code) => {
    onChange({ ...value, waterCode: code })
  }

  const combinedCode = value.solidsCode && value.waterCode
    ? `${value.solidsCode}-${value.waterCode}`
    : value.solidsCode
    ? `${value.solidsCode}-?`
    : value.waterCode
    ? `?-${value.waterCode}`
    : '—'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-amber-400 font-mono">{combinedCode}</span>
          <button
            type="button"
            onClick={() => setShowLegend(v => !v)}
            className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 hover:text-amber-400 hover:bg-gray-600 flex items-center justify-center text-xs font-bold transition-colors"
            aria-label="Show reference legend"
          >
            ?
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Solids Codes */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1.5 font-medium">Solids</div>
          <div className="grid grid-cols-4 gap-1.5">
            {solidsCodes.map(code => {
              const numCode = Number(code)
              const selected = value.solidsCode === numCode
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSolids(code)}
                  className={`h-9 rounded-lg text-sm font-bold transition-all ${
                    selected
                      ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                  }`}
                >
                  {code}
                </button>
              )
            })}
          </div>
        </div>

        {/* Water Codes */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1.5 font-medium">Water</div>
          <div className="grid grid-cols-5 gap-1">
            {waterCodes.map(code => {
              const selected = value.waterCode === code
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleWater(code)}
                  className={`h-9 rounded-lg text-sm font-bold transition-all ${
                    selected
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                  }`}
                >
                  {code}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-2">
          <ReferenceLegend onClose={() => setShowLegend(false)} />
        </div>
      )}
    </div>
  )
}
