// Convert array of rows to CSV format
export function toCSV(rows) {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

// Format array of numbers as dash-separated string
export function formatNumbers(numbers) {
  return numbers.join('-')
}
