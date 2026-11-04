// localStorage keys
const KEYS = {
  FACILITIES: 'ffi_facilities',
  ACTIVE_FACILITY: 'ffi_activeFacilityId',
  daily: (facilityId, assetId, date) => `ffi_daily_${facilityId}_${assetId}_${date}`,
  monthly: (facilityId, assetId, yearMonth) => `ffi_monthly_${facilityId}_${assetId}_${yearMonth}`,
}

// Generic helpers
function getJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Facilities ────────────────────────────────────────────────────────────

export function getFacilities() {
  return getJSON(KEYS.FACILITIES, [])
}

export function saveFacility(facility) {
  const facilities = getFacilities()
  const idx = facilities.findIndex(f => f.id === facility.id)
  if (idx >= 0) {
    facilities[idx] = facility
  } else {
    facilities.push(facility)
  }
  setJSON(KEYS.FACILITIES, facilities)
}

export function deleteFacility(id) {
  const facilities = getFacilities().filter(f => f.id !== id)
  setJSON(KEYS.FACILITIES, facilities)
  // Clear active if deleted
  if (getActiveFacilityId() === id) {
    localStorage.removeItem(KEYS.ACTIVE_FACILITY)
  }
}

// ─── Active Facility ────────────────────────────────────────────────────────

export function getActiveFacilityId() {
  return localStorage.getItem(KEYS.ACTIVE_FACILITY) || null
}

export function setActiveFacilityId(id) {
  if (id) {
    localStorage.setItem(KEYS.ACTIVE_FACILITY, id)
  } else {
    localStorage.removeItem(KEYS.ACTIVE_FACILITY)
  }
}

// ─── Daily Inspections ──────────────────────────────────────────────────────

export function saveDailyInspection(inspection) {
  const key = KEYS.daily(inspection.facilityId, inspection.assetId, inspection.date)
  setJSON(key, inspection)
}

export function getDailyInspection(facilityId, assetId, date) {
  return getJSON(KEYS.daily(facilityId, assetId, date), null)
}

export function deleteDailyInspection(facilityId, assetId, date) {
  localStorage.removeItem(KEYS.daily(facilityId, assetId, date))
}

// Returns { date: [inspection, ...] } for all assets on each day
export function getDailyInspectionsForMonth(facilityId, yearMonth) {
  const prefix = `ffi_daily_${facilityId}_`
  const result = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) {
      // Key format: ffi_daily_{facilityId}_{assetId}_{YYYY-MM-DD}
      const datePart = key.slice(-10) // last 10 chars = YYYY-MM-DD
      if (datePart.startsWith(yearMonth)) {
        const inspection = getJSON(key, null)
        if (inspection) {
          if (!result[datePart]) result[datePart] = []
          result[datePart].push(inspection)
        }
      }
    }
  }
  return result
}

// ─── Monthly Inspections ─────────────────────────────────────────────────────

export function saveMonthlyInspection(inspection) {
  const key = KEYS.monthly(inspection.facilityId, inspection.assetId, inspection.yearMonth)
  setJSON(key, inspection)
}

export function getMonthlyInspection(facilityId, assetId, yearMonth) {
  return getJSON(KEYS.monthly(facilityId, assetId, yearMonth), null)
}

export function deleteMonthlyInspection(facilityId, assetId, yearMonth) {
  localStorage.removeItem(KEYS.monthly(facilityId, assetId, yearMonth))
}

// ─── Generic Form Data ───────────────────────────────────────────────────────
// Key pattern: ffi_{formId}_{facilityId}_{assetId}_{datePart}
// datePart is YYYY-MM-DD for daily forms, YYYY-MM for monthly forms

function formKey(formId, facilityId, assetId, datePart) {
  return `ffi_${formId}_${facilityId}_${assetId}_${datePart}`
}

export function saveFormData(formId, data) {
  const key = formKey(formId, data.facilityId, data.assetId, data.datePart)
  setJSON(key, data)
}

export function getFormData(formId, facilityId, assetId, datePart) {
  return getJSON(formKey(formId, facilityId, assetId, datePart), null)
}

export function deleteFormData(formId, facilityId, assetId, datePart) {
  localStorage.removeItem(formKey(formId, facilityId, assetId, datePart))
}

// Returns { datePart: data } for a given form+facility in a month
export function getFormDataForMonth(formId, facilityId, yearMonth) {
  const prefix = `ffi_${formId}_${facilityId}_`
  const result = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) {
      const data = getJSON(key, null)
      if (data && data.datePart && data.datePart.startsWith(yearMonth)) {
        result[data.datePart] = data
      }
    }
  }
  return result
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export function getSettings() {
  return getJSON('ffi_settings', { emailRecipients: [] })
}

export function saveSettings(settings) {
  setJSON('ffi_settings', settings)
}

// ─── UUID helper ─────────────────────────────────────────────────────────────

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
