const Settings = (() => {
  const STORAGE_KEY = 'clock-settings-v1';

  const DEFAULTS = {
    color1: '#464646',
    color2: '#4a4438',
    color3: '#14454a',
    brightness: 100,
    timeSeconds: 20,
    dateSeconds: 10,
    fontSizeVw: 16,
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
