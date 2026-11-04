// ─── Form Definition System ─────────────────────────────────────────────────
// Each form is a JSON schema describing sections and fields.
// The GenericFormRenderer component interprets these to render forms.
//
// Field types:
//   yesno    — Yes/No toggle
//   choice   — Button group from options array
//   text     — Free text input
//   number   — Numeric input with optional unit
//   date     — Date picker
//   sumpCode — Solids + Water code picker (reuses SumpCodePicker)
//   photo    — Photo capture
//   counter  — Integer with +/- buttons

// ─── Daily / Receipt of Fuel ────────────────────────────────────────────────

export const dailyReceiptOfFuel = {
  id: 'dailyReceiptOfFuel',
  label: 'Daily / Receipt of Fuel',
  shortLabel: 'Receipt of Fuel',
  frequency: 'daily',
  appliesTo: { assetType: null, fuelTypes: null },
  sections: [
    {
      id: 'productDelivery',
      label: 'Product & Delivery',
      fields: [
        { id: 'product', label: 'Product', type: 'choice', options: ['Jet A', 'Jet A w/FSII', 'Avgas 100LL'], required: true },
        { id: 'deliveries', label: 'Deliveries', type: 'counter', min: 0, max: 4 },
        { id: 'aircraftFuelingDispensed', label: 'Aircraft Fueling Dispensed', type: 'counter', min: 0, max: 6 },
      ],
    },
    {
      id: 'transferChain',
      label: 'Transfer Chain',
      fields: [
        { id: 'truckToStorage', label: 'Transport Truck to Storage Tank', type: 'yesno' },
        { id: 'storageTransfer', label: 'Storage Transfer', type: 'yesno' },
        { id: 'storageToRefueler', label: 'Storage Tank to Refueler', type: 'yesno' },
        { id: 'refuelerToAircraft', label: 'Refueler to Aircraft', type: 'yesno' },
      ],
    },
    {
      id: 'fsiiInjection',
      label: 'FSII Injection',
      fields: [
        { id: 'fsiiEquipment', label: 'FSII Injection Equipment', type: 'choice', options: ['Fuel Farm', 'Refueler', 'None'] },
        { id: 'fsiiPrimaryStorage', label: 'FSII Primary Storage', type: 'choice', options: ['Pails', 'Drums', 'Totes'] },
        { id: 'fsiiDesiccantFilter', label: 'FSII Desiccant Filter on Primary Storage (Good)', type: 'yesno' },
        { id: 'accidentReportingPlacard', label: 'Aircraft Accident Reporting Placard', type: 'yesno' },
        { id: 'afqar', label: 'Aviation Fuel Quality Assurance Requirements (AFQAR)', type: 'yesno' },
      ],
    },
    {
      id: 'receiptOfFuel',
      label: 'Receipt of Fuel',
      fields: [
        { id: 'bolDate', label: 'Bill of Lading (BOL) Date', type: 'date' },
        { id: 'coaDate', label: 'Certificate of Analysis (COA) Date', type: 'date' },
        { id: 'apiGravityBol', label: 'API Gravity on BOL', type: 'number', step: 0.1 },
        { id: 'fboObservedTemp', label: 'FBO Observed Temperature', type: 'number', unit: '\u00B0F', step: 0.1 },
        { id: 'fboObservedApi', label: 'FBO Observed API Gravity', type: 'number', step: 0.1 },
        { id: 'fboCorrectedApi', label: 'FBO Corrected API Gravity', type: 'number', step: 0.1 },
        { id: 'receiptWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        { id: 'fsiiBol', label: 'Presence of FSII indicated on BOL', type: 'yesno' },
        { id: 'bolGrossGallons', label: 'BOL: Gross Gallons of Fuel', type: 'number', step: 1 },
        { id: 'bolFsiiGallons', label: 'BOL: FSII Gallons', type: 'number', step: 0.1 },
      ],
    },
  ],
}

// ─── Fuel Farm Monthly (Jet A and 100LL share same structure) ───────────────

function buildFuelFarmMonthly(id, label, shortLabel, fuelTypes) {
  return {
    id,
    label,
    shortLabel,
    frequency: 'monthly',
    appliesTo: { assetType: 'tank', fuelTypes },
    sections: [
      {
        id: 'tank',
        label: 'Tank',
        fields: [
          { id: 'tankIdentification', label: 'Tank Identification', type: 'text' },
          { id: 'singleProduct', label: 'Single Product / Labeled (all 4 sides)', type: 'yesno' },
          { id: 'fillPointLabeled', label: 'Fill Point Properly Labeled for Product', type: 'yesno' },
          { id: 'storageType', label: 'Under Ground (UST) or Above Ground (AST)', type: 'choice', options: ['UST', 'AST'] },
          { id: 'sizeGallons', label: 'Size (Gallons)', type: 'number', step: 1 },
          { id: 'sumpRemovalMethod', label: 'Sump Removal Method', type: 'choice', options: ['Sump Drain', 'Fixed Pump', 'Portable Pump'] },
          { id: 'fsiiConcentrationTest', label: 'FSII Concentration Test', type: 'text' },
          { id: 'tankWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        ],
      },
      {
        id: 'filtration',
        label: 'Filtration',
        fields: [
          { id: 'filtrationDirection', label: 'Filtration', type: 'choice', options: ['Inbound', 'Outbound', 'Both'] },
          { id: 'filterIdentification', label: 'Filter Identification (If Applicable)', type: 'text' },
          { id: 'filterAtDispenser', label: 'Filter Vessel located at Fueling Dispenser', type: 'yesno' },
          { id: 'elementType1', label: 'Element Type 1 - Model #', type: 'text' },
          { id: 'elementType2', label: 'Element Type 2 - Model #', type: 'text' },
          { id: 'elementType3', label: 'Element Type 3 - Model #', type: 'text' },
          { id: 'elementChanged', label: 'Element Changed - Month / Year', type: 'text' },
          { id: 'changeDatePosted', label: 'Change Date/Due Date/Element Kit\'s Posted', type: 'yesno' },
          { id: 'dpGauge', label: 'DP Gauge', type: 'choice', options: ['Direct Read', 'Green/Red Zone', '3-Way Valve', '2-Gauge', 'Missing/Damaged'] },
          { id: 'waterDefense', label: 'Water Defense', type: 'choice', options: ['Float', 'Probe Type'] },
          { id: 'filtrationWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        ],
      },
      {
        id: 'dispenser',
        label: 'Dispenser',
        fields: [
          { id: 'properlyLabeled', label: 'Properly Labeled: Decals and Black Handle', type: 'yesno' },
          { id: 'selfServe', label: 'Self-Serve', type: 'yesno' },
          { id: 'nozzleType', label: 'Single Point or Overwing', type: 'choice', options: ['Single Point', 'Overwing'] },
          { id: 'hoseStandard', label: 'EI 1529 or API 1529 Hose (Stamped On Hose)', type: 'text' },
          { id: 'dustCover', label: 'Dust Cover / Protective Device', type: 'yesno' },
          { id: 'nozzleShape', label: 'Duckbill or Round (Follow EI-1597)', type: 'choice', options: ['Duckbill', 'Round'] },
          { id: 'nozzleCondition', label: 'Nozzle Screen Condition (Good)', type: 'yesno' },
          { id: 'nozzleDebris', label: 'Nozzle Screen (Free of Debris)', type: 'yesno' },
          { id: 'dispenserWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        ],
      },
    ],
  }
}

export const jetFuelFarmMonthly = buildFuelFarmMonthly(
  'jetFuelFarmMonthly',
  'Jet Fuel Farm Monthly',
  'Fuel Farm',
  ['Jet A', 'Jet A-1']
)

export const avgas100llFarmMonthly = buildFuelFarmMonthly(
  'avgas100llFarmMonthly',
  '100LL Fuel Farm Monthly',
  'Fuel Farm',
  ['100LL AvGas']
)

// ─── Refueler Monthly (Jet A and 100LL share same structure) ────────────────

function buildRefuelerMonthly(id, label, shortLabel, fuelTypes) {
  return {
    id,
    label,
    shortLabel,
    frequency: 'monthly',
    appliesTo: { assetType: 'truck', fuelTypes },
    sections: [
      {
        id: 'refueler',
        label: 'Refueler',
        fields: [
          { id: 'refuelerIdentification', label: 'Refueler Identification', type: 'text' },
          { id: 'singleProduct', label: 'Single Product / Labeled (all 4 sides)', type: 'yesno' },
          { id: 'sizeGallons', label: 'Size (Gallons)', type: 'number', step: 1 },
          { id: 'refuelerWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        ],
      },
      {
        id: 'fsiiInjection',
        label: 'FSII Injection',
        fields: [
          { id: 'fsiiConcentrationTest', label: 'FSII Concentration Test', type: 'text' },
          { id: 'fsiiAmount', label: 'FSII Amount (ml or oz) / Jet Fuel (gallons)', type: 'text' },
          { id: 'desiccantFilter', label: 'Desiccant Filter on Refueler tank (Good)', type: 'yesno' },
        ],
      },
      {
        id: 'elements',
        label: 'Elements',
        fields: [
          { id: 'elementType1', label: 'Element Type 1 - Model #', type: 'text' },
          { id: 'elementType2', label: 'Element Type 2 - Model #', type: 'text' },
          { id: 'elementType3', label: 'Element Type 3 - Model #', type: 'text' },
          { id: 'elementChanged', label: 'Element Changed - Month / Year', type: 'text' },
          { id: 'changeDatePosted', label: 'Change Date/Due Date/Element Kit\'s Posted', type: 'yesno' },
          { id: 'dpGauge', label: 'DP Gauge', type: 'choice', options: ['Direct Read', 'Green/Red Zone', '3-Way Valve', '2-Gauge', 'Missing/Damaged'] },
          { id: 'waterDefense', label: 'Water Defense', type: 'choice', options: ['Float', 'Probe Type'] },
          { id: 'elementsWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        ],
      },
      {
        id: 'refuelerNozzle',
        label: 'Refueler Nozzle',
        fields: [
          { id: 'rnProperlyLabeled', label: 'Properly Labeled: Decals and Black Handle', type: 'yesno' },
          { id: 'rnSinglePoint', label: 'Single Point Nozzle', type: 'yesno' },
          { id: 'rnHoseStandard', label: 'EI 1529 or API 1529 Hose (Which One)', type: 'text' },
          { id: 'rnDustCover', label: 'Dust Cover / Protective Device', type: 'yesno' },
          { id: 'rnNozzleCondition', label: 'Nozzle Screen Condition (Good)', type: 'yesno' },
          { id: 'rnNozzleDebris', label: 'Nozzle Screen (Free of Debris)', type: 'yesno' },
        ],
      },
      {
        id: 'overwingNozzle',
        label: 'Overwing Nozzle',
        fields: [
          { id: 'owHoseStandard', label: 'EI 1529 or API 1529 Hose (Which One)', type: 'text' },
          { id: 'owDustCover', label: 'Dust Cover / Protective Device', type: 'yesno' },
          { id: 'owNozzleShape', label: 'Duckbill or Round (Follow EI-1597)', type: 'choice', options: ['Duckbill', 'Round'] },
          { id: 'owNozzleCondition', label: 'Nozzle Screen Condition (Good)', type: 'yesno' },
          { id: 'owNozzleDebris', label: 'Nozzle Screen (Free of Debris)', type: 'yesno' },
          { id: 'owWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        ],
      },
      {
        id: 'additionalNozzle',
        label: 'Additional Nozzle (Single Point or Overwing)',
        fields: [
          { id: 'anHoseStandard', label: 'EI 1529 or API 1529 Hose (Which One)', type: 'text' },
          { id: 'anDustCover', label: 'Dust Cover / Protective Device', type: 'yesno' },
          { id: 'anNozzleShape', label: 'Duckbill or Round (Follow EI-1597)', type: 'choice', options: ['Duckbill', 'Round'] },
          { id: 'anNozzleCondition', label: 'Nozzle Screen Condition (Good)', type: 'yesno' },
          { id: 'anNozzleDebris', label: 'Nozzle Screen (Free of Debris)', type: 'yesno' },
          { id: 'anWhiteBucket', label: 'White Bucket: Particulate/Moisture Rating', type: 'sumpCode' },
        ],
      },
    ],
  }
}

export const jetARefuelerMonthly = buildRefuelerMonthly(
  'jetARefuelerMonthly',
  'Jet A Refueler Monthly',
  'Refueler',
  ['Jet A', 'Jet A-1']
)

export const avgas100llRefuelerMonthly = buildRefuelerMonthly(
  'avgas100llRefuelerMonthly',
  '100LL Refueler Monthly',
  'Refueler',
  ['100LL AvGas']
)

// ─── Registry & Helpers ─────────────────────────────────────────────────────

export const ALL_FORMS = [
  dailyReceiptOfFuel,
  jetFuelFarmMonthly,
  avgas100llFarmMonthly,
  jetARefuelerMonthly,
  avgas100llRefuelerMonthly,
]

export function getFormsForAsset(asset) {
  if (!asset) return []
  return ALL_FORMS.filter(form => {
    const { assetType, fuelTypes } = form.appliesTo
    if (assetType && assetType !== asset.type) return false
    if (fuelTypes && !fuelTypes.includes(asset.fuelType)) return false
    return true
  })
}

export function getFormById(formId) {
  return ALL_FORMS.find(f => f.id === formId) || null
}
