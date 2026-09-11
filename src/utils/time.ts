export function formatSecondsToDigital(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatSecondsToHuman(seconds: number, includeSeconds = false): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs === 0 && mins === 0) {
    return includeSeconds ? `${secs}s` : '0m';
  }

  if (hrs === 0) {
    return includeSeconds && secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  if (mins === 0 && !includeSeconds) {
    return `${hrs}h`;
  }

  if (includeSeconds && secs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }

  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}

export function getTodayDateString(timeZone?: string): string {
  try {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}

export function formatDateLabel(dateString: string, timeZone?: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toLocaleDateString('en-US', {
      timeZone: timeZone || 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatFullDateLabel(dateString: string, timeZone?: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toLocaleDateString('en-US', {
      timeZone: timeZone || 'UTC',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function addDaysToDateString(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

export function getDaysDifference(startDateStr: string, endDateStr: string): number {
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export function isDatePast(dateString: string, todayString: string): boolean {
  return dateString < todayString;
}

export function isDateFuture(dateString: string, todayString: string): boolean {
  return dateString > todayString;
}

export function getTimeGreeting(hours?: number): string {
  const h = hours !== undefined ? hours : new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function generateRandomId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DT-${year}-${random}`;
}

export function generateVerificationHash(certificateId: string, recipient: string): string {
  let hash = 0;
  const str = `${certificateId}:${recipient}:VERIFIED_DAILY_TRACKER`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `V-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}
