import React, { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import CalendarGrid from './components/CalendarGrid'
import MonthlyInspection from './components/MonthlyInspection'
import FacilitySetup from './components/FacilitySetup'
import AssetSetup from './components/AssetSetup'
import ReferenceLegend from './components/ReferenceLegend'
import HelpScreen from './components/HelpScreen'
import { getFacilities, getActiveFacilityId } from './data/storage'

function getActiveFacility() {
  const id = getActiveFacilityId()
  if (!id) return null
  const facilities = getFacilities()
  return facilities.find(f => f.id === id) || null
}

export default function App() {
  const [activeTab, setActiveTab] = useState('daily')
  const [facility, setFacility] = useState(() => getActiveFacility())
  const [showLegend, setShowLegend] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [assetSetupFacility, setAssetSetupFacility] = useState(null)

  const handleFacilityChange = () => {
    setFacility(getActiveFacility())
  }

  // Refresh facility info when switching to daily/monthly tabs
  const handleTabChange = (tab) => {
    setFacility(getActiveFacility())
    setActiveTab(tab)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 max-w-screen-sm mx-auto">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0 safe-top no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Fuel Farm Inspector</h1>
            </div>
          </div>
          {/* Help button */}
          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 text-gray-500 hover:text-amber-400 transition-colors"
            aria-label="Help"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Active facility badge */}
          <div className="text-right min-w-0">
            {facility ? (
              <div>
                <div className="text-xs font-bold text-amber-400 truncate max-w-[140px]">{facility.name}</div>
                <div className="text-xs text-gray-500 font-mono">{facility.facilityId}</div>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs text-amber-500 border border-amber-500/30 px-2 py-1 rounded-lg hover:border-amber-500/60 transition-colors"
              >
                Select Facility
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: '65px' }}>
        {/* Tab: Daily */}
        {activeTab === 'daily' && (
          <CalendarGrid
            facilityId={facility?.id}
            facility={facility}
          />
        )}

        {/* Tab: Monthly */}
        {activeTab === 'monthly' && (
          <MonthlyInspection
            facilityId={facility?.id}
            facility={facility}
          />
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <FacilitySetup
            onFacilityChange={handleFacilityChange}
            onOpenAssets={(fac) => {
              const fresh = getFacilities().find(f => f.id === fac.id) || fac
              setAssetSetupFacility(fresh)
            }}
          />
        )}
      </main>

      {/* Help screen */}
      {showHelp && <HelpScreen onClose={() => setShowHelp(false)} />}

      {/* Asset setup */}
      {assetSetupFacility && (
        <AssetSetup
          facility={assetSetupFacility}
          onClose={() => setAssetSetupFacility(null)}
          onUpdate={handleFacilityChange}
        />
      )}

      {/* Persistent Reference Legend FAB — visible on daily/monthly tabs */}
      {(activeTab === 'daily' || activeTab === 'monthly') && (
        <button
          onClick={() => setShowLegend(true)}
          className="fixed right-4 z-30 no-print w-10 h-10 rounded-full bg-gray-700 border border-gray-600 text-gray-300 hover:text-amber-400 hover:border-amber-500 hover:bg-gray-600 flex items-center justify-center shadow-lg transition-all"
          style={{ bottom: 'calc(65px + env(safe-area-inset-bottom, 0px) + 12px)' }}
          aria-label="Open reference legend"
          title="Sump Code Reference"
        >
          <span className="text-sm font-bold">?</span>
        </button>
      )}

      {/* Reference Legend Modal */}
      {showLegend && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
            onClick={() => setShowLegend(false)}
          />
          <div className="fixed inset-x-4 bottom-4 top-4 z-50 overflow-y-auto rounded-2xl animate-slide-up"
            style={{ maxWidth: '480px', margin: '16px auto' }}
          >
            <ReferenceLegend onClose={() => setShowLegend(false)} />
          </div>
        </>
      )}

      {/* Bottom navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}
