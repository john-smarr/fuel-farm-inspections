import React from 'react'
import { getFormsForAsset } from '../data/formDefinitions'

export default function FormPicker({ facility, asset, date, onSelectLegacyDaily, onSelectLegacyMonthly, onSelectGenericForm, onClose }) {
  const availableForms = getFormsForAsset(asset)
  const dailyForms = availableForms.filter(f => f.frequency === 'daily')
  const monthlyForms = availableForms.filter(f => f.frequency === 'monthly')

  return (
    <>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} />
      <div className="bottom-sheet animate-slide-up" style={{ maxHeight: '70vh' }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-bold text-white text-lg">Select Inspection</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              asset.type === 'tank' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {asset.type === 'tank' ? 'TANK' : 'TRUCK'}
            </span>
            <span className="text-sm text-gray-300">{asset.name}</span>
            {asset.fuelType && (
              <span className="text-xs text-gray-500">· {asset.fuelType}</span>
            )}
          </div>
          <p className="text-xs text-amber-500 mt-0.5">{facility?.name}</p>
        </div>

        {/* Form options */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-4">

            {/* Daily forms */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Daily</h3>
              <div className="space-y-2">
                <button
                  onClick={onSelectLegacyDaily}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-500 transition-all"
                >
                  <div className="font-semibold text-white text-sm">Daily Inspection</div>
                  <p className="text-xs text-gray-500 mt-0.5">Checklist, sump codes, DP pressure</p>
                </button>
                {dailyForms.map(form => (
                  <button
                    key={form.id}
                    onClick={() => onSelectGenericForm(form)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-500 transition-all"
                  >
                    <div className="font-semibold text-white text-sm">{form.label}</div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {form.sections.length} sections · {form.sections.reduce((n, s) => n + s.fields.length, 0)} fields
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly forms */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly</h3>
              <div className="space-y-2">
                <button
                  onClick={onSelectLegacyMonthly}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-500 transition-all"
                >
                  <div className="font-semibold text-white text-sm">General Monthly Inspection</div>
                  <p className="text-xs text-gray-500 mt-0.5">Membrane filter, anti-icing, nozzles, free water, etc.</p>
                </button>
                {monthlyForms.map(form => (
                  <button
                    key={form.id}
                    onClick={() => onSelectGenericForm(form)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-500 transition-all"
                  >
                    <div className="font-semibold text-white text-sm">{form.label}</div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {form.sections.length} sections · {form.sections.reduce((n, s) => n + s.fields.length, 0)} fields
                    </p>
                  </button>
                ))}
                {monthlyForms.length === 0 && (
                  <p className="text-xs text-gray-600 italic px-1">
                    {asset.fuelType
                      ? 'No equipment-specific monthly form for this fuel type'
                      : 'Set a fuel type on this asset to see equipment-specific forms'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel */}
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900 safe-bottom">
          <button onClick={onClose} className="btn-secondary w-full">Cancel</button>
        </div>
      </div>
    </>
  )
}
