import { DAILY_CHECK_LABELS, MONTHLY_ITEMS } from '../data/constants'
import { getSettings } from '../data/storage'

export function buildDailyEmailUrl({ facility, inspection }) {
  const settings = getSettings()
  const to = settings.emailRecipients.join(',')

  const failedItems = Object.entries(inspection.checks || {})
    .filter(([, pass]) => !pass)
    .map(([key]) => {
      const label = DAILY_CHECK_LABELS[key] || key
      const note = inspection.failNotes?.[key] || '(no note)'
      return `  • ${label}: ${note}`
    })

  if (failedItems.length === 0) return null

  const subject = `[P66 ALERT] Daily Inspection Failure — ${facility?.name || ''} — ${inspection.date}`
  const body = [
    `PHILLIPS 66 FUEL FARM — DAILY INSPECTION ALERT`,
    ``,
    `Facility: ${facility?.name || '—'} (${facility?.facilityId || '—'})`,
    `Date: ${inspection.date}`,
    `Inspector: ${inspection.managerTrainer || '—'}`,
    ``,
    `FAILED ITEMS:`,
    ...failedItems,
    ``,
    `Tank Sump: ${inspection.tankSump?.solidsCode || '?'}-${inspection.tankSump?.waterCode || '?'}`,
    `Filter Vessel Sump: ${inspection.filterVesselSump?.solidsCode || '?'}-${inspection.filterVesselSump?.waterCode || '?'}`,
    `DP Pressure: ${inspection.dpPressure ?? '—'} psi`,
    inspection.comment ? `\nComments: ${inspection.comment}` : '',
    ``,
    `Signature: ${inspection.signature || '—'}`,
    ``,
    `-- Sent from P66 Fuel Farm Inspector`,
  ].filter(l => l !== undefined).join('\n')

  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildMonthlyEmailUrl({ facility, inspection }) {
  const settings = getSettings()
  const to = settings.emailRecipients.join(',')

  const commentItems = Object.entries(inspection.items || {})
    .filter(([, item]) => item.rating === 'C')
    .map(([key, item]) => {
      const label = MONTHLY_ITEMS[key]?.label || key
      const notes = item.maintenanceActionNotes || '(no notes)'
      return `  • ${label}: ${notes}`
    })

  if (commentItems.length === 0) return null

  const subject = `[P66 ALERT] Monthly Inspection Comment — ${facility?.name || ''} — ${inspection.yearMonth}`
  const body = [
    `PHILLIPS 66 FUEL FARM — MONTHLY INSPECTION ALERT`,
    ``,
    `Facility: ${facility?.name || '—'} (${facility?.facilityId || '—'})`,
    `Period: ${inspection.yearMonth}`,
    ``,
    `ITEMS REQUIRING COMMENT/ACTION:`,
    ...commentItems,
    ``,
    `-- Sent from P66 Fuel Farm Inspector`,
  ].join('\n')

  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
