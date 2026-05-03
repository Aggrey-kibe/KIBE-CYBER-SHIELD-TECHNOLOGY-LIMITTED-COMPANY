// ============================================================
// KIBE CYBERSHIELD — main.js (Standalone Frontend)
// Public page interactions, animations, and UI utilities.
// No server required — works directly in the browser.
// ============================================================

'use strict';

// ── TOAST NOTIFICATION SYSTEM ─────────────────────────────────
window.KCS = window.KCS || {};
window.KCS.ui = {
  showToast: function(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    var container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed;top:80px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:380px;';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    var icons = { success: '✓', danger: '✕', warning: '⚠', info: 'ℹ' };
    var colors = {
      success: '#22C55E', danger: '#EF4444',
      warning: '#F59E0B', info: '#00C2FF'
    };
    toast.style.cssText = [
      'background:var(--c-surface,#1E293B)',
      'border:1px solid ' + (colors[type] || colors.info) + '33',
      'border-left:3px solid ' + (colors[type] || colors.info),
      'color:#E8F0FE',
      'padding:12px 16px',
      'border-radius:8px',
      'font-size:0.875rem',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.4)',
      'animation:slideInUp 0.3s ease',
      'cursor:pointer',
    ].join(';');
    toast.innerHTML =
      '<span style="color:' + (colors[type] || colors.info) + ';font-size:1rem;">' + (icons[type] || icons.info) + '</span>' +
      '<span>' + String(message) + '</span>';
    toast.addEventListener('click', function() { toast.remove(); });
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(function() { toast.remove(); }, 400);
    }, duration);
  }
};

// ── FLASH MESSAGE AUTO-DISMISS ────────────────────────────────
(function initFlashMessages() {
  var flash = document.getElementById('flashMessages');
  if (!flash) return;
  setTimeout(function() {
    flash.style.opacity = '0';
    flash.style.transition = 'opacity 0.5s';
    setTimeout(function() { flash.remove(); }, 500);
  }, 4500);
})();

// ── ANIMATED COUNTER ─────────────────────────────────────────
function animateCounter(el) {
  var target = parseInt(el.getAttribute('data-counter') || el.textContent, 10);
  if (isNaN(target) || target === 0) return;
  var start = 0;
  var step  = Math.ceil(target / 40);
  var timer = setInterval(function() {
    start = Math.min(start + step, target);
    el.textContent = start.toLocaleString();
    if (start >= target) clearInterval(timer);
  }, 30);
}

function initCounters() {
  document.querySelectorAll('[data-counter]').forEach(function(el) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { animateCounter(el); obs.disconnect(); }
      });
    }, { threshold: 0.3 });
    obs.observe(el);
  });
}

// ── TERMINAL ANIMATION (hero section) ────────────────────────
function initTerminal() {
  var terminal = document.getElementById('terminalOutput');
  if (!terminal) return;

  var lines = [
    { text: '$ kibe-shield --scan --target=network', delay: 0,    color: '#00C2FF' },
    { text: '[INIT]  Kibe CyberShield Engine v3.1.0', delay: 600,  color: '#94A3B8' },
    { text: '[SCAN]  Scanning 254 network hosts...', delay: 1200, color: '#94A3B8' },
    { text: '[OK]    Firewall rules: 2,847 active',   delay: 1900, color: '#22C55E' },
    { text: '[WARN]  Port 8080 exposed on 10.0.0.14', delay: 2600, color: '#F59E0B' },
    { text: '[BLOCK] Intrusion attempt blocked: 185.220.101.34', delay: 3300, color: '#EF4444' },
    { text: '[OK]    Threat intelligence updated',    delay: 4000, color: '#22C55E' },
    { text: '[SCAN]  SSL certificates: all valid',    delay: 4700, color: '#22C55E' },
    { text: '[OK]    Security score: 98/100 ▓▓▓▓▓▓▓▓▓░', delay: 5400, color: '#00C2FF' },
    { text: '$ _',                                    delay: 6100, color: '#00C2FF' },
  ];

  lines.forEach(function(line) {
    setTimeout(function() {
      var span = document.createElement('div');
      span.className = 't-line';
      span.style.color = line.color;
      span.style.fontFamily = 'var(--font-mono, "IBM Plex Mono", monospace)';
      span.style.fontSize = '0.85rem';
      span.style.lineHeight = '1.6';
      span.style.animation = 'fadeIn 0.3s ease';
      span.textContent = line.text;
      terminal.appendChild(span);
      terminal.scrollTop = terminal.scrollHeight;
    }, line.delay);
  });
}

