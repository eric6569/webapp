const ClockCore = (() => {
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

  let hhEl, mmEl, dateEl, weekdayEl;
  let lastHH = null;
  let lastMM = null;
  let lastDateKey = null;

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
      dateEl.textContent = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;
      weekdayEl.textContent = weekdays[now.getDay()];
      lastDateKey = dateKey;
    }
  }

  function start() {
    hhEl = document.getElementById('hh');
    mmEl = document.getElementById('mm');
    dateEl = document.getElementById('date-str');
    weekdayEl = document.getElementById('weekday-str');
    tick();
    setInterval(tick, 1000);
  }

  return { start };
})();
