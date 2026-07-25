/* =========================================================================
   site.js — shared behavior for all pages.
   Theme toggle, mobile nav, scroll reveals, count-up, active nav highlight.
   Everything is idempotent and no-ops safely when target elements are absent.
   The FOUC-guard snippet (in each page <head>) sets the initial theme class.
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ------------------------------------------------ */
  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('color-theme', isDark ? 'dark' : 'light'); } catch (e) {}
      btn.setAttribute('aria-pressed', String(isDark));
    });
    btn.setAttribute('aria-pressed', String(document.documentElement.classList.contains('dark')));
  }

  /* ---------- Mobile nav -------------------------------------------------- */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () {
      setOpen(!links.classList.contains('open'));
    });
    // Close when a link is chosen or when resizing up to desktop.
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) setOpen(false);
    });
  }

  /* ---------- Active nav link by filename --------------------------------- */
  function initActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-link');
    links.forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- Count-up ---------------------------------------------------- */
  // <span data-countup="240" data-suffix=" FPS" data-prefix="~" data-decimals="0">
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-countup'));
    if (isNaN(target)) return;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var dur = parseInt(el.getAttribute('data-duration') || '1300', 10);

    if (reduceMotion) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Scroll reveal + count-up on view ---------------------------- */
  function initObservers() {
    var reveals = document.querySelectorAll('.reveal');
    var counters = document.querySelectorAll('[data-countup]');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('revealed'); });
      counters.forEach(countUp);
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains('reveal')) el.classList.add('revealed');
        if (el.hasAttribute('data-countup') && !el.dataset.counted) {
          el.dataset.counted = '1';
          countUp(el);
        }
        obs.unobserve(el);
      });
    }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });

    reveals.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Boot -------------------------------------------------------- */
  function boot() {
    initTheme();
    initNav();
    initActiveNav();
    initObservers();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/* =========================================================================
   site.js — visual-experience additions (redesign-v2).
   Scroll-story pipeline, sport-illustration reveals, ambient video,
   hero parallax. Separate IIFE, additive, all no-op safe.
   ========================================================================= */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll-story pipeline (index) ------------------------------ */
  function initScrollStory() {
    var sec = document.getElementById('scrollstory');
    if (!sec) return;
    var stages = [].slice.call(sec.querySelectorAll('.ss-stage'));
    var caps = [].slice.call(sec.querySelectorAll('.ss-caption'));
    var packet = sec.querySelector('.ss-packet');
    var fill = sec.querySelector('.ss-line-fill');
    var idxEl = sec.querySelector('.ss-idx');
    if (!stages.length) return;
    var n = stages.length;

    if (reduceMotion) {
      stages.forEach(function (s) { s.classList.add('is-active'); });
      caps.forEach(function (c) { c.classList.add('is-active'); });
      return;
    }

    var vertMQ = window.matchMedia('(max-width: 680px)');
    var ticking = false;
    function update() {
      ticking = false;
      var rect = sec.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var p = total > 0 ? (-rect.top) / total : 0;
      p = Math.max(0, Math.min(1, p));
      var active = Math.round(p * (n - 1));
      if (active < 0) active = 0; if (active > n - 1) active = n - 1;
      stages.forEach(function (s, i) {
        s.classList.toggle('is-active', i === active);
        s.classList.toggle('is-done', i < active);
      });
      caps.forEach(function (c, i) { c.classList.toggle('is-active', i === active); });
      if (idxEl) idxEl.textContent = ('0' + (active + 1)).slice(-2);
      var pct = 10 + p * 80;
      if (vertMQ.matches) {
        packet.style.left = ''; packet.style.top = pct + '%';
        fill.style.width = ''; fill.style.height = (pct - 10) + '%';
      } else {
        packet.style.top = ''; packet.style.left = pct + '%';
        fill.style.height = ''; fill.style.width = (pct - 10) + '%';
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Sport illustration reveals (experience) -------------------- */
  function initSportViz() {
    var vizzes = [].slice.call(document.querySelectorAll('.sportviz'));
    if (!vizzes.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      vizzes.forEach(function (v) { v.classList.add('viz-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('viz-in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    vizzes.forEach(function (v) { io.observe(v); });
  }

  /* ---------- Ambient video (pause off-screen, respect save-data) -------- */
  function initAmbientVideo() {
    var vids = [].slice.call(document.querySelectorAll('video[data-ambient]'));
    if (!vids.length) return;
    var conn = navigator.connection || navigator.webkitConnection;
    var saveData = !!(conn && conn.saveData);
    vids.forEach(function (v) {
      if (reduceMotion || saveData) { v.pause(); return; } // poster only
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
            else { v.pause(); }
          });
        }, { threshold: 0.25 });
        io.observe(v);
      } else {
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
      }
    });
  }

  /* ---------- Hero background parallax (<=20px translate) ---------------- */
  function initParallax() {
    if (reduceMotion) return;
    var heroes = [].slice.call(document.querySelectorAll('.page-hero, .home-hero'));
    if (!heroes.length) return;
    var ticking = false;
    function upd() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      var py = Math.max(-20, Math.min(20, y * 0.08));
      heroes.forEach(function (h) { h.style.setProperty('--par', py.toFixed(1) + 'px'); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  function boot() {
    initScrollStory();
    initSportViz();
    initAmbientVideo();
    initParallax();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
