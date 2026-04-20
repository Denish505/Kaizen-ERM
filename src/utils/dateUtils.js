/**
 * Date utility functions for IST (Asia/Kolkata, UTC+5:30) timezone.
 * Use these helpers instead of raw new Date().toISOString() to avoid
 * UTC-offset bugs near midnight.
 */

const IST_LOCALE = 'en-IN'
const IST_TZ = 'Asia/Kolkata'

/**
 * Returns today's date string in IST as "YYYY-MM-DD".
 * Safer than new Date().toISOString().split('T')[0] which uses UTC.
 */
export function getTodayIST() {
    return new Date().toLocaleDateString('en-CA', { timeZone: IST_TZ }) // 'en-CA' gives YYYY-MM-DD
}

/**
 * Returns current year/month as "YYYY-MM" in IST.
 */
export function getCurrentMonthIST() {
    const d = new Date()
    const year = d.toLocaleDateString('en-CA', { timeZone: IST_TZ }).slice(0, 4)
    const month = d.toLocaleDateString('en-CA', { timeZone: IST_TZ }).slice(5, 7)
    return `${year}-${month}`
}

/**
 * Returns the current hour (0-23) in IST.
 */
export function getCurrentHourIST() {
    return parseInt(
        new Date().toLocaleString('en-US', { timeZone: IST_TZ, hour: 'numeric', hour12: false }),
        10
    )
}

/**
 * Format a date string or Date object for display in IST.
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} options
 */
export function formatIST(date, options = {}) {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(IST_LOCALE, { timeZone: IST_TZ, ...options })
}

/**
 * Format a datetime string or Date for time display in IST.
 */
export function formatTimeIST(date, options = {}) {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString(IST_LOCALE, { timeZone: IST_TZ, ...options })
}

/**
 * Format a date for full display: e.g. "Monday, 24 February 2026"
 */
export function formatFullDateIST(date) {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(IST_LOCALE, {
        timeZone: IST_TZ,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

/**
 * Format a date for short display: e.g. "Mon, 24 Feb"
 */
export function formatShortDateIST(date) {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(IST_LOCALE, {
        timeZone: IST_TZ,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Returns a new Date object representing now in IST (for display).
 */
export function nowIST() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TZ }))
}
