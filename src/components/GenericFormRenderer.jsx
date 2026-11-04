import React, { useState } from 'react'
import { saveFormData, getFormData, generateId } from '../data/storage'
import { compressPhoto } from '../utils/photo'
import SumpCodePicker from './SumpCodePicker'

// ─── Field Renderers ────────────────────────────────────────────────────────

function YesNoField({ field, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-200 flex-1">{field.label}</span>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            value === true
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            value === false
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          No
        </button>
      </div>
    </div>
  )
}

function ChoiceField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-200 mb-1.5">{field.label}</label>
      <div className="flex flex-wrap gap-1.5">
        {field.options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              value === opt
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-200 mb-1.5">{field.label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        className="input-field text-sm"
      />
    </div>
  )
}

function NumberField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-200 mb-1.5">
        {field.label}
        {field.unit && <span className="text-gray-500 font-normal ml-1 text-xs">{field.unit}</span>}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        step={field.step || 'any'}
        min={field.min}
        max={field.max}
        className="input-field text-sm"
      />
    </div>
  )
}

function DateField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-200 mb-1.5">{field.label}</label>
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="input-field text-sm"
      />
    </div>
  )
}

function SumpCodeField({ field, value, onChange }) {
  return (
    <SumpCodePicker
      label={field.label}
      value={value || { solidsCode: null, waterCode: null }}
      onChange={onChange}
    />
  )
}

function PhotoField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-200 mb-1.5">{field.label}</label>
      {value ? (
        <div className="space-y-1">
          <img src={value} alt="Captured" className="w-full max-h-32 object-cover rounded-lg border border-gray-700" />
          <button type="button" onClick={() => onChange(null)} className="text-xs text-red-400 hover:text-red-300">
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
              if (file) compressPhoto(file).then(img => onChange(img))
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}

function CounterField({ field, value, onChange }) {
  const val = value ?? 0
  const min = field.min ?? 0
  const max = field.max ?? 99
  return (
    <div>
      <label className="block text-sm text-gray-200 mb-1.5">{field.label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, val - 1))}
          disabled={val <= min}
          className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-700 disabled:opacity-30 transition-colors"
        >
          −
        </button>
        <span className="text-xl font-bold text-amber-400 font-mono w-8 text-center">{val}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, val + 1))}
          disabled={val >= max}
          className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-700 disabled:opacity-30 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Field Dispatcher ───────────────────────────────────────────────────────

function FormField({ field, value, onChange }) {
  switch (field.type) {
    case 'yesno': return <YesNoField field={field} value={value} onChange={onChange} />
    case 'choice': return <ChoiceField field={field} value={value} onChange={onChange} />
    case 'text': return <TextField field={field} value={value} onChange={onChange} />
    case 'number': return <NumberField field={field} value={value} onChange={onChange} />
    case 'date': return <DateField field={field} value={value} onChange={onChange} />
    case 'sumpCode': return <SumpCodeField field={field} value={value} onChange={onChange} />
    case 'photo': return <PhotoField field={field} value={value} onChange={onChange} />
    case 'counter': return <CounterField field={field} value={value} onChange={onChange} />
    default: return <p className="text-xs text-red-400">Unknown field type: {field.type}</p>
  }
}

// ─── Timestamp formatter ────────────────────────────────────────────────────

function formatTimestamp(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// ─── Main Form Renderer ─────────────────────────────────────────────────────

export default function GenericFormRenderer({ formDefinition, facilityId, facility, asset, datePart, onClose, onSaved }) {
  const existing = getFormData(formDefinition.id, facilityId, asset?.id, datePart)

  const [formData, setFormData] = useState(existing?.values || {})
  const [signature, setSignature] = useState(existing?.signature || '')
  const [comment, setComment] = useState(existing?.comment || '')
  const [errors, setErrors] = useState({})
  const [existingRecord, setExistingRecord] = useState(existing)

  const updateField = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) setErrors(prev => { const ne = { ...prev }; delete ne[fieldId]; return ne })
  }

  const handleSave = () => {
    const newErrors = {}
    if (!signature.trim()) newErrors.signature = 'Signature is required'

    // Validate required fields
    formDefinition.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && (formData[field.id] === undefined || formData[field.id] === null || formData[field.id] === '')) {
          newErrors[field.id] = `${field.label} is required`
        }
      })
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const now = new Date().toISOString()

    let editHistory = existingRecord?.editHistory || []
    if (existingRecord) {
      editHistory = [...editHistory, { editedAt: now, editedBy: signature }]
    }

    const record = {
      id: existingRecord?.id || generateId(),
      formId: formDefinition.id,
      facilityId,
      assetId: asset?.id,
      datePart,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
      editHistory,
      values: formData,
      signature,
      comment,
    }
    saveFormData(formDefinition.id, record)
    setExistingRecord(record)
    if (onSaved) onSaved()
    onClose()
  }

  const isMonthly = formDefinition.frequency === 'monthly'
  const displayDate = isMonthly
    ? (() => {
        const [y, m] = datePart.split('-')
        return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      })()
    : (() => {
        const [y, m, d] = datePart.split('-')
        return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      })()

  return (
    <>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} />
      <div className="bottom-sheet animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-white text-lg">{formDefinition.label}</h2>
            <p className="text-sm text-gray-400">{displayDate}</p>
            <p className="text-xs text-amber-500 mt-0.5">{facility?.name || 'No facility'}</p>
            {asset && (
              <p className="text-xs text-gray-500 mt-0.5">{asset.name}{asset.fuelType ? ` · ${asset.fuelType}` : ''}</p>
            )}
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
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-6 pb-6">
            {formDefinition.sections.map(section => (
              <div key={section.id}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{section.label}</h3>
                <div className="card p-4 space-y-4">
                  {section.fields.map(field => (
                    <div key={field.id}>
                      <FormField
                        field={field}
                        value={formData[field.id]}
                        onChange={val => updateField(field.id, val)}
                      />
                      {errors[field.id] && (
                        <p className="text-xs text-red-400 mt-1">{errors[field.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Comments</label>
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
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1">
              {existingRecord ? 'Update' : 'Save'} Inspection
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
