// ============================================================
// KIBE CYBERSHIELD — auth.js  (v4 — Fixed & Complete)
// All form submission is handled by standard HTML POST to Flask.
// This file handles: client-side validation, UX helpers only.
// ============================================================

'use strict';

// ── CSRF TOKEN ────────────────────────────────────────────────
function getCsrfToken() {
  // Read from meta tag (refreshed on load)
  var meta = document.querySelector('meta[name="csrf-token"]');
  if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
  // Fallback: read from any hidden csrf input on the page
  var inp = document.querySelector('input[name="csrf_token"]');
  return inp ? inp.value : '';
}

// ── EMAIL VALIDATION ──────────────────────────────────────────
function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim());
}

// ── LOADING STATE ─────────────────────────────────────────────
function setLoading(btnId, textId, spinnerId, isLoading) {
  var btn = document.getElementById(btnId);
  var txt = document.getElementById(textId);
  var spn = document.getElementById(spinnerId);
  if (btn) btn.disabled = isLoading;
  if (txt) txt.classList.toggle('hidden', isLoading);
  if (spn) spn.classList.toggle('hidden', !isLoading);
}

// ── SHOW / HIDE INLINE ERRORS ────────────────────────────────
function showError(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  if (msg) el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ── PASSWORD TOGGLE ───────────────────────────────────────────
function initPasswordToggle(toggleId, inputId) {
  var btn = document.getElementById(toggleId);
  var inp = document.getElementById(inputId);
  if (!btn || !inp) return;
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
}

// ── PASSWORD STRENGTH ─────────────────────────────────────────
function initPasswordStrength(inputId, wrapId, textId) {
  var inp  = document.getElementById(inputId);
  var wrap = document.getElementById(wrapId);
  var text = document.getElementById(textId);
  if (!inp || !wrap) return;

  inp.addEventListener('input', function() {
    var val = this.value;
    if (!val) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    var score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    var cls = score <= 1 ? 'weak' : score <= 2 ? 'fair' : 'strong';
    ['bar1','bar2','bar3','bar4'].forEach(function(id, i) {
      var b = document.getElementById(id);
      if (b) b.className = 'pwd-bar' + (i < score ? ' ' + cls : '');
    });
    if (text) {
      var labels = { weak:'Weak', fair:'Fair', strong: score===4 ? 'Very Strong' : 'Strong' };
      text.textContent = labels[cls] || 'Strong';
      text.style.color = cls==='weak'?'var(--c-red)': cls==='fair'?'var(--c-yellow)':'var(--c-green)';
    }
  });
}

// ── API POST HELPER (for dashboard AJAX) ─────────────────────
function apiPost(url, data, onSuccess, onError) {
  var csrf = getCsrfToken();
  fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
    body: JSON.stringify(data),
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.ok) { if (onSuccess) onSuccess(d); }
    else       { if (onError)   onError(d.error || 'Request failed'); }
  })
  .catch(function(err) { if (onError) onError(String(err)); });
}

