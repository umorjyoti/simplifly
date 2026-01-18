/**
 * Utility functions for time conversion between decimal hours and hours+minutes format
 */

/**
 * Convert decimal hours to hours and minutes
 * @param {number} decimalHours - Hours in decimal format (e.g., 2.5)
 * @returns {Object} Object with hours and minutes properties
 */
export const decimalToHoursMinutes = (decimalHours) => {
  if (!decimalHours || isNaN(decimalHours)) {
    return { hours: 0, minutes: 0 };
  }
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  return { hours, minutes };
};

/**
 * Convert hours and minutes to decimal hours
 * @param {number} hours - Hours (integer)
 * @param {number} minutes - Minutes (0-59)
 * @returns {number} Decimal hours (e.g., 2.5 for 2h 30m)
 */
export const hoursMinutesToDecimal = (hours, minutes) => {
  const h = parseInt(hours) || 0;
  const m = parseInt(minutes) || 0;
  
  // Ensure minutes are between 0 and 59
  const normalizedMinutes = Math.max(0, Math.min(59, m));
  
  return h + (normalizedMinutes / 60);
};

/**
 * Format decimal hours for display
 * @param {number} decimalHours - Hours in decimal format
 * @returns {string} Formatted string (e.g., "2h 30m" or "2h" or "30m")
 */
export const formatHoursDisplay = (decimalHours) => {
  if (!decimalHours || isNaN(decimalHours) || decimalHours === 0) {
    return '0h';
  }
  
  const { hours, minutes } = decimalToHoursMinutes(decimalHours);
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};
