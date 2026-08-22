// Convert minutes into readable hour, minute version: E.g. 70 min to 1h 10m
export function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return '0m';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours === 0) return `${remainingMins}m`;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}