// ============================================================
// KIBE CYBERSHIELD — NAVIGATION MODULE (navigation.js)
// Handles all navigation, active states, section routing,
// mobile menu, sidebar toggle, and deep-link support
// ============================================================

'use strict';

// ── ACTIVE NAV LINK HIGHLIGHTING ──
(function setActiveNavLink() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    var href = link.getAttribute('href');
    if (href === page || href === './' + page) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

// ── NAVBAR SCROLL EFFECT ──
(function initNavbarScroll() {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;
  var onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

// ── MOBILE NAV TOGGLE ──
(function initMobileNav() {
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (!toggle || !navLinks) return;

  function open()  { navLinks.classList.add('open'); toggle.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function close() { navLinks.classList.remove('open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }

  toggle.addEventListener('click', () => navLinks.classList.contains('open') ? close() : open());

  // Close menu when any nav link is clicked
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // Close on outside click
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) close();
  });

  // Close on Escape key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// ── SIDEBAR TOGGLE (dashboard pages) ──
(function initSidebar() {
  var toggle  = document.getElementById('sidebarToggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  var closeBtn = document.getElementById('sidebarClose');
  if (!sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  toggle?.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  overlay?.addEventListener('click', closeSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
})();

// ── SECTION SWITCHER (single-page dashboard navigation) ──
// Handles sidebar-links, quick-action links, topbar icon btns,
// inline "View All" links — anything with [data-section]
(function initSectionSwitcher() {
  var sections = document.querySelectorAll('[data-content-section]');
  if (!sections.length) return;

  function switchTo(target, label) {
    if (!target) return;

    // Hide all sections, show target
    sections.forEach(s => {
      s.classList.toggle('hidden', s.dataset.contentSection !== target);
    });

    // Update active sidebar link
    document.querySelectorAll('.sidebar-link[data-section]').forEach(l => {
      l.classList.toggle('active', l.dataset.section === target);
    });

    // Update topbar title
    var titleEl = document.getElementById('topbarTitle');
    if (titleEl && label) titleEl.textContent = label;

    // Close sidebar on mobile after navigation
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
      sidebar.classList.remove('open');
      overlay?.classList.remove('show');
      document.body.style.overflow = '';
    }

    // Scroll main content to top
    var main = document.querySelector('.page-content');
    if (main) main.scrollTop = 0;
  }

  // Attach click handler to ALL elements with [data-section]
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('[data-section]');
    if (!trigger) return;

    // Skip if it's an external link (has a real href going elsewhere)
    var href = trigger.getAttribute('href');
    if (href && href !== '#' && !href.startsWith('#') && href.includes('.html')) return;

    e.preventDefault();

    var target = trigger.dataset.section;
    // Get label: prefer .link-text span, fallback to title attr or capitalised target
    var label = trigger.querySelector('.link-text')?.textContent
               || trigger.getAttribute('title')
               || (target.charAt(0).toUpperCase() + target.slice(1));

    switchTo(target, label);
  });

  // Support URL hash on load: ?section=alerts
  var params = new URLSearchParams(window.location.search);
  var initSection = params.get('section');
  if (initSection && document.querySelector(`[data-content-section="${initSection}"]`)) {
    switchTo(initSection, initSection.charAt(0).toUpperCase() + initSection.slice(1));
  }
})();

// ── TOPBAR LIVE CLOCK ──
(function initClock() {
  var el = document.getElementById('topbarTime');
  if (!el) return;
  var update = () => {
    el.textContent = new Date().toLocaleTimeString('en-KE', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  update();
  setInterval(update, 1000);
})();

// ── LOGOUT HANDLER ──
// Logout links use href="/logout" (Flask route) - just add confirm dialog
(function initLogout() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('a[href="/logout"], [data-logout]');
    if (!btn) return;
    e.preventDefault();
    if (confirm('Are you sure you want to sign out?')) {
      window.location.href = '/logout';
    }
  });
})();

// ── SMOOTH SCROLL FOR IN-PAGE ANCHOR LINKS ──
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      var id = a.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// ── SCROLL REVEAL ANIMATIONS ──
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.service-card, .stat-card, .terminal, .card').forEach(el => {
    if (!el.style.opacity) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      observer.observe(el);
    }
  });
})();

// ── POPULATE USER INFO FROM SESSION ──
(function populateUserInfo() {
  try {
    var raw = sessionStorage.getItem('kcs_user');
    if (!raw) return;
    var user = JSON.parse(raw);

    // Text bindings
    document.querySelectorAll('[data-user-name]').forEach(el => {
      if (el.tagName === 'INPUT') el.value = user.name || '';
      else el.textContent = user.name || '';
    });
    document.querySelectorAll('[data-user-email]').forEach(el => {
      if (el.tagName === 'INPUT') el.value = user.email || '';
      else el.textContent = user.email || '';
    });
    document.querySelectorAll('[data-user-org]').forEach(el => {
      if (el.tagName === 'INPUT') el.value = user.org || '';
      else el.textContent = user.org || '—';
    });
    document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.role || '');

    // Avatar initials
    var initials = (user.name || 'U')
      .split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
    document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = initials);

    // Role badge
    document.querySelectorAll('[data-role-badge]').forEach(el => {
      el.textContent = (user.role || '').charAt(0).toUpperCase() + (user.role || '').slice(1);
      el.className = 'profile-role role-' + (user.role || 'client');
    });
  } catch (e) {
    console.warn('KCS Navigation: could not populate user info', e);
  }
})();


// ── POPULATE USER INFO FROM SESSION API ──────────────────────
// Called on dashboard pages to sync UI with server session
(function populateUserFromSession() {
  // Only run on pages with data-user-* elements
  if (!document.querySelector('[data-user-name],[data-user-email],[data-user-avatar]')) return;

  fetch('/api/session-check', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.authenticated) return;

      var name   = d.name   || '';
      var email  = d.email  || '';
      var role   = d.role   || '';
      var initials = name.split(' ').map(function(n){return n[0]||'';}).join('').substring(0,2).toUpperCase();

      document.querySelectorAll('[data-user-name]').forEach(function(el) {
        if (el.tagName === 'INPUT') el.value = name; else el.textContent = name;
      });
      document.querySelectorAll('[data-user-email]').forEach(function(el) {
        if (el.tagName === 'INPUT') el.value = email; else el.textContent = email;
      });
      document.querySelectorAll('[data-user-avatar]').forEach(function(el) {
        el.textContent = initials || role.charAt(0).toUpperCase();
      });
      document.querySelectorAll('[data-role-badge]').forEach(function(el) {
        el.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        el.className   = 'profile-role role-' + role;
      });
      document.querySelectorAll('[data-user-role]').forEach(function(el) {
        el.textContent = role;
      });
    })
    .catch(function() {}); // Fail silently if not authenticated
})();

// ── EXPOSE API ──
window.KCS = window.KCS || {};
window.KCS.nav = {
  switchSection: function(target, label) {
    var sections = document.querySelectorAll('[data-content-section]');
    if (!sections.length) return;
    sections.forEach(s => s.classList.toggle('hidden', s.dataset.contentSection !== target));
    document.querySelectorAll('.sidebar-link[data-section]').forEach(l => l.classList.toggle('active', l.dataset.section === target));
    var titleEl = document.getElementById('topbarTitle');
    if (titleEl && label) titleEl.textContent = label;
  }
};
