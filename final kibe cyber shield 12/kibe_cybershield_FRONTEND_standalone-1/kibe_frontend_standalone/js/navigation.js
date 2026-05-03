// ============================================================
// KIBE CYBERSHIELD — navigation.js (Standalone Frontend)
// Dashboard SPA navigation: sidebar section switcher,
// mobile sidebar toggle, topbar clock, active link highlighting,
// scroll animations, logout interception, and user info sync.
// ============================================================

'use strict';

// ── ACTIVE NAV LINK (PUBLIC PAGES) ───────────────────────────
(function setActiveNavLink() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .nav-links a, .navbar-link').forEach(function(link) {
    var href = link.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// ── MOBILE SIDEBAR TOGGLE ─────────────────────────────────────
(function initMobileSidebar() {
  var toggle  = document.getElementById('sidebarToggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  var closeBtn = document.getElementById('sidebarClose');
  if (!sidebar) return;

  function openSidebar()  {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (toggle)  toggle.addEventListener('click',  openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay)  overlay.addEventListener('click', closeSidebar);

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSidebar();
  });
})();

// ── SPA SECTION SWITCHER ──────────────────────────────────────
// Handles sidebar-links, quick-action links, topbar icon buttons,
// and any element with data-section="..." attribute.
(function initSectionSwitcher() {
  var defaultSection = (function() {
    var hash = window.location.hash.replace('#', '');
    return hash || 'overview';
  })();

  function showSection(name) {
    // Hide all
    document.querySelectorAll('[data-content-section]').forEach(function(s) {
      s.classList.add('hidden');
    });
    // Show target
    var target = document.querySelector('[data-content-section="' + name + '"]');
    if (target) {
      target.classList.remove('hidden');
      window.location.hash = name;
    }
    // Update active sidebar link
    document.querySelectorAll('.sidebar-link[data-section]').forEach(function(l) {
      l.classList.toggle('active', l.dataset.section === name);
    });
    // Update page title in topbar
    var titleEl = document.getElementById('topbarSectionTitle');
    if (titleEl) {
      titleEl.textContent = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    }
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
      var sidebar  = document.getElementById('sidebar');
      var overlay  = document.getElementById('sidebarOverlay');
      if (sidebar)  sidebar.classList.remove('open');
      if (overlay)  overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Event delegation — catch all data-section clicks
  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-section]');
    if (!el) return;
    // Skip logout
    if (el.dataset.section === 'logout' || el.hasAttribute('data-logout')) return;
    e.preventDefault();
    showSection(el.dataset.section);
  });

  // Activate default section on load
  if (document.querySelector('[data-content-section]')) {
    showSection(defaultSection);
  }
})();

// ── LOGOUT HANDLER ────────────────────────────────────────────
(function initLogout() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-logout], a[href="login.html"][data-logout]');
    if (!btn) return;
    e.preventDefault();
    if (confirm('Are you sure you want to sign out?')) {
      if (window.KCS && window.KCS.auth) window.KCS.auth.logout();
      else window.location.href = 'login.html';
    }
  });
})();

// ── LIVE CLOCK ────────────────────────────────────────────────
(function initClock() {
  var clockEl = document.getElementById('topbarClock');
  var dateEl  = document.getElementById('topbarDate');
  if (!clockEl && !dateEl) return;

  var days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tick() {
    var now = new Date();
    var h = pad(now.getHours()), m = pad(now.getMinutes()), s = pad(now.getSeconds());
    var timeStr = h + ':' + m + ':' + s;
    var dateStr = days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    if (clockEl) clockEl.textContent = timeStr;
    if (dateEl)  dateEl.textContent  = dateStr;
    document.querySelectorAll('.live-clock').forEach(function(el) { el.textContent = timeStr; });
    document.querySelectorAll('.live-date').forEach(function(el)  { el.textContent = dateStr; });
  }

  tick();
  setInterval(tick, 1000);
})();

// ── POPULATE USER INFO FROM SESSION ──────────────────────────
(function populateUserFromSession() {
  if (!document.querySelector('[data-user-name],[data-user-email],[data-user-avatar]')) return;
  if (window.KCS && window.KCS.auth && window.KCS.auth.populateUserInfo) {
    window.KCS.auth.populateUserInfo();
  }
})();

// ── NOTIFICATION PANEL TOGGLE ────────────────────────────────
(function initNotifPanel() {
  var toggle = document.getElementById('notifToggle');
  var panel  = document.getElementById('notifPanel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = panel.classList.toggle('open');
    // Clear badge
    if (isOpen) {
      var badge = document.getElementById('notifBadge');
      if (badge) badge.style.display = 'none';
    }
  });

  document.addEventListener('click', function(e) {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
})();

// ── STAT COUNTER ANIMATION ─────────────────────────────────────
(function initDashboardCounters() {
  document.querySelectorAll('[data-counter]').forEach(function(el) {
    var target = parseInt(el.getAttribute('data-counter'), 10);
    if (isNaN(target) || target === 0) { el.textContent = el.getAttribute('data-counter'); return; }
    var current = 0;
    var step = Math.ceil(target / 40);
    var timer = setInterval(function() {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 30);
  });
})();

// ── DEEP LINK SUPPORT ─────────────────────────────────────────
// If URL has #section on load, activate that section
(function handleDeepLink() {
  window.addEventListener('hashchange', function() {
    var section = window.location.hash.replace('#', '');
    if (section) {
      var el = document.querySelector('[data-section="' + section + '"]');
      if (el) el.click();
    }
  });
})();

// ── EXPOSE API ────────────────────────────────────────────────
window.KCS = window.KCS || {};
window.KCS.nav = {
  showSection: function(name) {
    var el = document.querySelector('[data-section="' + name + '"]');
    if (el) el.click();
  },
};
