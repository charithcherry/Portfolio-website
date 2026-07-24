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
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

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
