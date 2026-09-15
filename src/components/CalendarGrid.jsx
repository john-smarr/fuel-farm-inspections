import React, { useState, useEffect } from 'react'
import { getDailyInspectionsForMonth } from '../data/storage'
import DailyEntryForm from './DailyEntryForm'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toYearMonth(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getTodayString() {
  const now = new Date()
  return toDateString(now.getFullYear(), now.getMonth(), now.getDate())
}

// inspectionList is an array of inspections (one per asset) for a given date
function getInspectionStatus(inspectionList) {
  if (!inspectionList || inspectionList.length === 0) return 'none'
  const anyFail = inspectionList.some(insp =>
    Object.values(insp.checks || {}).some(v => !v)
  )
  if (anyFail) return 'fail'
  return 'pass'
}

export default function CalendarGrid({ facilityId, facility }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed
  const [inspections, setInspections] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const todayStr = getTodayString()

  const loadInspections = () => {
    if (!facilityId) return
    const yearMonth = toYearMonth(viewYear, viewMonth)
    const data = getDailyInspectionsForMonth(facilityId, yearMonth)
    setInspections(data)
  }

  useEffect(() => {
    loadInspections()
  }, [facilityId, viewYear, viewMonth])

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // Build calendar grid
  // First day of month (0=Sun, 1=Mon, ...)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  // Convert Sun=0 to Mon=0 offset
  const startOffset = (firstDayOfMonth + 6) % 7 // Mon-based offset
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) {
    cells.push(null) // empty cells
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  if (!facilityId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm font-medium">No facility selected</p>
          <p className="text-xs mt-1">Go to Settings to add and select a facility</p>
        </div>
      </div>
    )
  }

  // Count stats
  const monthStats = Object.values(inspections).reduce((acc, inspList) => {
    const status = getInspectionStatus(inspList)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-lg mx-auto">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <h2 className="font-bold text-white text-lg">{monthName}</h2>
              {/* Stats */}
              <div className="flex items-center justify-center gap-3 mt-1">
                {monthStats.pass > 0 && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {monthStats.pass} pass
                  </span>
                )}
                {monthStats.fail > 0 && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    {monthStats.fail} fail
                  </span>
                )}
                {!monthStats.pass && !monthStats.fail && (
                  <span className="text-xs text-gray-600">No entries</span>
                )}
              </div>
            </div>

            <button
              onClick={nextMonth}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Today button */}
          {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) && (
            <div className="flex justify-center mb-3">
              <button
                onClick={goToToday}
                className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-3 py-1 rounded-full transition-colors"
              >
                Go to Today
              </button>
            </div>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-center text-xs font-semibold text-gray-500 py-1">
                {h}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }
              const dateStr = toDateString(viewYear, viewMonth, day)
              const inspection = inspections[dateStr]
              const status = getInspectionStatus(inspection)
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  disabled={isFuture}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative
                    ${isToday ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-gray-900' : ''}
                    ${isFuture
                      ? 'opacity-25 cursor-not-allowed bg-transparent'
                      : status === 'none'
                      ? 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600'
                      : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600'
                    }
                  `}
                >
                  <span className={`text-sm font-semibold ${
                    isToday ? 'text-amber-400' : isFuture ? 'text-gray-600' : 'text-gray-200'
                  }`}>
                    {day}
                  </span>
                  {/* Status dot */}
                  {status !== 'none' && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      status === 'pass' ? 'bg-green-400' :
                      status === 'fail' ? 'bg-yellow-400' :
                      'bg-gray-500'
                    }`} />
                  )}
                  {status === 'none' && !isFuture && (
                    <span className="w-1 h-1 rounded-full mt-0.5 bg-transparent" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              All Pass
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Has Fail
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-transparent border border-gray-600" />
              No Entry
            </span>
          </div>

          {/* Quick-entry shortcut for today */}
          {(() => {
            const todayInView = viewYear === today.getFullYear() && viewMonth === today.getMonth()
            const todayEntries = inspections[todayStr] || []
            const hasTodayEntry = todayEntries.length > 0
            if (!todayInView) return null
            return (
              <div className="mt-5 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    hasTodayEntry
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-900'
                  }`}
                >
                  {hasTodayEntry ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Today's Entry ({todayEntries.length})
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Log Today's Inspection
                    </>
                  )}
                </button>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Daily entry form modal */}
      {selectedDate && (
        <DailyEntryForm
          date={selectedDate}
          facilityId={facilityId}
          facility={facility}
          onClose={() => setSelectedDate(null)}
          onSaved={loadInspections}
        />
      )}
    </>
  )
}
