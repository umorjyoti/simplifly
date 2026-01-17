/**
 * Utility functions for period calculations (weekly, monthly, quarterly)
 * Handles edge cases like February leap years, month end dates, etc.
 */

/**
 * Get the start date of a month
 * @param {Date} date - Any date within the month
 * @returns {Date} - First day of the month at 00:00:00
 */
function getMonthStart(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month, 1, 0, 0, 0, 0);
}

/**
 * Get the end date of a month (handles edge cases like February)
 * @param {Date} date - Any date within the month
 * @returns {Date} - Last day of the month at 23:59:59.999
 */
function getMonthEnd(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  // Get first day of next month, then subtract 1ms
  const nextMonth = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return new Date(nextMonth.getTime() - 1);
}

/**
 * Get the start date of a week (Monday)
 * @param {Date} date - Any date within the week
 * @returns {Date} - Monday of the week at 00:00:00
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end date of a week (Sunday)
 * @param {Date} date - Any date within the week
 * @returns {Date} - Sunday of the week at 23:59:59.999
 */
function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get the start date of a quarter
 * @param {Date} date - Any date within the quarter
 * @returns {Date} - First day of the quarter at 00:00:00
 */
function getQuarterStart(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarterMonth = Math.floor(month / 3) * 3; // 0, 3, 6, or 9
  return new Date(year, quarterMonth, 1, 0, 0, 0, 0);
}

/**
 * Get the end date of a quarter
 * @param {Date} date - Any date within the quarter
 * @returns {Date} - Last day of the quarter at 23:59:59.999
 */
function getQuarterEnd(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarterMonth = Math.floor(month / 3) * 3;
  const nextQuarterMonth = quarterMonth + 3;
  const nextQuarterStart = new Date(year, nextQuarterMonth, 1, 0, 0, 0, 0);
  return new Date(nextQuarterStart.getTime() - 1);
}

/**
 * Get period start and end dates based on period type
 * @param {Date} date - Reference date
 * @param {String} periodType - 'weekly', 'monthly', or 'quarterly'
 * @returns {Object} - { start: Date, end: Date }
 */
function getPeriodRange(date, periodType) {
  switch (periodType) {
    case 'weekly':
      return {
        start: getWeekStart(date),
        end: getWeekEnd(date)
      };
    case 'monthly':
      return {
        start: getMonthStart(date),
        end: getMonthEnd(date)
      };
    case 'quarterly':
      return {
        start: getQuarterStart(date),
        end: getQuarterEnd(date)
      };
    default:
      // Default to monthly
      return {
        start: getMonthStart(date),
        end: getMonthEnd(date)
      };
  }
}

/**
 * Check if a date falls within a period
 * @param {Date} date - Date to check
 * @param {Date} periodStart - Period start date
 * @param {Date} periodEnd - Period end date
 * @returns {Boolean}
 */
function isDateInPeriod(date, periodStart, periodEnd) {
  if (!date) return false;
  const d = new Date(date);
  return d >= periodStart && d <= periodEnd;
}

/**
 * Get all months in a year as an array of { year, month, start, end }
 * @param {Number} year - Year number
 * @returns {Array} - Array of month objects
 */
function getMonthsInYear(year) {
  const months = [];
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 1);
    months.push({
      year,
      month: month + 1, // 1-12 for display
      monthIndex: month, // 0-11 for Date operations
      start: getMonthStart(date),
      end: getMonthEnd(date),
      name: date.toLocaleString('default', { month: 'long' })
    });
  }
  return months;
}

/**
 * Get all years that have tickets (for navigation)
 * @param {Array} tickets - Array of ticket objects
 * @returns {Array} - Sorted array of unique years
 */
function getYearsFromTickets(tickets) {
  const years = new Set();
  tickets.forEach(ticket => {
    if (ticket.goLiveDate) {
      const year = new Date(ticket.goLiveDate).getFullYear();
      years.add(year);
    }
  });
  return Array.from(years).sort((a, b) => b - a); // Descending order
}

/**
 * Format period label for display
 * @param {Date} date - Date within the period
 * @param {String} periodType - 'weekly', 'monthly', or 'quarterly'
 * @returns {String} - Formatted label
 */
function formatPeriodLabel(date, periodType) {
  switch (periodType) {
    case 'weekly':
      const weekStart = getWeekStart(date);
      const weekEnd = getWeekEnd(date);
      return `${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    case 'monthly':
      return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    default:
      return date.toLocaleDateString();
  }
}

module.exports = {
  getMonthStart,
  getMonthEnd,
  getWeekStart,
  getWeekEnd,
  getQuarterStart,
  getQuarterEnd,
  getPeriodRange,
  isDateInPeriod,
  getMonthsInYear,
  getYearsFromTickets,
  formatPeriodLabel
};
