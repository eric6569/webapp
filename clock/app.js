const Settings = (() => {
  const STORAGE_KEY = 'clock-settings-v1';

  const DEFAULTS = {
    color1: '#464646',
    color2: '#4a4438',
    color3: '#14454a',
    brightness: 100,
    timeSeconds: 20,
    dateSeconds: 10,
    fontSizeVw: 10,
    driftIntervalSec: 90,
    blackoutIntervalMin: 30,
    blackoutDurationSec: 10,
  };

  const CONFIRM_TIMEOUT_MS = 5000;
  const PANEL_IDLE_TIMEOUT_MS = 15000;

  let appEl, confirmEl, panelEl, formEls;
  let confirmTimer = null;
  let idleTimer = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch (err) {
      return { ...DEFAULTS };
    }
  }

  function save(values) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }

  function applyToForm(values) {
    formEls.color1.value = values.color1;
    formEls.color2.value = values.color2;
    formEls.color3.value = values.color3;
    formEls.brightness.value = values.brightness;
    formEls.timeSeconds.value = values.timeSeconds;
    formEls.dateSeconds.value = values.dateSeconds;
    formEls.fontSizeVw.value = values.fontSizeVw;
    formEls.driftIntervalSec.value = values.driftIntervalSec;
    formEls.blackoutIntervalMin.value = values.blackoutIntervalMin;
    formEls.blackoutDurationSec.value = values.blackoutDurationSec;
    updateValueLabels();
  }

  function readForm() {
    return {
      color1: formEls.color1.value,
      color2: formEls.color2.value,
      color3: formEls.color3.value,
      brightness: Number(formEls.brightness.value),
      timeSeconds: Number(formEls.timeSeconds.value),
      dateSeconds: Number(formEls.dateSeconds.value),
      fontSizeVw: Number(formEls.fontSizeVw.value),
      driftIntervalSec: Number(formEls.driftIntervalSec.value),
      blackoutIntervalMin: Number(formEls.blackoutIntervalMin.value),
      blackoutDurationSec: Number(formEls.blackoutDurationSec.value),
    };
  }

  function updateValueLabels() {
    document.getElementById('set-brightness-val').textContent = `${formEls.brightness.value}%`;
    document.getElementById('set-time-seconds-val').textContent = `${formEls.timeSeconds.value}s`;
    document.getElementById('set-date-seconds-val').textContent = `${formEls.dateSeconds.value}s`;
    document.getElementById('set-font-size-val').textContent = `${formEls.fontSizeVw.value}vw`;
    document.getElementById('set-drift-interval-val').textContent = `${formEls.driftIntervalSec.value}s`;
    document.getElementById('set-blackout-interval-val').textContent = `${formEls.blackoutIntervalMin.value}min`;
    document.getElementById('set-blackout-duration-val').textContent = `${formEls.blackoutDurationSec.value}s`;
  }

  function clearConfirmTimer() {
    if (confirmTimer) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function showConfirm() {
    if (OledGuard.isBlackoutActive()) return;
    confirmEl.classList.remove('hidden');
    clearConfirmTimer();
    confirmTimer = setTimeout(hideConfirm, CONFIRM_TIMEOUT_MS);
  }

  function hideConfirm() {
    confirmEl.classList.add('hidden');
    clearConfirmTimer();
  }

  function resetIdleTimer() {
    clearIdleTimer();
    idleTimer = setTimeout(closePanel, PANEL_IDLE_TIMEOUT_MS);
  }

  function openPanel() {
    hideConfirm();
    applyToForm(load());
    panelEl.classList.remove('hidden');
    resetIdleTimer();
  }

  function closePanel() {
    panelEl.classList.add('hidden');
    clearIdleTimer();
  }

  function handleAppTap(event) {
    if (panelEl.contains(event.target) || confirmEl.contains(event.target)) return;
    if (!panelEl.classList.contains('hidden') || !confirmEl.classList.contains('hidden')) return;
    showConfirm();
  }

  function init() {
    appEl = document.getElementById('app');
    confirmEl = document.getElementById('tap-confirm');
    panelEl = document.getElementById('settings-panel');
    formEls = {
      color1: document.getElementById('set-color1'),
      color2: document.getElementById('set-color2'),
      color3: document.getElementById('set-color3'),
      brightness: document.getElementById('set-brightness'),
      timeSeconds: document.getElementById('set-time-seconds'),
      dateSeconds: document.getElementById('set-date-seconds'),
      fontSizeVw: document.getElementById('set-font-size'),
      driftIntervalSec: document.getElementById('set-drift-interval'),
      blackoutIntervalMin: document.getElementById('set-blackout-interval'),
      blackoutDurationSec: document.getElementById('set-blackout-duration'),
    };

    appEl.addEventListener('click', handleAppTap);
    document.getElementById('confirm-open-settings').addEventListener('click', openPanel);
    document.getElementById('cancel-open-settings').addEventListener('click', hideConfirm);

    panelEl.addEventListener('input', () => {
      updateValueLabels();
      resetIdleTimer();
    });
    panelEl.addEventListener('click', resetIdleTimer);

    document.getElementById('settings-reset').addEventListener('click', () => applyToForm(DEFAULTS));
    document.getElementById('settings-cancel').addEventListener('click', closePanel);
    document.getElementById('settings-save').addEventListener('click', () => {
      save(readForm());
      location.reload();
    });
  }

  return { load, DEFAULTS, init };
})();

