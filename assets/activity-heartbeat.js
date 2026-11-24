/*
 * Clock-in activity heartbeat (web).
 *
 * While a shift is open this sends POST /api/employee/heartbeat about once a
 * minute with yes/no signals only: did keyboard/mouse/touch/scroll happen in
 * this tab, is the tab visible, does the window have focus, and (Chrome/Edge,
 * only if the person allows it) the browser Idle Detection API's system-wide
 * "user active / idle / screen locked" state. No keys, text, URLs, screenshots
 * or camera are ever read or sent.
 *
 * The server decides when a shift ends. If it reports clocked_in:false the
 * shift was closed (idle or no heartbeats) and onEnded() refreshes the screen.
 */
(function () {
  var timer = null;
  var hadInput = false;
  var idle = null;          // IdleDetector instance when permitted
  var idleState = null;     // { user: 'active'|'idle', screen: 'locked'|'unlocked' }
  var options = {};
  var intervalMs = 60000;
  var listening = false;

  function markInput() { hadInput = true; }

  function listen() {
    if (listening) return;
    listening = true;
    ['keydown', 'mousedown', 'mousemove', 'wheel', 'touchstart', 'scroll', 'pointerdown'].forEach(function (name) {
      window.addEventListener(name, markInput, { passive: true, capture: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && timer) send();
    });
  }

  async function startIdleDetector() {
    if (idle || !('IdleDetector' in window)) return;
    try {
      if ((await IdleDetector.requestPermission()) !== 'granted') return;
      var controller = new AbortController();
      idle = new IdleDetector();
      idle.addEventListener('change', function () {
        idleState = { user: idle.userState, screen: idle.screenState };
      });
      await idle.start({ threshold: 60000, signal: controller.signal });
      idle._controller = controller;
    } catch (e) {
      idle = null;
    }
  }

  function signals() {
    var payload = {
      source: idleState ? 'idle_detector' : 'page',
      input: hadInput,
      visible: document.visibilityState === 'visible',
      focused: document.hasFocus()
    };
    if (idleState) {
      payload.system_active = idleState.user === 'active';
      payload.screen_locked = idleState.screen === 'locked';
    }
    return payload;
  }

  async function send() {
    var body = signals();
    hadInput = false;
    try {
      var res = await fetch('/api/employee/heartbeat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: body })
      });
      if (res.status === 401) { stop(); return; }
      var data = await res.json();
      if (data && data.next_heartbeat_seconds) intervalMs = Math.max(15, data.next_heartbeat_seconds) * 1000;
      if (data && data.success && data.clocked_in === false) {
        stop();
        if (typeof options.onEnded === 'function') options.onEnded(data);
      }
    } catch (e) {
      /* offline: the server notices the missing heartbeats on its own */
    }
  }

  async function resumeIdleDetectorIfAllowed() {
    try {
      if (!('IdleDetector' in window) || !navigator.permissions) return;
      var status = await navigator.permissions.query({ name: 'idle-detection' });
      if (status.state === 'granted') startIdleDetector();
    } catch (e) { /* not supported */ }
  }

  function start(opts) {
    options = opts || {};
    resumeIdleDetectorIfAllowed();
    if (opts && opts.heartbeatSeconds) intervalMs = Math.max(15, opts.heartbeatSeconds) * 1000;
    listen();
    if (timer) return;
    hadInput = true; // starting a shift is itself activity
    send();
    timer = setInterval(send, intervalMs);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  window.ActivityHeartbeat = {
    start: start,
    stop: stop,
    // Call from a click (e.g. Clock In) so the browser can show its permission prompt.
    enableSystemIdle: startIdleDetector,
    running: function () { return !!timer; }
  };
})();
