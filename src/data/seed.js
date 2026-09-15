import { saveFacility, saveDailyInspection, saveMonthlyInspection, setActiveFacilityId } from './storage'

const FACILITY = {
  id: 'demo-pdx-01',
  facilityId: 'PDX-01',
  name: 'Portland International Airport',
  assets: [
    {
      id: 'demo-asset-tank-1',
      type: 'tank',
      name: 'Tank 1',
      fuelType: 'Jet A',
      capacityGal: 10000,
      serialNumber: 'T-001',
      sumpCount: 2,
      notes: 'Primary storage tank — east side of pad.',
    },
    {
      id: 'demo-asset-tank-2',
      type: 'tank',
      name: 'Tank 2',
      fuelType: '100LL AvGas',
      capacityGal: 5000,
      serialNumber: 'T-002',
      sumpCount: 1,
      notes: 'AvGas tank — west side of pad.',
    },
    {
      id: 'demo-asset-truck-1',
      type: 'truck',
      name: 'Refueler Truck 1',
      notes: 'Primary refueler. License: 7ABX-403.',
    },
  ],
}

const INSPECTORS = ['M. Rodriguez', 'J. Callahan', 'T. Okafor', 'S. Nguyen']

function pad(n) { return String(n).padStart(2, '0') }

function dateStr(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`
}

// Build daily inspections for the past 30 days (yesterday and earlier)
function buildDailyInspections() {
  const now = new Date()
  const inspections = []
  const assetId = FACILITY.assets[0].id // Demo data uses Tank 1

  for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const date = dateStr(year, month, day)
    const inspector = INSPECTORS[daysAgo % INSPECTORS.length]
    const timestamp = new Date(year, month - 1, day, 8 + (daysAgo % 4), (daysAgo * 7) % 60).toISOString()

    // Most days all pass; a few days have failures
    const hasFailure = [3, 7, 12, 18, 22, 27].includes(daysAgo)
    const failKey = ['fuelLeaks', 'fireExtinguishers', 'bondingCablesClamps', 'wasteFuelTanks', 'fuelLeaks', 'fireExtinguishers'][
      [3, 7, 12, 18, 22, 27].indexOf(daysAgo)
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

    // Tank 1 has 2 sump points — generate a reading for each
    inspections.push({
      id: `demo-daily-${date}`,
      facilityId: FACILITY.id,
      assetId,
      date,
      createdAt: timestamp,
      updatedAt: timestamp,
      managerTrainer: inspector,
      checks,
      failNotes,
      failPhotos: {},
      tankSumps: [
        { solidsCode: solidsOptions[idx], waterCode: waterOptions[idx] },
        { solidsCode: 1, waterCode: 'A' },
      ],
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
  const timestamp = new Date(now.getFullYear(), now.getMonth(), 5, 9, 0).toISOString()

  return {
    id: 'demo-monthly-01',
    facilityId: FACILITY.id,
    assetId: FACILITY.assets[0].id,
    yearMonth,
    createdAt: timestamp,
    updatedAt: timestamp,
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
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('ffi_')) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}