const ClockCore = (() => {
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  // 由設定值決定:一個循環 = 時間顯示秒數 + 日期顯示秒數
  let CYCLE_SECONDS;
  let TIME_DISPLAY_SECONDS;

  let hhEl, mmEl, dateEl, timeRowEl, dateRowEl;
  let lastHH = null;
  let lastMM = null;
  let lastDateKey = null;
  let showingTime = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateDigit(el, newValue) {
    if (el.textContent === newValue) return;
    el.classList.add('changing');
    setTimeout(() => {
      el.textContent = newValue;
      el.classList.remove('changing');
    }, 300);
  }

  function tick() {
    const now = new Date();
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());

    if (hh !== lastHH) {
      updateDigit(hhEl, hh);
      lastHH = hh;
    }
    if (mm !== lastMM) {
      updateDigit(mmEl, mm);
      lastMM = mm;
    }

    const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (dateKey !== lastDateKey) {
      dateEl.textContent = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${weekdays[now.getDay()]}`;
      lastDateKey = dateKey;
    }

    const shouldShowTime = now.getSeconds() % CYCLE_SECONDS < TIME_DISPLAY_SECONDS;
    if (shouldShowTime !== showingTime) {
      timeRowEl.classList.toggle('hidden', !shouldShowTime);
      dateRowEl.classList.toggle('hidden', shouldShowTime);
      showingTime = shouldShowTime;
    }
  }

  function start() {
    const settings = Settings.load();
    TIME_DISPLAY_SECONDS = settings.timeSeconds;
    CYCLE_SECONDS = settings.timeSeconds + settings.dateSeconds;
    document.documentElement.style.setProperty('--font-size', `${settings.fontSizeVw}vw`);

    hhEl = document.getElementById('hh');
    mmEl = document.getElementById('mm');
    dateEl = document.getElementById('date-str');
    timeRowEl = document.querySelector('.time-row');
    dateRowEl = document.querySelector('.date-row');
    tick();
    setInterval(tick, 1000);
  }

  return { start };
})();

const OledGuard = (() => {
  const colors = ['var(--color-1)', 'var(--color-2)', 'var(--color-3)'];

  let container, overlay, metricsEl;
  let colorIndex = 0;
  let blackoutActive = false;
  let blackoutDurationMs;
  let wakeLock = null;
  let rangeX = { min: 25, max: 75 };
  let rangeY = { min: 25, max: 75 };

  // 用隱藏的量測元素(內容是最長的日期格式 "00-00-SUN")算出目前字體大小實際會佔多寬/多高,
  // 換算成安全漂移範圍,避免字體變大或日期字串比時間長時把文字擠出螢幕外
  function updateSafeRange() {
    const halfWPercent = (metricsEl.offsetWidth / 2 / window.innerWidth) * 100;
    const halfHPercent = (metricsEl.offsetHeight / 2 / window.innerHeight) * 100;
    const clamp = (halfPercent) => {
      const min = Math.min(45, Math.max(2, halfPercent));
      return { min, max: 100 - min };
    };
    rangeX = clamp(halfWPercent);
    rangeY = clamp(halfHPercent);
  }

  function randomPositionPercent(range) {
    return Math.random() * (range.max - range.min) + range.min;
  }

  function drift() {
    if (blackoutActive) return;
    container.style.top = `${randomPositionPercent(rangeY)}%`;
    container.style.left = `${randomPositionPercent(rangeX)}%`;
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
    metricsEl = document.getElementById('text-metrics');
    updateSafeRange();
    window.addEventListener('resize', updateSafeRange);

    startDrift(settings.driftIntervalSec * 1000);
    scheduleBlackout(settings.blackoutIntervalMin * 60 * 1000);
    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return { start, isBlackoutActive: () => blackoutActive };
})();

document.addEventListener('DOMContentLoaded', () => {
  ClockCore.start();
  OledGuard.start();
  Settings.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch((err) => {
      console.warn('Service Worker 註冊失敗:', err);
    });
  }
});