// ────────────────────────────────────────────────────────────
// LOGIN FORM — client-side validation only
// Actual POST to /login is done by the browser (standard form)
// ────────────────────────────────────────────────────────────
(function initLoginForm() {
  var form = document.getElementById('loginForm');
  if (!form) return;

  // Wire password visibility toggle
  initPasswordToggle('togglePwd', 'password');

  form.addEventListener('submit', function(e) {
    var email = (document.getElementById('email') || {}).value || '';
    var pass  = (document.getElementById('password') || {}).value || '';
    var valid = true;

    // Clear previous errors
    hideError('emailError');
    hideError('pwdError');

    // Validate email
    if (!email.trim()) {
      showError('emailError', 'Email address is required.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showError('emailError', 'Please enter a valid email address.');
      valid = false;
    }

    // Validate password
    if (!pass) {
      showError('pwdError', 'Password is required.');
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
      return;
    }

    // Show loading spinner — form will POST naturally to Flask
    setLoading('submitBtn', 'btnText', 'btnSpinner', true);
  });
})();

// ────────────────────────────────────────────────────────────
// DEMO LOGIN — fills the form and submits it
// NOTE: Only defined here. Remove any inline definition in HTML.
// ────────────────────────────────────────────────────────────
window.demoLogin = function(role) {
  var map = {
    admin:  { email: 'admin@kibecyber.com',  pass: 'Admin@123'  },
    staff:  { email: 'staff@kibecyber.com',  pass: 'Staff@123'  },
    client: { email: 'client@kibecyber.com', pass: 'Client@123' },
  };
  var cred = map[role];
  if (!cred) return;

  var em = document.getElementById('email');
  var pw = document.getElementById('password');
  var form = document.getElementById('loginForm');

  if (em) em.value = cred.email;
  if (pw) pw.value = cred.pass;

  // Submit the form normally so Flask receives the POST
  if (form) {
    // Trigger submit event for validation, then let it POST
    var submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.click();
    else form.submit();
  }
};

// ────────────────────────────────────────────────────────────
// REGISTER FORM — client-side validation only
// Actual POST to /register is done by the browser (standard form)
// ────────────────────────────────────────────────────────────
(function initRegisterForm() {
  var form = document.getElementById('registerForm');
  if (!form) return;

  initPasswordToggle('toggleRegPwd', 'regPassword');
  initPasswordStrength('regPassword', 'pwdStrength', 'pwdStrengthText');

  form.addEventListener('submit', function(e) {
    var firstName = (document.getElementById('firstName')   || {}).value || '';
    var lastName  = (document.getElementById('lastName')    || {}).value || '';
    var email     = (document.getElementById('regEmail')    || {}).value || '';
    var password  = (document.getElementById('regPassword') || {}).value || '';
    var confirm   = (document.getElementById('confirmPwd')  || {}).value || '';
    var terms     = (document.getElementById('terms')       || {}).checked;
    var valid     = true;

    // Clear previous errors
    ['regEmailError', 'pwdRegError', 'confirmError'].forEach(hideError);

    if (!firstName.trim() || !lastName.trim()) {
      valid = false;
    }
    if (!isValidEmail(email)) {
      showError('regEmailError', 'Please enter a valid email address.');
      valid = false;
    }
    if (password.length < 8) {
      showError('pwdRegError', 'Password must be at least 8 characters.');
      valid = false;
    }
    if (password !== confirm) {
      showError('confirmError', 'Passwords do not match.');
      valid = false;
    }
    if (!terms) {
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
      return;
    }

    // Show loading — form will POST naturally to Flask /register
    setLoading('regSubmitBtn', 'regBtnText', 'regBtnSpinner', true);
  });
})();

// ────────────────────────────────────────────────────────────
// DASHBOARD AJAX FORMS (incident, service request)
// These use fetch() because they need to stay on the page
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Incident report form (AJAX — stays on dashboard)
  var incForm = document.getElementById('incidentForm');
  if (incForm) {
    incForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = {
        title:       (incForm.querySelector('[name="title"]')       || {}).value || '',
        severity:    (incForm.querySelector('[name="severity"]')    || {}).value || 'medium',
        description: (incForm.querySelector('[name="description"]') || {}).value || '',
        systems:     (incForm.querySelector('[name="systems"]')     || {}).value || '',
      };
      if (!data.title || !data.description) {
        if (window.KCS && window.KCS.ui) window.KCS.ui.showToast('Please fill all required fields.', 'danger');
        return;
      }
      var btn = incForm.querySelector('[type="submit"]');
      var orig = btn ? btn.textContent : 'Submit';
      if (btn) { btn.textContent = 'Submitting\u2026'; btn.disabled = true; }
      apiPost('/api/incidents', data,
        function(d) {
          if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.message, 'success');
          incForm.reset();
          if (btn) { setTimeout(function() { btn.textContent = orig; btn.disabled = false; }, 3000); }
        },
        function(err) {
          if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(err, 'danger');
          if (btn) { btn.textContent = orig; btn.disabled = false; }
        }
      );
    });
  }

  // Service request form (AJAX)
  var svcForm = document.getElementById('serviceForm');
  if (svcForm) {
    svcForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = {
        service:     (svcForm.querySelector('[name="service"]')     || {}).value || '',
        description: (svcForm.querySelector('[name="description"]') || {}).value || '',
        priority:    (svcForm.querySelector('[name="priority"]')    || {}).value || 'medium',
      };
      if (!data.service || !data.description) {
        if (window.KCS && window.KCS.ui) window.KCS.ui.showToast('Please select a service and add a description.', 'danger');
        return;
      }
      var btn = svcForm.querySelector('[type="submit"]');
      var orig = btn ? btn.textContent : 'Submit';
      if (btn) { btn.textContent = 'Sending\u2026'; btn.disabled = true; }
      apiPost('/api/services', data,
        function(d) {
          if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.message, 'success');
          svcForm.reset();
          if (btn) { setTimeout(function() { btn.textContent = orig; btn.disabled = false; }, 3000); }
        },
        function(err) {
          if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(err, 'danger');
          if (btn) { btn.textContent = orig; btn.disabled = false; }
        }
      );
    });
  }

  // Refresh CSRF tokens from server (keeps them fresh for long sessions)
  fetch('/api/csrf-token', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.csrf_token) return;
      // Update all CSRF hidden inputs
      document.querySelectorAll('input[name="csrf_token"]').forEach(function(inp) {
        inp.value = d.csrf_token;
      });
      // Update meta tag
      var meta = document.querySelector('meta[name="csrf-token"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'csrf-token';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', d.csrf_token);
    })
    .catch(function() {}); // Silently ignore (not logged in)
});

// ── EXPOSE GLOBALS ────────────────────────────────────────────
window.KCS = window.KCS || {};
window.KCS.auth = {
  getCsrfToken:  getCsrfToken,
  apiPost:       apiPost,
  isValidEmail:  isValidEmail,
  demoLogin:     window.demoLogin,
};
