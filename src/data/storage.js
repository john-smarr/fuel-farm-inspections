// localStorage keys
const KEYS = {
  FACILITIES: 'p66_facilities',
  ACTIVE_FACILITY: 'p66_activeFacilityId',
  daily: (facilityId, date) => `p66_daily_${facilityId}_${date}`,
  monthly: (facilityId, yearMonth) => `p66_monthly_${facilityId}_${yearMonth}`,
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
  const key = KEYS.daily(inspection.facilityId, inspection.date)
  setJSON(key, inspection)
}

export function getDailyInspection(facilityId, date) {
  return getJSON(KEYS.daily(facilityId, date), null)
}

export function deleteDailyInspection(facilityId, date) {
  const key = KEYS.daily(facilityId, date)
  localStorage.removeItem(key)
}

export function getDailyInspectionsForMonth(facilityId, yearMonth) {
  // yearMonth = 'YYYY-MM'
  const prefix = `p66_daily_${facilityId}_${yearMonth}-`
  const result = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      const date = key.replace(`p66_daily_${facilityId}_`, '')
      const inspection = getJSON(key, null)
      if (inspection) {
        result[date] = inspection
      }
    }
  }
  return result
}

// ─── Monthly Inspections ─────────────────────────────────────────────────────

export function saveMonthlyInspection(inspection) {
  const key = KEYS.monthly(inspection.facilityId, inspection.yearMonth)
  setJSON(key, inspection)
}

export function getMonthlyInspection(facilityId, yearMonth) {
  return getJSON(KEYS.monthly(facilityId, yearMonth), null)
}

export function deleteMonthlyInspection(facilityId, yearMonth) {
  const key = KEYS.monthly(facilityId, yearMonth)
  localStorage.removeItem(key)
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export function getSettings() {
  return getJSON('p66_settings', { emailRecipients: [] })
}

export function saveSettings(settings) {
  setJSON('p66_settings', settings)
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
