/* Attendance records use the server calendar; the live clock is shown locally. */
(() => {
  const clockFormat = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  function epoch(value) {
    return typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN;
  }

  function snapshot(serverNow) {
    const parsed = epoch(serverNow);
    const base = Number.isFinite(parsed) ? parsed : Date.now();
    const received = performance.now();
    return () => new Date(base + performance.now() - received);
  }

  function elapsed(shift, serverNow) {
    const start = epoch(shift.clock_in_at);
    const now = epoch(serverNow);
    if (Number.isFinite(start) && Number.isFinite(now)) {
      const clock = snapshot(serverNow);
      return () => Math.max(0, Math.floor((clock().getTime() - start) / 1000));
    }

    // Older servers supply both times as local wall times. Use their difference
    // for elapsed time only; a timestamp without a zone cannot set a local clock.
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(AM|PM)$/i.exec(shift.clock_in || '');
    if (!match || !/^\d{4}-\d{2}-\d{2}$/.test(shift.date || '')) return () => null;
    const [, h, m, s = '00', part] = match;
    const hours = Number(h) % 12 + (part.toUpperCase() === 'PM' ? 12 : 0);
    const wall = shift.date + 'T' + String(hours).padStart(2, '0') + ':' + m + ':' + s;
    const unzoned = (value) => typeof value === 'string'
      ? Date.parse(value.replace(/(?:Z|[+-]\d{2}:\d{2})$/i, '') + 'Z') : NaN;
    const delta = unzoned(serverNow) - unzoned(wall);
    const received = performance.now();
    return () => Number.isFinite(delta) ? Math.max(0, Math.floor((delta + performance.now() - received) / 1000)) : null;
  }

  function formatDuration(seconds) {
    if (seconds === null) return '—';
    const pad = (value) => String(value).padStart(2, '0');
    return pad(Math.floor(seconds / 3600)) + 'h ' + pad(Math.floor(seconds / 60) % 60) + 'm ' + pad(seconds % 60) + 's';
  }

  function shiftStart(shift) {
    const parsed = epoch(shift.clock_in_at);
    return Number.isFinite(parsed) ? clockFormat.format(parsed) : (shift.clock_in ? shift.clock_in + ' (server time)' : '—');
  }

  window.WorkspaceClock = { snapshot, elapsed, formatDuration, shiftStart, formatTime: (date) => clockFormat.format(date) };
})();
