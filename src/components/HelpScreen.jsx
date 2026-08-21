import React, { useState } from 'react'

const sections = [
  {
    id: 'setup',
    title: 'First-Time Setup',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    steps: [
      'Tap Settings (bottom right)',
      'Tap Add and enter your Facility ID (e.g. PDX-01) and location name',
      'Tap Save — the facility is now active',
      'Optionally add email addresses under Email Alert Recipients so failures trigger a notification',
    ],
  },
  {
    id: 'daily',
    title: 'Daily Inspection',
    subtitle: 'Complete every day',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    steps: [
      'Tap Daily (bottom left) — the calendar shows this month',
      'Tap Log Today\'s Inspection',
      'Enter the Manager / Trainer name',
      'Toggle each of the 7 checklist items Pass or Fail',
      'If anything is marked Fail, describe the issue in the note that appears — this is required',
      'Optionally take a photo of the problem',
      'Set the Tank Sump code — tap the Solids number (1–4) and Water letter (A–E)',
      'Set the Filter Vessel Sump code the same way',
      'Tap ? anytime to see what each code means',
      'Enter the DP Pressure reading',
      'Type your full name as Signature',
      'Tap Save Inspection',
      'If there were failures and email recipients are set up, tap Send Email Alert',
    ],
  },
  {
    id: 'calendar',
    title: 'Reading the Calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    steps: [
      'Green dot = inspection complete, all items passed',
      'Yellow dot = inspection complete, one or more items failed',
      'No dot = no inspection recorded for that day',
      'Tap any past day to view or edit its entry',
      'Use the arrows to navigate between months',
    ],
  },
  {
    id: 'monthly',
    title: 'Monthly Inspection',
    subtitle: 'Complete once per month',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    steps: [
      'Tap Monthly (bottom middle)',
      'For each of the 9 items, choose a rating — S (Satisfactory), C (Comment), N/U (Not Used), or N/A (Not Applicable)',
      'For items with a numeric reading, enter the value',
      'Anti-Icing Additive should be between 0.10 and 0.15 VOL%',
      'Free Water is measured in ppm',
      'Bonding Cable Continuity must be 25 ohms or less',
      'If you rate anything C, you must fill in the Maintenance Action Notes before saving',
      'Enter the date and your signature for each item',
      'Tap Save Inspection at the bottom',
      'If anything was rated C and recipients are configured, tap Send Email Alert',
    ],
  },
  {
    id: 'export',
    title: 'Printing & Exporting',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    ),
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    steps: [
      'Open any saved daily or monthly inspection',
      'Tap the print icon in the top right corner',
      'A formatted report opens showing all inspection data',
      'Tap Print to send to a printer or save as a PDF',
    ],
  },
  {
    id: 'backup',
    title: 'Backup & Restore',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    steps: [
      'All data is stored on this device — back it up regularly',
      'Go to Settings → Data Backup → Export to download a backup file',
      'Save that file somewhere safe (email it to yourself, save to cloud storage)',
      'To move data to a new device, go to Settings → Data Backup → Import and select your backup file',
    ],
  },
]

function Step({ number, text }) {
  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {number}
      </span>
      <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
    </div>
  )
}

function Section({ section }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`rounded-xl border overflow-hidden ${section.bg}`}>
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className={section.color}>{section.icon}</span>
          <div>
            <span className="font-semibold text-white text-sm">{section.title}</span>
            {section.subtitle && (
              <span className="text-xs text-gray-500 ml-2">{section.subtitle}</span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {section.steps.map((step, i) => (
            <Step key={i} number={i + 1} text={step} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HelpScreen({ onClose }) {
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">How to Use</h1>
            <p className="text-xs text-gray-500">P66 Fuel Farm Inspector</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-lg mx-auto space-y-3 pb-8">
          <p className="text-xs text-gray-500 pb-1">
            Tap any section to expand it.
          </p>
          {sections.map(section => (
            <Section key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  )
}
