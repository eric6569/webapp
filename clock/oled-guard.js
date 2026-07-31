const OledGuard = (() => {
  // 25%~75%:在「大範圍漂移」與「避免文字被裁到螢幕外」之間取的安全區間
  const POSITION_MIN = 25;
  const POSITION_MAX = 75;
  const colors = ['var(--color-1)', 'var(--color-2)', 'var(--color-3)'];

  let container, overlay;
  let colorIndex = 0;
  let blackoutActive = false;
  let blackoutDurationMs;
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

  function startDrift(driftIntervalMs) {
    drift();
    setInterval(drift, driftIntervalMs);
  }

  // 對齊到「從午夜起算」的整數倍週期,例如週期 20 分鐘會對齊 :00/:20/:40
  function msUntilNextBoundary(intervalMs) {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msSinceMidnight = now - midnight;
    const next = Math.ceil((msSinceMidnight + 1) / intervalMs) * intervalMs;
    return next - msSinceMidnight;
  }

  function triggerBlackout() {
    blackoutActive = true;
    overlay.classList.add('active');
    setTimeout(() => {
      overlay.classList.remove('active');
      blackoutActive = false;
    }, blackoutDurationMs);
  }

  function scheduleBlackout(blackoutIntervalMs) {
    setTimeout(() => {
      triggerBlackout();
      setInterval(triggerBlackout, blackoutIntervalMs);
    }, msUntilNextBoundary(blackoutIntervalMs));
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
    const settings = Settings.load();
    document.documentElement.style.setProperty('--color-1', settings.color1);
    document.documentElement.style.setProperty('--color-2', settings.color2);
    document.documentElement.style.setProperty('--color-3', settings.color3);
    document.documentElement.style.setProperty('--brightness', settings.brightness / 100);

    blackoutDurationMs = settings.blackoutDurationSec * 1000;

    container = document.getElementById('clock-container');
    overlay = document.getElementById('blackout-overlay');
    startDrift(settings.driftIntervalSec * 1000);
    scheduleBlackout(settings.blackoutIntervalMin * 60 * 1000);
    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return { start, isBlackoutActive: () => blackoutActive };
})();
