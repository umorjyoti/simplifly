/**
 * Frontend utility functions for period calculations
 * Mirrors backend periodUtils.js logic
 */

/**
 * Get the start date of a month
 */
export function getMonthStart(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month, 1, 0, 0, 0, 0);
}

/**
 * Get the end date of a month (handles edge cases like February)
 */
export function getMonthEnd(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const nextMonth = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return new Date(nextMonth.getTime() - 1);
}

/**
 * Get the start date of a week (Monday)
 */
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end date of a week (Sunday)
 */
export function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get the start date of a quarter
 */
export function getQuarterStart(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarterMonth = Math.floor(month / 3) * 3;
  return new Date(year, quarterMonth, 1, 0, 0, 0, 0);
}

/**
 * Get the end date of a quarter
 */
export function getQuarterEnd(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarterMonth = Math.floor(month / 3) * 3;
  const nextQuarterMonth = quarterMonth + 3;
  const nextQuarterStart = new Date(year, nextQuarterMonth, 1, 0, 0, 0, 0);
  return new Date(nextQuarterStart.getTime() - 1);
}

/**
 * Get period start and end dates based on period type
 */
export function getPeriodRange(date, periodType) {
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
      return {
        start: getMonthStart(date),
        end: getMonthEnd(date)
      };
  }
}

/**
 * Check if a date falls within a period
 */
export function isDateInPeriod(date, periodStart, periodEnd) {
  if (!date) return false;
  const d = new Date(date);
  return d >= periodStart && d <= periodEnd;
}

/**
 * Get all months in a year
 */
export function getMonthsInYear(year) {
  const months = [];
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 1);
    months.push({
      year,
      month: month + 1,
      monthIndex: month,
      start: getMonthStart(date),
      end: getMonthEnd(date),
      name: date.toLocaleString('default', { month: 'long' })
    });
  }
  return months;
}

/**
 * Get all years that have tickets
 */
export function getYearsFromTickets(tickets) {
  const years = new Set();
  tickets.forEach(ticket => {
    if (ticket.goLiveDate) {
      const year = new Date(ticket.goLiveDate).getFullYear();
      years.add(year);
    }
  });
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Format period label for display
 */
export function formatPeriodLabel(date, periodType) {
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

/**
 * Get previous period date
 */
export function getPreviousPeriod(date, periodType) {
  const d = new Date(date);
  switch (periodType) {
    case 'weekly':
      d.setDate(d.getDate() - 7);
      return d;
    case 'monthly':
      d.setMonth(d.getMonth() - 1);
      return d;
    case 'quarterly':
      d.setMonth(d.getMonth() - 3);
      return d;
    default:
      d.setMonth(d.getMonth() - 1);
      return d;
  }
}

/**
 * Get next period date
 */
export function getNextPeriod(date, periodType) {
  const d = new Date(date);
  switch (periodType) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      return d;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      return d;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      return d;
    default:
      d.setMonth(d.getMonth() + 1);
      return d;
  }
}
