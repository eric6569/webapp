# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, buildless PWA clock designed to run as an always-on Android home-screen app (e.g. bedside display) without burning in an OLED panel. There is no framework, no bundler, no `package.json`, and no test suite — every file is served as-is. All files live flat in the repo root (no `css/`/`js/`/`icons/` subfolders) — keep new files flat too, and update the paths in `index.html`, `manifest.json`, and `service-worker.js`'s `ASSETS` together if you ever rename one.

## Running locally

There is no build step. Serve the directory root with any static file server and open it in a browser:

```bash
python -m http.server 8899
```

Then visit `http://localhost:8899/index.html`. To test on a phone on the same LAN, use the host machine's LAN IP instead of `localhost`. Service worker registration, Wake Lock, and the "add to home screen" fullscreen behavior only make sense on a real Android/Chrome device — they cannot be meaningfully verified from the server logs alone.

There is no lint, build, or test command configured.

## Architecture

Three independent, self-invoked-function modules loaded via plain `<script defer>` tags in [index.html](index.html) (order matters — `app.js` calls into the other two):

- **[clock.js](clock.js)** (`ClockCore`) — owns time state. `tick()` runs every second but only touches the DOM when `HH`, `MM`, or the date actually change, using a `.changing` CSS class (`style.css`) to fade/slide the digit rather than a real flip. It also toggles which block is visible: `now.getSeconds() % CYCLE_SECONDS` drives a 30s cycle where the time (`.time-row`) shows for the first `TIME_DISPLAY_SECONDS` (20s) and the date/weekday (`.date-row`) for the remaining 10s — this repeats twice per minute and the two blocks are mutually exclusive via the `.hidden` (`display:none`) class, not opacity.
- **[oled-guard.js](oled-guard.js)** (`OledGuard`) — all burn-in mitigation lives here, independent of the clock logic:
  - **Drift**: every `DRIFT_INTERVAL_MS` (1.5 min), repositions `#clock-container` to a random `top`/`left` within `POSITION_MIN`–`POSITION_MAX` (25%–75%). This range is a deliberate safety margin — the container is centered via `transform: translate(-50%, -50%)`, so going much past 75% risks clipping the large `16vw` digits off-screen. Widen it only alongside a font-size reduction.
  - **Color rotation**: cycles `--color-1`..`--color-5` (custom properties in `style.css`) in lockstep with each drift tick, not on its own timer.
  - **Blackout**: schedules a full-black `#blackout-overlay` for 10s aligned to the next wall-clock `:00`/`:30` (`msUntilNextHalfHour`), then repeats every 30 min. Drift is skipped while `blackoutActive` is true.
  - **Wake Lock**: requests `navigator.wakeLock.request('screen')` on start and re-requests on `visibilitychange` (Android releases the lock whenever the tab backgrounds).
- **[app.js](app.js)** — the only integration point: starts `ClockCore` and `OledGuard` on `DOMContentLoaded`, then registers `service-worker.js`.

[service-worker.js](service-worker.js) uses a network-first strategy: every fetch tries the network and re-populates the cache from the live response, only falling back to the cache when the network fails (offline). `CACHE_NAME` is a fixed string (`clock-cache`) with no version suffix — because responses are always overwritten from the network first, edits to `ASSETS` files show up immediately for online clients without needing to bump the name.

## Known constraints worth knowing before changing OLED-guard behavior

- Browsers cannot read or set hardware screen brightness — "minimum brightness" is simulated entirely via low-luminance CSS colors, not real dimming.
- Some Android OEMs (Xiaomi, OPPO, Samsung, ...) aggressively kill backgrounded/idle PWAs regardless of Wake Lock; there's no code-level fix, only user-side battery-optimization whitelisting.
- `manifest.json` uses `display: "fullscreen"`; if that mode is unsupported the spec falls back to `standalone` automatically — no code path handles this explicitly.
