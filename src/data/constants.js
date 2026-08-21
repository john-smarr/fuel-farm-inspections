// Solids code definitions
export const SOLIDS_CODES = {
  1: { label: '1', description: 'Clear / Free of Particulate' },
  2: { label: '2', description: 'Slight Haze' },
  3: { label: '3', description: 'Particulate Matter Visible' },
  4: { label: '4', description: 'Dirty / Cloudy' },
}

// Water code definitions
export const WATER_CODES = {
  A: { label: 'A', description: 'Bright & Clear' },
  B: { label: 'B', description: 'Slightly Hazy' },
  C: { label: 'C', description: 'Cloudy / Milky' },
  D: { label: 'D', description: 'Water Droplets / Slugs Visible' },
  E: { label: 'E', description: 'Surfactants / Foam Present' },
}

// Daily inspection checklist items
export const DAILY_CHECK_LABELS = {
  generalHousekeeping: 'General Housekeeping / Maintenance',
  securityFireSafety: 'Security & Fire Safety',
  fuelLeaks: 'Fuel Leaks',
  bondingCablesClamps: 'Bonding Cables / Clamps / Reels',
  fireExtinguishers: 'Fire Extinguishers',
  wasteFuelTanks: 'Waste Fuel Tanks',
  hosesSwivelsNozzles: 'Hoses / Swivels / Nozzles',
}

// Monthly inspection items
export const MONTHLY_ITEMS = {
  membraneFilterTest: {
    label: 'Membrane Filter Test',
    description: 'Color assessment — Jet A: white/straw; 100LL: blue. Report unusual color.',
    hasNumeric: false,
    numericUnit: null,
    numericHint: null,
  },
  antiIcingAdditive: {
    label: 'Anti-Icing Additive',
    description: '0.10 – 0.15 VOL%',
    hasNumeric: true,
    numericUnit: 'VOL%',
    numericHint: '0.10–0.15',
  },
  nozzleScreens: {
    label: 'Nozzle Screens',
    description: 'Condition check',
    hasNumeric: false,
    numericUnit: null,
    numericHint: null,
  },
  freeWater: {
    label: 'Free Water',
    description: 'PPM measurement',
    hasNumeric: true,
    numericUnit: 'ppm',
    numericHint: 'Enter reading',
  },
  signsPlacards: {
    label: 'Signs & Placards',
    description: 'Presence & condition',
    hasNumeric: false,
    numericUnit: null,
    numericHint: null,
  },
  floatingSuction: {
    label: 'Floating Suction',
    description: 'Operational check',
    hasNumeric: false,
    numericUnit: null,
    numericHint: null,
  },
  emergencyShutdownSystem: {
    label: 'Emergency Shutdown System',
    description: 'Function test',
    hasNumeric: false,
    numericUnit: null,
    numericHint: null,
  },
  fireExtinguishers: {
    label: 'Fire Extinguishers',
    description: 'Seal & Inspection Date',
    hasNumeric: false,
    numericUnit: null,
    numericHint: null,
  },
  bondingCableContinuity: {
    label: 'Bonding Cable Continuity',
    description: '≤ 25 ohms',
    hasNumeric: true,
    numericUnit: 'Ω',
    numericHint: '≤25',
  },
}

// Monthly rating options
export const MONTHLY_RATINGS = [
  { value: 'S', label: 'S', title: 'Satisfactory' },
  { value: 'C', label: 'C', title: 'Comment Required' },
  { value: 'N/U', label: 'N/U', title: 'Not Used' },
  { value: 'N/A', label: 'N/A', title: 'Not Applicable' },
]

// Color guide for fuel types
export const FUEL_COLOR_GUIDE = [
  {
    fuel: 'Jet A',
    color: 'White / Light Straw',
    colorClass: 'bg-yellow-50',
    note: 'Report any unusual colors immediately',
  },
  {
    fuel: '100LL AvGas',
    color: 'Blue',
    colorClass: 'bg-blue-200',
    note: 'Report if color changes from expected blue',
  },
]
