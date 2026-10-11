export function formatArmingCountdown(triggerAtMillis, now = Date.now()) {
  const remainingMs = triggerAtMillis - now;
  if (!Number.isFinite(triggerAtMillis) || remainingMs <= 0) {
    return 'Arming soon';
  }
  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `Arming in ${hours} hr${hours === 1 ? '' : 's'} ${minutes} min${minutes === 1 ? '' : 's'}`;
  }
  if (hours > 0) {
    return `Arming in ${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `Arming in ${minutes} min${minutes === 1 ? '' : 's'}`;
}
