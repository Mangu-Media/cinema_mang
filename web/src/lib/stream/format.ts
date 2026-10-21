export function formatRuntime(min: number) {
  if (!Number.isFinite(min) || min <= 0) return "";
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

export function formatClockMin(minsFromMidnight: number) {
  const wrapped = ((minsFromMidnight % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function remainingLabel(progress: number, runtimeMin: number) {
  const left = Math.max(1, Math.round((1 - progress) * runtimeMin));
  return `${left}m left`;
}

export function formatPlayerClock(current: number, duration: number, remaining: boolean) {
  if (remaining) return `−${formatClock(Math.max(0, duration - current))}`;
  return formatClock(current);
}
