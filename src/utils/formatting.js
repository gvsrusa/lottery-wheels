/**
 * Convert array of rows to CSV format
 * @param {Array<Array>} rows - 2D array of data
 * @returns {string} - CSV formatted string
 */
export function toCSV(rows) {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

/**
 * Format array of numbers as hyphen-separated string
 * @param {Array<number>} numbers - Array of numbers to format
 * @returns {string} - Hyphen-separated number string
 */
export function formatNumbers(numbers) {
  return numbers.join('-')
}
