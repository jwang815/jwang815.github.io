/**
 * Waypoint Journeys — i18n System
 * Pill-style EN | 中文 language toggle with IP-based auto-detection.
 * 
 * Usage: Each page loads this file + its translation data file.
 * Translation data sets window.__i18n = { key: { en: "...", zh: "..." }, ... }
 * HTML elements use data-i18n="key" for text replacement.
 * Elements with data-i18n-placeholder="key" get placeholder translated.
 * Elements with data-i18n-html="key" get innerHTML replaced (for line breaks).
 */

(function() {
  'use strict';

  var STORAGE_KEY = 'wp_lang';
  var currentLang = 'en';
  var _mem = {};

  function safeGet(key) {
    // Try cookie
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
      if (m) return decodeURIComponent(m[1]);
    } catch(e) {}
    return _mem[key] || null;
  }
  function safeSet(key, val) {
    _mem[key] = val;
    try { document.cookie = key + '=' + encodeURIComponent(val) + ';path=/;max-age=31536000;SameSite=Lax'; } catch(e) {}
  }

  // ── Load Chinese fonts lazily ──
  var zhFontsLoaded = false;
  function loadChineseFonts() {
    if (zhFontsLoaded) return;
    zhFontsLoaded = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  // ── Inject pill toggle CSS ──
  var style = document.createElement('style');
  style.textContent = [
    /* Desktop: toggle in nav after links */
    '.lang-toggle{display:flex;align-items:center;border:1px solid rgba(196,148,74,0.35);border-radius:20px;overflow:hidden;margin-left:20px;flex-shrink:0;height:30px;background:transparent;transition:border-color 0.3s}',
    '.lang-toggle button{font-family:var(--font-body,"Source Sans 3",sans-serif);font-size:0.68rem;font-weight:500;letter-spacing:0.08em;padding:5px 14px;border:none;background:transparent;color:rgba(245,237,224,0.55);cursor:pointer;transition:all 0.3s ease;line-height:1;white-space:nowrap;height:100%}',
    '.lang-toggle button.active{background:rgba(196,148,74,0.18);color:#C4944A;font-weight:600}',
    '.lang-toggle button:hover:not(.active){color:rgba(245,237,224,0.85)}',
    '.lang-toggle-sep{width:1px;height:14px;background:rgba(196,148,74,0.3);flex-shrink:0}',
    /* Desktop-only toggle (hidden on mobile) */
    '.lang-toggle--desktop{display:flex}',
    '@media(max-width:900px){.lang-toggle--desktop{display:none}}',
    /* Mobile nav bar toggle: sits next to hamburger, visible when menu is closed */
    '.lang-toggle--mobile-nav{display:none;margin-right:16px;height:28px}',
    '.lang-toggle--mobile-nav button{font-size:0.62rem;padding:4px 10px}',
    '@media(max-width:900px){.lang-toggle--mobile-nav{display:flex}}',
    /* Mobile menu overlay toggle: visible inside the full-screen menu */
    '.lang-toggle--overlay{display:none;margin-top:24px;height:34px;border-color:rgba(196,148,74,0.5)}',
    '.lang-toggle--overlay button{font-size:0.8rem;padding:7px 20px}',
    '@media(max-width:900px){.lang-toggle--overlay{display:flex}}',
    /* Chinese font override */
    'html[lang="zh-CN"]{--font-display:"Noto Serif SC","Playfair Display",Georgia,serif;--font-body:"Noto Sans SC","Source Sans 3","Segoe UI",Helvetica,Arial,sans-serif}'
  ].join('\n');
  document.head.appendChild(style);

  // ── Create pill toggle element ──
  function createToggle() {
    var wrapper = document.createElement('div');
    wrapper.className = 'lang-toggle';
    wrapper.setAttribute('role', 'radiogroup');
    wrapper.setAttribute('aria-label', 'Language');

    var btnEn = document.createElement('button');
    btnEn.textContent = 'EN';
    btnEn.setAttribute('role', 'radio');
    btnEn.dataset.lang = 'en';

    var sep = document.createElement('span');
    sep.className = 'lang-toggle-sep';

    var btnZh = document.createElement('button');
    btnZh.textContent = '中文';
    btnZh.setAttribute('role', 'radio');
    btnZh.dataset.lang = 'zh';

    wrapper.appendChild(btnEn);
    wrapper.appendChild(sep);
    wrapper.appendChild(btnZh);

    wrapper.addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      setLanguage(btn.dataset.lang);
    });

    return wrapper;
  }

  // ── Insert toggles into the page ──
  function insertToggles() {
    var nav = document.querySelector('#mainNav, #navbar');
    if (!nav) return;

    var navLinks = nav.querySelector('.nav-links');
    var hamburger = nav.querySelector('.hamburger');

    // Desktop toggle: after nav-links, hidden on mobile
    if (navLinks) {
      var desktopToggle = createToggle();
      desktopToggle.classList.add('lang-toggle--desktop');
      navLinks.parentNode.insertBefore(desktopToggle, navLinks.nextSibling);
    }

    // Mobile nav bar toggle: before hamburger, hidden on desktop
    if (hamburger) {
      var mobileToggle = createToggle();
      mobileToggle.classList.add('lang-toggle--mobile-nav');
      hamburger.parentNode.insertBefore(mobileToggle, hamburger);
    }

    // Mobile menu overlay toggle: inside the full-screen menu
    var mobileMenu = document.querySelector('.mobile-menu, #mobileMenu');
    if (mobileMenu) {
      var overlayToggle = createToggle();
      overlayToggle.classList.add('lang-toggle--overlay');
      mobileMenu.appendChild(overlayToggle);
    }
  }

  // ── Apply translations ──
  function applyLanguage(lang) {
    var translations = window.__i18n || {};
    
    // data-i18n: replace textContent
    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var key = textEls[i].getAttribute('data-i18n');
      if (translations[key] && translations[key][lang] !== undefined) {
        textEls[i].textContent = translations[key][lang];
      }
    }

    // data-i18n-html: replace innerHTML (for <br> etc)
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlEls.length; j++) {
      var hKey = htmlEls[j].getAttribute('data-i18n-html');
      if (translations[hKey] && translations[hKey][lang] !== undefined) {
        htmlEls[j].innerHTML = translations[hKey][lang];
      }
    }

    // data-i18n-placeholder: translate placeholders
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < phEls.length; k++) {
      var pKey = phEls[k].getAttribute('data-i18n-placeholder');
      if (translations[pKey] && translations[pKey][lang] !== undefined) {
        phEls[k].setAttribute('placeholder', translations[pKey][lang]);
      }
    }

    // Load Chinese fonts if needed
    if (lang === 'zh') loadChineseFonts();

    // Update html lang attribute
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    // Update active state on all toggles
    var allBtns = document.querySelectorAll('.lang-toggle button');
    for (var m = 0; m < allBtns.length; m++) {
      var isActive = allBtns[m].dataset.lang === lang;
      allBtns[m].classList.toggle('active', isActive);
      allBtns[m].setAttribute('aria-checked', isActive ? 'true' : 'false');
    }
  }

  // ── Set language ──
  function setLanguage(lang) {
    currentLang = lang;
    safeSet(STORAGE_KEY, lang);
    applyLanguage(lang);
  }

  // ── Detect language preference ──
  function detectLanguage(callback) {
    // 1. Check stored preference first (user's explicit choice)
    var stored = safeGet(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') {
      callback(stored);
      return;
    }

    // 2. Check browser language
    var browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browserLang.startsWith('zh')) {
      callback('zh');
      return;
    }

    // 3. IP-based detection via free geolocation API
    // Use a timeout so the page doesn't wait too long
    var done = false;
    var timer = setTimeout(function() {
      if (!done) { done = true; callback('en'); }
    }, 2000);

    fetch('https://ipapi.co/json/', { mode: 'cors' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!done) {
          done = true;
          clearTimeout(timer);
          // CN = China, TW = Taiwan, HK = Hong Kong, MO = Macau, SG = Singapore
          var zhCountries = ['CN', 'TW', 'HK', 'MO'];
          callback(zhCountries.indexOf(data.country_code) !== -1 ? 'zh' : 'en');
        }
      })
      .catch(function() {
        if (!done) { done = true; clearTimeout(timer); callback('en'); }
      });
  }

  // ── Initialize ──
  function init() {
    insertToggles();
    detectLanguage(function(lang) {
      setLanguage(lang);
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for programmatic use
  window.WPi18n = {
    setLanguage: setLanguage,
    getCurrentLang: function() { return currentLang; }
  };
})();
