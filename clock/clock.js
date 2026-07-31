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
