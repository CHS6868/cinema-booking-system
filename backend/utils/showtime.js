// The demo cinema operates in Malaysia (UTC+08:00, no daylight saving time).
// Using this time zone explicitly makes dates consistent across Windows PCs,
// remote deployments, and automated tests.
const TIMEZONE = "Asia/Kuala_Lumpur";

function getMalaysiaNow() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map(part => [part.type, part.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

function showtimeStartMs(date, time) {
  if (
    typeof date !== "string" ||
    typeof time !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return Number.NaN;
  }
  // +08:00 is the Malaysian clock offset throughout the year.
  const ms = Date.parse(`${date}T${time}:00+08:00`);
  if (Number.isNaN(ms)) return ms;
  // Reject non-existent dates such as February 30.
  const normalized = new Date(ms + 8 * 3600_000).toISOString().slice(0, 16);
  return normalized === `${date}T${time}` ? ms : Number.NaN;
}

module.exports = { getMalaysiaNow, showtimeStartMs };
