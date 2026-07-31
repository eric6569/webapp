const OledGuard = (() => {
  const DRIFT_INTERVAL_MS = 90 * 1000; // 1.5 分鐘
  const BLACKOUT_INTERVAL_MS = 30 * 60 * 1000;
  const BLACKOUT_DURATION_MS = 10 * 1000;
  // 25%~75%:在「大範圍漂移」與「避免文字被裁到螢幕外」之間取的安全區間
  const POSITION_MIN = 25;
  const POSITION_MAX = 75;
  const colors = ['var(--color-1)', 'var(--color-2)', 'var(--color-3)', 'var(--color-4)', 'var(--color-5)'];

  let container, overlay;
  let colorIndex = 0;
  let blackoutActive = false;
  let wakeLock = null;

  function randomPositionPercent() {
    return Math.random() * (POSITION_MAX - POSITION_MIN) + POSITION_MIN;
  }

  function drift() {
    if (blackoutActive) return;
    container.style.top = `${randomPositionPercent()}%`;
    container.style.left = `${randomPositionPercent()}%`;
    colorIndex = (colorIndex + 1) % colors.length;
    container.style.color = colors[colorIndex];
  }

  function startDrift() {
    drift();
    setInterval(drift, DRIFT_INTERVAL_MS);
  }

  function msUntilNextHalfHour() {
    const now = new Date();
    const next = now.getMinutes() < 30 ? 30 : 60;
    const target = new Date(now);
    target.setMinutes(next, 0, 0);
    return target.getTime() - now.getTime();
  }

  function triggerBlackout() {
    blackoutActive = true;
    overlay.classList.add('active');
    setTimeout(() => {
      overlay.classList.remove('active');
      blackoutActive = false;
    }, BLACKOUT_DURATION_MS);
  }

  function scheduleBlackout() {
    setTimeout(() => {
      triggerBlackout();
      setInterval(triggerBlackout, BLACKOUT_INTERVAL_MS);
    }, msUntilNextHalfHour());
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.warn('Wake Lock 取得失敗:', err);
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }
  }

  function start() {
    container = document.getElementById('clock-container');
    overlay = document.getElementById('blackout-overlay');
    startDrift();
    scheduleBlackout();
    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return { start };
})();
