// Convert local Date to as string YYYY-MM-DD
// Avoids toISOString(), which converts to UTC first and can roll over to the wrong calendar day depending on timezone offset and time of day
export function toLocalDateString(date: Date): string {
  // Extract year, month, date from Date object
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Return today's date as string YYYY-MM-DD
// Would merge but clarity in function name > clarity just in variable name
export function todayLocalDateString(): string {
  // new Date() makes Date object of current time
  return toLocalDateString(new Date());
}