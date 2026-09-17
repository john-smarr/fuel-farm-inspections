import React, { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { getFacilities } from '../data/storage'
import DailyEntryForm from './DailyEntryForm'

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Parse QR data and find matching asset across all facilities
function resolveAsset(data) {
  if (!data?.startsWith('ffi:asset:')) return null
  const assetId = data.slice('ffi:asset:'.length)
  for (const fac of getFacilities()) {
    const asset = (fac.assets || []).find(a => a.id === assetId)
    if (asset) return { facility: fac, asset }
  }
  return null
}

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

export default function ScannerView({ facility, facilityId }) {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const [scanning, setScanning] = useState(true)
  const [noCamera, setNoCamera] = useState(false)
  const [badScan, setBadScan] = useState(false)
  const [found, setFound] = useState(null) // { facility, asset }

  useEffect(() => {
    if (!scanning || noCamera) return

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
  }, [scanning, noCamera])

  const handleFormClose = () => {
    setFound(null)
    setScanning(true)
  }

  const handleManualSelect = (resolved) => {
    setFound(resolved)
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
        {found && (
          <DailyEntryForm
            date={getTodayStr()}
            facilityId={found.facility.id}
            facility={found.facility}
            initialAssetId={found.asset.id}
            onClose={handleFormClose}
            onSaved={handleFormClose}
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

      {/* Daily entry form — appears after successful scan */}
      {found && (
        <DailyEntryForm
          date={getTodayStr()}
          facilityId={found.facility.id}
          facility={found.facility}
          initialAssetId={found.asset.id}
          onClose={handleFormClose}
          onSaved={handleFormClose}
        />
      )}
    </div>
  )
}
