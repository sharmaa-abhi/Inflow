/**
 * Generates a short unique ID (RFC4122 v4 compliant mock or simple random slug).
 * @returns {string} Unique identifier
 */
export function generateId() {
  return 'shape_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Timeout in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
