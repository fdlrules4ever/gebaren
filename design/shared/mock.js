/* Gebaren v2 mockups: shared behaviour (icons, screens, player, search box).
   Mockup code to try the designs out. It is not the production code. */
(function () {
  'use strict';

  /* ---------- Icons (24×24, stroke). Every icon sits next to a text label. ---------- */
  var S = function (id, body) { return '<symbol id="i-' + id + '" viewBox="0 0 24 24">' + body + '</symbol>'; };
  document.body.insertAdjacentHTML('afterbegin',
    '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">' +
    S('search', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>') +
    S('play', '<path d="M7.5 4.6v14.8a.9.9 0 0 0 1.37.77l11.8-7.4a.9.9 0 0 0 0-1.54L8.87 3.83A.9.9 0 0 0 7.5 4.6z" fill="currentColor" stroke="none"/>') +
    S('pause', '<rect x="6" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none"/>') +
    S('replay', '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 4v5h5"/>') +
    S('mirror', '<path d="M12 3v18" stroke-dasharray="2.5 2.5"/><path d="M9 7v10l-6-5z"/><path d="M15 7v10l6-5z" fill="currentColor"/>') +
    S('fullscreen', '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>') +
    S('zoom', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M11 8v6M8 11h6"/>') +
    S('star', '<path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"/>') +
    S('clock', '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>') +
    S('keyboard', '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9"/>') +
    S('external', '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10"/>') +
    S('info', '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6h.01"/>') +
    S('notfound', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M8.6 8.6l4.8 4.8M13.4 8.6l-4.8 4.8"/>') +
    S('alert', '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17h.01"/>') +
    S('close', '<path d="M6 6l12 12M18 6 6 18"/>') +
    S('check', '<path d="m5 12.5 4.5 4.5L19 7.5"/>') +
    S('arrow', '<path d="M5 12h14M13 6l6 6-6 6"/>') +
    S('hands', '<path d="M7.5 20.5c-2.2-1.4-3.5-3.7-3.5-6.5V9.5a1.5 1.5 0 0 1 3 0V12"/><path d="M7 12V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M10 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M13 11V5.5a1.5 1.5 0 0 1 3 0V13c0 1 .4 1.7 1 2.2"/><path d="M16 9.5a1.5 1.5 0 0 1 3 0V14c0 3.6-2.6 6.5-6.5 6.5h-1"/>') +
    '</svg>');

  var root = document.documentElement;
  var STATES = ['start', 'gebaar', 'niet-gevonden'];
  var STATE_NAMES = { start: 'Start', gebaar: 'Gebaar', 'niet-gevonden': 'Niet gevonden' };
  var THEMES = [['', 'Systeem'], ['licht', 'Licht'], ['donker', 'Donker']];

  var statusEl = document.getElementById('status');
  function status(msg) {
    if (!statusEl || !msg) return;
    statusEl.textContent = '';
    setTimeout(function () { statusEl.textContent = msg; }, 60);
  }

  /* ---------- Screens via the address: #gebaar, #niet-gevonden-donker, #start-licht-foto ---------- */
  function parseHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    var shot = /-foto$/.test(h); if (shot) h = h.slice(0, -5);
    var theme = '';
    if (/-donker$/.test(h)) { theme = 'donker'; h = h.slice(0, -7); }
    else if (/-licht$/.test(h)) { theme = 'licht'; h = h.slice(0, -6); }
    return { state: STATES.indexOf(h) >= 0 ? h : 'gebaar', theme: theme, shot: shot };
  }
  function hashFor(state, theme) { return '#' + state + (theme ? '-' + theme : ''); }

  /* ---------- Mockup bar (not part of the design) ---------- */
  var bar = document.createElement('details');
  bar.className = 'mock-bar';
  bar.innerHTML = '<summary>Mockup</summary><div class="mock-bar__panel">' +
    '<p>Scherm</p><div class="mock-bar__row" data-mock-states></div>' +
    '<p>Thema</p><div class="mock-bar__row" data-mock-themes></div>' +
    '<a href="index.html">Alle richtingen</a></div>';
  document.body.appendChild(bar);
  function updateBar(s) {
    var st = bar.querySelector('[data-mock-states]');
    var th = bar.querySelector('[data-mock-themes]');
    st.innerHTML = STATES.map(function (x) {
      return '<a href="' + hashFor(x, s.theme) + '" aria-current="' + (x === s.state) + '">' + STATE_NAMES[x] + '</a>';
    }).join('');
    th.innerHTML = THEMES.map(function (t) {
      return '<a href="' + hashFor(s.state, t[0]) + '" aria-current="' + (t[0] === s.theme) + '">' + t[1] + '</a>';
    }).join('');
  }

  /* ---------- Player ---------- */
  var stage = document.querySelector('[data-stage]');
  var video = stage ? stage.querySelector('video') : null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SPEED_NAMES = { '1': 'Normaal', '0.75': 'Langzaam', '0.5': 'Heel langzaam' };

  function syncPlay() {
    /* In screenshot mode the clip is frozen mid-sign, but the controls show the normal playing state. */
    var playing = (!!video && !video.paused) || (root.classList.contains('is-shot') && !reduce.matches);
    document.querySelectorAll('[data-action="toggle"]').forEach(function (b) {
      var use = b.querySelector('use');
      if (use) use.setAttribute('href', playing ? '#i-pause' : '#i-play');
      var l = b.querySelector('[data-label]');
      if (l) l.textContent = playing ? 'Pauze' : 'Afspelen';
    });
    if (stage) stage.classList.toggle('is-paused', !playing);
  }
  function startVideo() {
    if (!video) return;
    if (reduce.matches) { video.pause(); syncPlay(); return; }
    if (root.classList.contains('is-shot')) {
      var freeze = function () { video.pause(); video.currentTime = 1.5; syncPlay(); };
      if (video.readyState >= 1) freeze(); else video.addEventListener('loadedmetadata', freeze, { once: true });
      return;
    }
    var p = video.play();
    if (p && p.catch) p.catch(syncPlay);
  }
  function toggle() {
    if (!video) return;
    if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(syncPlay); }
    else video.pause();
  }
  function replay() {
    if (!video) return;
    video.currentTime = 0;
    var p = video.play(); if (p && p.catch) p.catch(syncPlay);
    status('De video begint opnieuw.');
  }
  function setSpeed(r) {
    if (!video) return;
    video.playbackRate = r; video.defaultPlaybackRate = r;
    document.querySelectorAll('[data-speed]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(parseFloat(b.dataset.speed) === r));
    });
    status('Snelheid: ' + SPEED_NAMES[String(r)] + '.');
  }
  function flag(action, cls, onMsg, offMsg) {
    if (!stage) return;
    var on = !stage.classList.contains(cls);
    stage.classList.toggle(cls, on);
    document.querySelectorAll('[data-action="' + action + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(on));
    });
    status(on ? onMsg : offMsg);
  }
  function mirror() { flag('mirror', 'is-mirrored', 'Spiegel staat aan.', 'Spiegel staat uit.'); }
  function zoom() { flag('zoom', 'is-zoomed', 'Ingezoomd op de gebaarder.', 'Je ziet weer het hele beeld.'); }
  function fullscreen() {
    var target = document.querySelector('[data-fs]') || stage;
    if (!target) return;
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(function () { status('Volledig scherm lukt niet in deze weergave.'); });
    } else if (video && video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  }
  function fav() {
    var btns = document.querySelectorAll('[data-action="fav"]');
    var on = btns.length && btns[0].getAttribute('aria-pressed') !== 'true';
    btns.forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
    status(on ? 'huis staat nu bij Bewaard.' : 'huis staat niet meer bij Bewaard.');
  }

  if (video) {
    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPlay);
    var onReduce = function () { if (reduce.matches) video.pause(); };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
  }

  /* Variants as tabs (APG tabs pattern, manual activation by click, arrows move and select). */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"][data-src]'));
  function selectTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
    });
    if (focus) t.focus();
    var panel = document.getElementById(t.getAttribute('aria-controls'));
    if (panel) panel.setAttribute('aria-labelledby', t.id);
    if (video && video.getAttribute('src') !== t.dataset.src) {
      var wasPlaying = !video.paused;
      video.poster = t.dataset.poster;
      video.src = t.dataset.src;
      video.playbackRate = video.defaultPlaybackRate;
      if (wasPlaying || !reduce.matches) startVideo(); else syncPlay();
    }
    document.querySelectorAll('[data-meaning]').forEach(function (m) { m.textContent = t.dataset.meaning; });
    document.querySelectorAll('[data-source]').forEach(function (a) {
      a.href = 'https://signbank.cls.ru.nl/dictionary/gloss/' + t.dataset.gloss;
    });
    var n = tabs.indexOf(t) + 1;
    document.querySelectorAll('[data-variant-label]').forEach(function (el) {
      el.textContent = 'Gebaar ' + n + ' van ' + tabs.length;
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      selectTab(t, false);
      status('Gebaar ' + (tabs.indexOf(t) + 1) + ' van ' + tabs.length + '. Betekenis: ' + t.dataset.meaning + '.');
    });
    t.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(t), j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j >= 0) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });

  /* ---------- Search box: APG combobox with a list of suggestions ---------- */
  var WORDS = ['huis', 'huisarts', 'huisdeur', 'huishouden', 'huisje', 'huiskamer', 'huiswerk', 'huid', 'huilen',
    'hulp', 'humor', 'hun', 'huren', 'hut', 'dank je', 'dankjewel', 'koffie', 'school', 'café', 'hallo', 'trein',
    'mama', 'slapen', 'eten', 'fiets', 'opa', 'oma', 'water', 'dier', 'auto', 'appel', 'boek', 'brood', 'deur',
    'drinken', 'hond', 'kat', 'melk', 'moeder', 'vader', 'vriend', 'werk', 'winkel', 'zus', 'broer'];
  var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); };
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var input = document.getElementById('q');
  var list = document.getElementById('suggest');
  var hint = document.querySelector('[data-combo-hint]');
  var errorEl = document.querySelector('[data-search-error]');
  var form = document.querySelector('[data-search]');
  var active = -1;

  function options() { return list ? Array.prototype.slice.call(list.querySelectorAll('[role="option"]')) : []; }
  function setActive(i) {
    var opts = options();
    active = i;
    opts.forEach(function (o, k) { o.setAttribute('aria-selected', String(k === i)); });
    if (i >= 0 && opts[i]) {
      input.setAttribute('aria-activedescendant', opts[i].id);
      opts[i].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function closeList() {
    if (!list) return;
    list.hidden = true; list.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
    if (hint) hint.textContent = hint.dataset.default || '';
  }
  function renderSuggestions(q, preselect) {
    if (!list) return;
    var n = norm(q);
    if (!n) { closeList(); return; }
    var hits = WORDS.filter(function (w) { return norm(w).indexOf(n) === 0; }).slice(0, 6);
    if (!hits.length) {
      closeList();
      if (hint) hint.textContent = 'Geen woord gevonden dat zo begint. Druk op Enter om toch te zoeken.';
      status('Geen woord gevonden dat zo begint.');
      return;
    }
    list.innerHTML = hits.map(function (w, i) {
      var cut = Math.min(q.trim().length, w.length);
      return '<li role="option" id="opt-' + i + '" aria-selected="false" data-word="' + esc(w) + '">' +
        '<span class="opt__typed">' + esc(w.slice(0, cut)) + '</span><b class="opt__rest">' + esc(w.slice(cut)) + '</b></li>';
    }).join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(preselect ? 0 : -1);
    var msg = hits.length + (hits.length === 1 ? ' woord' : ' woorden') + ' gevonden. Kies met de pijltjes en Enter.';
    if (hint) hint.textContent = msg;
    status(msg);
  }
  function choose(word) {
    word = (word || '').trim();
    if (!word) {
      if (errorEl) errorEl.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      status('Typ eerst een woord.');
      return;
    }
    if (errorEl) errorEl.hidden = true;
    input.removeAttribute('aria-invalid');
    input.value = word;
    closeList();
    var theme = parseHash().theme;
    var nf = document.querySelector('[data-view="niet-gevonden"]');
    if (norm(word) === 'huis') { location.hash = hashFor('gebaar', theme); return; }
    if (nf) {
      nf.dataset.query = word;
      nf.dataset.status = 'Geen gebaar gevonden voor ' + word + '. Er zijn suggesties.';
      nf.querySelectorAll('[data-echo]').forEach(function (el) { el.textContent = word; });
    }
    location.hash = hashFor('niet-gevonden', theme);
  }

  if (input && list) {
    input.addEventListener('input', function () {
      if (errorEl && input.value.trim()) { errorEl.hidden = true; input.removeAttribute('aria-invalid'); }
      renderSuggestions(input.value, false);
    });
    input.addEventListener('keydown', function (e) {
      var opts = options();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (list.hidden) renderSuggestions(input.value, false);
        if (opts.length) setActive((active + 1) % opts.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (opts.length) setActive(active <= 0 ? opts.length - 1 : active - 1);
      } else if (e.key === 'Escape') {
        if (!list.hidden) { e.preventDefault(); closeList(); } else { input.value = ''; }
      } else if (e.key === 'Enter' && active >= 0 && opts[active]) {
        e.preventDefault();
        choose(opts[active].dataset.word);
      }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    list.addEventListener('click', function (e) {
      var o = e.target.closest('[role="option"]');
      if (o) choose(o.dataset.word);
    });
    if (hint) hint.dataset.default = hint.textContent;
  }
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); choose(input.value); });

  /* ---------- Clicks and keyboard shortcuts ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action], [data-speed], [data-scroll-to]');
    if (!b) return;
    if (b.dataset.speed) { setSpeed(parseFloat(b.dataset.speed)); return; }
    if (b.dataset.scrollTo) {
      if (b.dataset.scrollTo === 'q' && input) { input.focus(); input.scrollIntoView({ block: 'center' }); return; }
      var t = document.getElementById(b.dataset.scrollTo);
      if (t) {
        t.scrollIntoView({ block: 'start' });
        var h = t.querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }
      return;
    }
    switch (b.dataset.action) {
      case 'toggle': toggle(); break;
      case 'replay': replay(); break;
      case 'mirror': mirror(); break;
      case 'zoom': zoom(); break;
      case 'fullscreen': fullscreen(); break;
      case 'fav': fav(); break;
      case 'clear-recent':
        var r = document.querySelector('[data-recent]');
        if (r) r.hidden = true;
        b.hidden = true;
        status('De lijst Laatst gezocht is leeg.');
        break;
    }
  });

  var keysOn = document.getElementById('keys-on');
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (keysOn && !keysOn.checked) return; /* WCAG 2.1.4: shortcuts can be switched off */
    var t = e.target, tag = t.tagName;
    var typing = tag === 'INPUT' && t.type !== 'checkbox' || tag === 'TEXTAREA' || t.isContentEditable;
    if (typing) return;
    if (e.key === '/' && input) { e.preventDefault(); input.focus(); input.select(); return; }
    if (root.dataset.state !== 'gebaar') return;
    var k = e.key.toLowerCase();
    if (k === ' ') {
      if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || tag === 'INPUT') return;
      e.preventDefault(); toggle();
    } else if (k === 'r') replay();
    else if (k === 's') mirror();
    else if (k === 'z' && document.querySelector('[data-action="zoom"]')) zoom();
    else if (k === 'f') fullscreen();
    else if (k === '1') setSpeed(1);
    else if (k === '2') setSpeed(0.75);
    else if (k === '3') setSpeed(0.5);
  });

  /* ---------- Apply the screen from the address ---------- */
  function apply(first) {
    var s = parseHash();
    root.dataset.state = s.state;
    if (s.theme === 'donker') root.dataset.theme = 'dark';
    else if (s.theme === 'licht') root.dataset.theme = 'light';
    else root.removeAttribute('data-theme');
    root.classList.toggle('is-shot', s.shot);
    var view = document.querySelector('[data-view="' + s.state + '"]');
    if (input && view) input.value = view.dataset.query || '';
    if (s.state === 'start') renderSuggestions(input ? input.value : '', true); else closeList();
    if (s.state === 'gebaar') startVideo(); else if (video) video.pause();
    syncPlay();
    updateBar(s);
    if (!first) {
      window.scrollTo(0, 0);
      var h1 = view && view.querySelector('h1');
      if (h1 && s.state !== 'start') { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
      if (s.state !== 'start') status(view && view.dataset.status);
    }
  }
  window.addEventListener('hashchange', function () { apply(false); });
  apply(true);
})();