// ── SMOOTH SCROLL ─────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── SCROLL REVEAL ANIMATIONS ──────────────────────────────────
function initScrollReveal() {
  var els = document.querySelectorAll('.service-card, .stat-item, .feature-block, .team-card, .pricing-card, .value-card');
  if (!els.length) return;
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.style.opacity    = '1';
        e.target.style.transform  = 'translateY(0)';
        e.target.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(function(el) {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(24px)';
    obs.observe(el);
  });
}

// ── MOBILE NAVBAR TOGGLE ─────────────────────────────────────
function initPublicNavbar() {
  var toggle = document.querySelector('.nav-toggle, .hamburger, [data-nav-toggle]');
  var menu   = document.querySelector('.nav-links, .nav-menu, [data-nav-menu]');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', function() {
    menu.classList.toggle('open');
    toggle.classList.toggle('active');
  });
  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      toggle.classList.remove('active');
    }
  });
}

// ── CONTACT FORM (standalone — no backend, shows feedback) ──
function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name    = form.querySelector('[name="name"]');
    var email   = form.querySelector('[name="email"]');
    var subject = form.querySelector('[name="subject"]');
    var message = form.querySelector('[name="message"]');
    if (!name || !email || !subject || !message) return;
    if (!name.value.trim() || !email.value.trim() || !subject.value.trim() || !message.value.trim()) {
      window.KCS.ui.showToast('Please fill all required fields.', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      window.KCS.ui.showToast('Please enter a valid email address.', 'danger');
      return;
    }
    var btn = form.querySelector('[type="submit"]');
    var orig = btn ? btn.textContent : 'Send';
    if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
    // Simulate send (replace with real API call when backend is connected)
    setTimeout(function() {
      window.KCS.ui.showToast('Message sent! We\'ll respond within 24 hours.', 'success');
      form.reset();
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    }, 1200);
  });
}

// ── STATS COUNTER (public stats on index.html) ───────────────
function initPublicStats() {
  var stats = [
    { id: 'stat-clients',   value: 500,   suffix: '+' },
    { id: 'stat-threats',   value: 99.9,  suffix: '%' },
    { id: 'stat-countries', value: 12,    suffix: ''  },
    { id: 'stat-uptime',    value: 99.99, suffix: '%' },
  ];
  stats.forEach(function(s) {
    var el = document.getElementById(s.id);
    if (!el) return;
    var obs = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      var target = s.value;
      var current = 0;
      var isFloat = target % 1 !== 0;
      var steps = 50;
      var increment = target / steps;
      var timer = setInterval(function() {
        current = Math.min(current + increment, target);
        el.textContent = (isFloat ? current.toFixed(2) : Math.floor(current)) + s.suffix;
        if (current >= target) clearInterval(timer);
      }, 30);
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

// ── ACTIVE NAV LINK ───────────────────────────────────────────
function initActiveNavLink() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .nav-links a').forEach(function(link) {
    var href = link.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html') || (page === 'index.html' && href === '#')) {
      link.classList.add('active');
    }
  });
}

// ── BACK TO TOP ───────────────────────────────────────────────
function initBackToTop() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', function() {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  });
  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── COOKIE CONSENT ────────────────────────────────────────────
function initCookieConsent() {
  if (localStorage.getItem('kcs_cookies_accepted')) return;
  var banner = document.getElementById('cookieBanner');
  if (!banner) return;
  banner.style.display = 'flex';
  var acceptBtn = banner.querySelector('[data-accept-cookies]');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function() {
      localStorage.setItem('kcs_cookies_accepted', '1');
      banner.style.opacity = '0';
      banner.style.transition = 'opacity 0.4s';
      setTimeout(function() { banner.style.display = 'none'; }, 400);
    });
  }
}

// ── INIT ALL ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initCounters();
  initTerminal();
  initSmoothScroll();
  initScrollReveal();
  initPublicNavbar();
  initContactForm();
  initPublicStats();
  initActiveNavLink();
  initBackToTop();
  initCookieConsent();
});
