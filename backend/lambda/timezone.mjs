const formatters = new Map();

function formatterFor(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(timeZone, new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }));
  }
  return formatters.get(timeZone);
}

function offsetAt(timeZone, instant) {
  const parts = Object.fromEntries(formatterFor(timeZone).formatToParts(new Date(instant))
    .filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)) - instant;
}

// Converts an explicit wall-clock schedule to an instant in the configured IANA timezone.
export function zonedTimeToEpoch(localDateTime, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(localDateTime);
  if (!match) throw new Error(`Invalid local schedule date: ${localDateTime}`);
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstPass = wallClockAsUtc - offsetAt(timeZone, wallClockAsUtc);
  return wallClockAsUtc - offsetAt(timeZone, firstPass);
}
