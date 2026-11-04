import React, { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { getFacilities, saveFacility, generateId } from '../data/storage'
import { compressPhoto } from '../utils/photo'
import DailyEntryForm from './DailyEntryForm'
import FormPicker from './FormPicker'
import GenericFormRenderer from './GenericFormRenderer'

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCurrentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Parse QR data and find matching asset across all facilities
function resolveAsset(data) {
  if (!data) return null
  for (const fac of getFacilities()) {
    // Match by ffi:asset:{id} format
    if (data.startsWith('ffi:asset:')) {
      const assetId = data.slice('ffi:asset:'.length)
      const asset = (fac.assets || []).find(a => a.id === assetId)
      if (asset) return { facility: fac, asset }
    }
    // Match by linked qrCode value (external QR/barcode)
    const asset = (fac.assets || []).find(a => a.qrCode === data)
    if (asset) return { facility: fac, asset }
  }
  return null
}

const FUEL_TYPES = ['Jet A', 'Jet A-1', '100LL AvGas', 'Other']

// Fallback when camera is unavailable — manual asset list
function ManualPicker({ facility, onSelect }) {
  const assets = facility?.assets || []
  const tanks = assets.filter(a => a.type === 'tank')
  const trucks = assets.filter(a => a.type === 'truck')

  if (!facility) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm font-medium">No facility selected</p>
          <p className="text-xs mt-1 text-gray-600">Go to Settings to add and select a facility</p>
        </div>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p className="text-sm font-medium">No assets configured</p>
          <p className="text-xs mt-1 text-gray-600">Go to Settings → Manage Assets to add tanks</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-300">Camera unavailable — select an asset manually to begin inspection.</p>
        </div>

        {tanks.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tanks</h3>
            <div className="space-y-2">
              {tanks.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => onSelect({ facility, asset })}
                  className="w-full card p-4 text-left hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">TANK</span>
                        <span className="font-semibold text-white">{asset.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
                        {asset.fuelType && <span>{asset.fuelType}</span>}
                        {asset.capacityGal != null && <span>{Number(asset.capacityGal).toLocaleString()} gal</span>}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {trucks.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trucks</h3>
            <div className="space-y-2">
              {trucks.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => onSelect({ facility, asset })}
                  className="w-full card p-4 text-left hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">TRUCK</span>
                      <span className="font-semibold text-white">{asset.name}</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function RegisterAssetSheet({ qrValue, facility, onRegistered, onClose }) {
  const [assetType, setAssetType] = useState('tank')
  const [name, setName] = useState('')
  const [fuelType, setFuelType] = useState('Jet A')
  const [sumpCount, setSumpCount] = useState(1)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')

  const handleRegister = () => {
    if (!name.trim()) { setError('Name is required'); return }
    if (!facility) { setError('No facility selected'); return }

    const newAsset = {
      id: generateId(),
      type: assetType,
      name: name.trim(),
      fuelType,
      qrCode: qrValue,
      ...(assetType === 'tank' ? { sumpCount: Number(sumpCount) || 1 } : {}),
      photo,
      notes: '',
    }

    const updatedFacility = {
      ...facility,
      assets: [...(facility.assets || []), newAsset],
    }
    saveFacility(updatedFacility)
    onRegistered({ facility: updatedFacility, asset: newAsset })
  }

  return (
    <>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} />
      <div className="bottom-sheet animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-bold text-white text-lg">New Asset Detected</h2>
          <p className="text-sm text-gray-400 mt-0.5">This QR code isn't linked to any asset yet.</p>
          <p className="text-xs text-gray-600 font-mono mt-1 break-all">{qrValue}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            {/* Asset type */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Asset Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssetType('tank')}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    assetType === 'tank'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  Tank
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('truck')}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    assetType === 'truck'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  Truck / Refueler
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder={assetType === 'tank' ? 'e.g. Tank 1' : 'e.g. Refueler Truck 1'}
                className="input-field"
                autoFocus
              />
            </div>

            {/* Fuel type */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Fuel Type</label>
              <div className="flex flex-wrap gap-1.5">
                {FUEL_TYPES.map(ft => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setFuelType(ft)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      fuelType === ft
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>
            </div>

            {/* Sump count (tanks only) */}
            {assetType === 'tank' && (
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Sump Points</label>
                <select value={sumpCount} onChange={e => setSumpCount(e.target.value)} className="input-field">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Photo */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Photo</label>
              {photo ? (
                <div className="space-y-1">
                  <img src={photo} alt="Asset" className="w-full max-h-32 object-cover rounded-lg border border-gray-700" />
                  <button type="button" onClick={() => setPhoto(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 cursor-pointer border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 transition-colors w-fit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take / Attach Photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) compressPhoto(file).then(img => setPhoto(img))
                    e.target.value = ''
                  }} />
                </label>
              )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <p className="text-xs text-gray-600">
              This will add the asset to <strong className="text-gray-400">{facility?.name}</strong> and link it to the scanned QR code.
            </p>
          </div>
        </div>

        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900 safe-bottom">
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleRegister} className="btn-primary flex-1">Register Asset</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function ScannerView({ facility, facilityId }) {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [noCamera, setNoCamera] = useState(false)
  const [badScan, setBadScan] = useState(false)
  const [found, setFound] = useState(null) // { facility, asset }
  const [selectedForm, setSelectedForm] = useState(null) // null = show picker, 'legacyDaily' | 'legacyMonthly' | formDefinition
  const [unknownQR, setUnknownQR] = useState(null) // scanned QR value not matching any asset

  useEffect(() => {
    if (!scanning || noCamera || !permissionRequested) return

    const video = videoRef.current
    if (!video) return

    const scanner = new QrScanner(
      video,
      (result) => {
        const resolved = resolveAsset(result.data)
        if (resolved) {
          if (navigator.vibrate) navigator.vibrate(50)
          scanner.stop()
          setFound(resolved)
          setScanning(false)
        } else if (result.data) {
          if (navigator.vibrate) navigator.vibrate(50)
          scanner.stop()
          setUnknownQR(result.data)
          setScanning(false)
        } else {
          setBadScan(true)
          setTimeout(() => setBadScan(false), 2000)
        }
      },
      {
        returnDetailedScanResult: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      }
    )

    scanner.start().catch(() => setNoCamera(true))
    scannerRef.current = scanner

    return () => {
      scanner.destroy()
      scannerRef.current = null
    }
  }, [scanning, noCamera, permissionRequested])

  const handleFormClose = () => {
    setFound(null)
    setSelectedForm(null)
    setUnknownQR(null)
    setScanning(true)
  }

  const handleManualSelect = (resolved) => {
    setFound(resolved)
  }

  const handleAssetRegistered = (resolved) => {
    setUnknownQR(null)
    setFound(resolved)
  }

  // Permission explanation — shown before camera starts
  if (!permissionRequested && !noCamera) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Scan QR Code</h2>
        <p className="text-sm text-gray-400 mb-8 max-w-xs">
          Scan the QR code on a tank or truck label to start an inspection. Camera access is needed to scan codes.
        </p>
        <button
          onClick={async () => {
            // Pre-request camera permission to ensure the system dialog appears
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
              // Permission granted — stop the stream, let QrScanner take over
              stream.getTracks().forEach(t => t.stop())
              setPermissionRequested(true)
            } catch {
              // Permission denied or no camera available
              setPermissionRequested(true)
              setNoCamera(true)
            }
          }}
          className="btn-primary w-full max-w-xs py-3 text-base font-semibold mb-3"
        >
          Continue
        </button>
        <button
          onClick={() => { setPermissionRequested(true); setNoCamera(true) }}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
        >
          Enter asset manually instead
        </button>
      </div>
    )
  }

  // No camera — show manual picker
  if (noCamera) {
    return (
      <>
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <h2 className="text-base font-bold text-white">Select Asset</h2>
          <p className="text-xs text-gray-500 mt-0.5">{facility?.name || 'No facility selected'}</p>
        </div>
        <ManualPicker facility={facility} onSelect={handleManualSelect} />
        {found && !selectedForm && (
          <FormPicker
            facility={found.facility}
            asset={found.asset}
            onSelectLegacyDaily={() => setSelectedForm('legacyDaily')}
            onSelectLegacyMonthly={() => setSelectedForm('legacyMonthly')}
            onSelectGenericForm={(form) => setSelectedForm(form)}
            onClose={handleFormClose}
          />
        )}
        {found && selectedForm === 'legacyDaily' && (
          <DailyEntryForm
            date={getTodayStr()}
            facilityId={found.facility.id}
            facility={found.facility}
            initialAssetId={found.asset.id}
            onClose={handleFormClose}
            onSaved={handleFormClose}
          />
        )}
        {found && selectedForm && selectedForm !== 'legacyDaily' && selectedForm !== 'legacyMonthly' && (
          <GenericFormRenderer
            formDefinition={selectedForm}
            facilityId={found.facility.id}
            facility={found.facility}
            asset={found.asset}
            datePart={selectedForm.frequency === 'monthly' ? getCurrentYearMonth() : getTodayStr()}
            onClose={handleFormClose}
            onSaved={handleFormClose}
          />
        )}
        {unknownQR && (
          <RegisterAssetSheet
            qrValue={unknownQR}
            facility={facility}
            onRegistered={handleAssetRegistered}
            onClose={handleFormClose}
          />
        )}
      </>
    )
  }

  // Camera scanner
  return (
    <div className="flex-1 relative bg-black overflow-hidden">
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Viewfinder overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Dark vignette around the scan zone */}
        <div className="absolute inset-0 bg-black/50" style={{
          maskImage: 'radial-gradient(ellipse 55% 45% at 50% 45%, transparent 70%, black 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 55% 45% at 50% 45%, transparent 70%, black 100%)',
        }} />

        {/* Corner brackets */}
        <div className="relative w-56 h-56" style={{ marginTop: '-40px' }}>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-xl" />
        </div>

        {/* Instructions / status */}
        <div className="mt-8 text-center px-6" style={{ marginTop: '24px' }}>
          {badScan ? (
            <p className="text-sm text-red-300 bg-red-900/70 px-4 py-2 rounded-xl">
              Unrecognized QR code — try a tank label
            </p>
          ) : (
            <p className="text-sm text-gray-200 bg-black/50 px-4 py-2 rounded-xl">
              Point camera at a tank QR code
            </p>
          )}
          {facility && (
            <p className="text-xs text-amber-400/80 mt-2">{facility.name}</p>
          )}
        </div>
      </div>

      {/* Form picker — appears after successful scan */}
      {found && !selectedForm && (
        <FormPicker
          facility={found.facility}
          asset={found.asset}
          onSelectLegacyDaily={() => setSelectedForm('legacyDaily')}
          onSelectLegacyMonthly={() => setSelectedForm('legacyMonthly')}
          onSelectGenericForm={(form) => setSelectedForm(form)}
          onClose={handleFormClose}
        />
      )}
      {found && selectedForm === 'legacyDaily' && (
        <DailyEntryForm
          date={getTodayStr()}
          facilityId={found.facility.id}
          facility={found.facility}
          initialAssetId={found.asset.id}
          onClose={handleFormClose}
          onSaved={handleFormClose}
        />
      )}
      {found && selectedForm && selectedForm !== 'legacyDaily' && selectedForm !== 'legacyMonthly' && (
        <GenericFormRenderer
          formDefinition={selectedForm}
          facilityId={found.facility.id}
          facility={found.facility}
          asset={found.asset}
          datePart={selectedForm.frequency === 'monthly' ? getCurrentYearMonth() : getTodayStr()}
          onClose={handleFormClose}
          onSaved={handleFormClose}
        />
      )}
      {unknownQR && (
        <RegisterAssetSheet
          qrValue={unknownQR}
          facility={facility}
          onRegistered={handleAssetRegistered}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
