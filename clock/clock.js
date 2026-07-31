const ClockCore = (() => {
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  // 30 秒一個循環,一分鐘內恰好輪替兩次:時間 20 秒、日期/星期 10 秒
  const CYCLE_SECONDS = 30;
  const TIME_DISPLAY_SECONDS = 20;

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
      dateEl.textContent = `${pad(now.getMonth() + 1)} - ${pad(now.getDate())} - ${weekdays[now.getDay()]}`;
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
