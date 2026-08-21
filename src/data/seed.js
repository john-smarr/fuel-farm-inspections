import { saveFacility, saveDailyInspection, saveMonthlyInspection, setActiveFacilityId } from './storage'

const FACILITY = {
  id: 'demo-pdx-01',
  facilityId: 'PDX-01',
  name: 'Portland International Airport',
}

const INSPECTORS = ['M. Rodriguez', 'J. Callahan', 'T. Okafor', 'S. Nguyen']

function pad(n) { return String(n).padStart(2, '0') }

function dateStr(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`
}

// Build daily inspections for the current month up through yesterday
function buildDailyInspections() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = now.getDate()
  const inspections = []

  for (let day = 1; day < today; day++) {
    const date = dateStr(year, month, day)
    const inspector = INSPECTORS[day % INSPECTORS.length]

    // Most days all pass; a few days have failures
    const hasFailure = [3, 7, 12, 18].includes(day)
    const failKey = ['fuelLeaks', 'fireExtinguishers', 'bondingCablesClamps', 'wasteFuelTanks'][
      [3, 7, 12, 18].indexOf(day)
    ]

    const checks = {
      generalHousekeeping: true,
      securityFireSafety: true,
      fuelLeaks: true,
      bondingCablesClamps: true,
      fireExtinguishers: true,
      wasteFuelTanks: true,
      hosesSwivelsNozzles: true,
    }

    const failNotes = {}
    if (hasFailure && failKey) {
      checks[failKey] = false
      const notesByKey = {
        fuelLeaks: 'Minor seep at south tank coupling. Tagged for maintenance.',
        fireExtinguishers: 'Extinguisher #3 inspection tag expired. Replacement ordered.',
        bondingCablesClamps: 'Clamp B-7 showing corrosion. Scheduled for replacement.',
        wasteFuelTanks: 'Waste tank at 90% capacity. Arranged pickup for next day.',
      }
      failNotes[failKey] = notesByKey[failKey]
    }

    // Vary sump codes realistically — mostly 1-A, occasional 2-B or 1-B
    const solidsOptions = [1, 1, 1, 1, 2, 1, 1, 1, 2, 1]
    const waterOptions = ['A', 'A', 'A', 'B', 'A', 'A', 'A', 'A', 'B', 'A']
    const idx = day % solidsOptions.length

    inspections.push({
      id: `demo-daily-${date}`,
      facilityId: FACILITY.id,
      date,
      managerTrainer: inspector,
      checks,
      failNotes,
      failPhotos: {},
      tankSump: { solidsCode: solidsOptions[idx], waterCode: waterOptions[idx] },
      filterVesselSump: { solidsCode: 1, waterCode: 'A' },
      dpPressure: Number((8 + (day % 5) * 0.4).toFixed(1)),
      signature: inspector,
      comment: hasFailure ? 'Maintenance team notified. Follow-up scheduled.' : '',
    })
  }
  return inspections
}

// Build monthly inspection for current month
function buildMonthlyInspection() {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
  const inspector = 'M. Rodriguez'
  const dateVal = dateStr(now.getFullYear(), now.getMonth() + 1, 5)

  return {
    id: 'demo-monthly-01',
    facilityId: FACILITY.id,
    yearMonth,
    items: {
      membraneFilterTest: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: null,
      },
      antiIcingAdditive: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: 0.12,
      },
      nozzleScreens: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: null,
      },
      freeWater: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: 10,
      },
      signsPlacards: {
        rating: 'C',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: 'East side "No Smoking" placard faded. Replacement ordered, ETA 3 days.',
        numericValue: null,
      },
      floatingSuction: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: null,
      },
      emergencyShutdownSystem: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: null,
      },
      fireExtinguishers: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: null,
      },
      bondingCableContinuity: {
        rating: 'S',
        date: dateVal,
        signature: inspector,
        maintenanceActionNotes: '',
        numericValue: 18,
      },
    },
  }
}

export function loadDemoData() {
  saveFacility(FACILITY)
  setActiveFacilityId(FACILITY.id)

  const dailies = buildDailyInspections()
  dailies.forEach(saveDailyInspection)

  saveMonthlyInspection(buildMonthlyInspection())

  return { facilityName: FACILITY.name, dailyCount: dailies.length }
}

export function clearDemoData() {
  // Remove all p66_ keys
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('p66_')) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}
