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
