/**
 * Generates a short unique ID (RFC4122 v4 compliant mock or simple random slug).
 * @returns {string} Unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

/**
 * Classic trailing-edge debounce function.
 * @param {Function} fn - The function to debounce.
 * @param {number} ms - The debounce delay in milliseconds.
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, ms);
  };
}
