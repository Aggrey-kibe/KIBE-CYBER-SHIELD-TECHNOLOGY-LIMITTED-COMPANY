// ============================================================
// KIBE CYBERSHIELD — auth.js (Standalone Frontend)
// Client-side authentication using sessionStorage.
// In production: replace sessionStorage calls with real API.
// ============================================================

'use strict';

// ── DEMO USERS (replace with real API in production) ─────────
var DEMO_USERS = [
  {
    id: 1, name: 'Aggrey Kibe Kwamboka',
    email: 'admin@kibecyber.com',  password: 'Admin@123',
    role: 'admin', org: 'Kibe CyberShield Technologies Ltd', status: 'active',
  },
  {
    id: 2, name: 'Wanjiru Muthoni',
    email: 'staff@kibecyber.com',  password: 'Staff@123',
    role: 'staff', org: 'Kibe CyberShield Technologies Ltd', status: 'active',
  },
  {
    id: 3, name: 'James Ochieng',
    email: 'client@kibecyber.com', password: 'Client@123',
    role: 'client', org: 'SafeNet Solutions Ltd', status: 'active',
  },
];

// ── SESSION HELPERS ───────────────────────────────────────────
var Session = {
  set: function(user) {
    var data = {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      org:   user.org || '',
      loginTime: Date.now(),
    };
    sessionStorage.setItem('kcs_auth', JSON.stringify(data));
  },
  get: function() {
    try {
      var raw = sessionStorage.getItem('kcs_auth');
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },
  clear: function() {
    sessionStorage.removeItem('kcs_auth');
  },
  isExpired: function() {
    var s = this.get();
    if (!s || !s.loginTime) return true;
    // 2-hour session timeout
    return (Date.now() - s.loginTime) > 2 * 60 * 60 * 1000;
  },
  isValid: function() {
    return this.get() !== null && !this.isExpired();
  },
};

// ── PASSWORD VALIDATION ───────────────────────────────────────
function isValidPassword(pwd) {
  return (
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd)
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── ROLE → DASHBOARD MAP ──────────────────────────────────────
function dashboardFor(role) {
  var map = { admin: 'admin.html', staff: 'staff.html', client: 'client.html' };
  return map[role] || 'dashboard.html';
}

// ── AUTH GUARD — call on protected pages ──────────────────────
function requireAuth(allowedRoles) {
  if (!Session.isValid()) {
    sessionStorage.setItem('kcs_redirect', window.location.href);
    window.location.href = 'login.html';
    return false;
  }
  if (allowedRoles && allowedRoles.length) {
    var user = Session.get();
    if (!allowedRoles.includes(user.role)) {
      window.location.href = dashboardFor(user.role);
      return false;
    }
  }
  return true;
}

// ── POPULATE USER INFO FROM SESSION ──────────────────────────
function populateUserInfo() {
  var user = Session.get();
  if (!user) return;
  document.querySelectorAll('[data-user-name]').forEach(function(el) {
    if (el.tagName === 'INPUT') el.value = user.name;
    else el.textContent = user.name;
  });
  document.querySelectorAll('[data-user-email]').forEach(function(el) {
    if (el.tagName === 'INPUT') el.value = user.email;
    else el.textContent = user.email;
  });
  document.querySelectorAll('[data-user-role]').forEach(function(el) {
    el.textContent = user.role;
  });
  document.querySelectorAll('[data-user-avatar]').forEach(function(el) {
    var initials = user.name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
    el.textContent = initials;
  });
  document.querySelectorAll('[data-user-org]').forEach(function(el) {
    if (el.tagName === 'INPUT') el.value = user.org || '';
    else el.textContent = user.org || '';
  });
  document.querySelectorAll('[data-role-badge]').forEach(function(el) {
    var role = user.role;
    el.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    el.className = 'profile-role role-' + role;
  });
}

// ── PASSWORD STRENGTH INDICATOR ───────────────────────────────
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
      var labels = { weak: 'Weak', fair: 'Fair', strong: score === 4 ? 'Very Strong' : 'Strong' };
      text.textContent = labels[cls] || 'Strong';
      text.style.color = cls === 'weak' ? '#EF4444' : cls === 'fair' ? '#F59E0B' : '#22C55E';
    }
  });
}

function initPasswordToggle(toggleId, inputId) {
  var btn = document.getElementById(toggleId);
  var inp = document.getElementById(inputId);
  if (!btn || !inp) return;
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
}

// ── DEMO LOGIN SHORTCUT ───────────────────────────────────────
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
  if (em) em.value = cred.email;
  if (pw) pw.value = cred.pass;
  var form = document.getElementById('loginForm');
  if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
};

// ── LOGIN FORM ────────────────────────────────────────────────
(function initLoginForm() {
  var form = document.getElementById('loginForm');
  if (!form) return;
  initPasswordToggle('togglePwd', 'password');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var email    = (document.getElementById('email')    || {}).value || '';
    var password = (document.getElementById('password') || {}).value || '';
    var alertEl  = document.getElementById('loginAlert');

    if (alertEl) alertEl.classList.add('hidden');
    document.querySelectorAll('#loginForm .form-error').forEach(function(el) { el.classList.add('hidden'); });

    // Validate
    if (!isValidEmail(email.trim())) {
      var ee = document.getElementById('emailError');
      if (ee) { ee.textContent = 'Valid email required.'; ee.classList.remove('hidden'); }
      return;
    }
    if (!password) {
      var pe = document.getElementById('pwdError');
      if (pe) { pe.textContent = 'Password required.'; pe.classList.remove('hidden'); }
      return;
    }

    // Show loading
    var btn = document.getElementById('submitBtn');
    var btnText = document.getElementById('btnText');
    var spinner = document.getElementById('btnSpinner');
    if (btn) btn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');

    // Simulate API call (replace with real fetch in production)
    setTimeout(function() {
      var user = DEMO_USERS.find(function(u) {
        return u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password;
      });

      if (user && user.status === 'active') {
        Session.set(user);
        var redirect = sessionStorage.getItem('kcs_redirect') || dashboardFor(user.role);
        sessionStorage.removeItem('kcs_redirect');
        window.location.href = redirect;
      } else {
        if (btn) btn.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
        if (alertEl) {
          alertEl.textContent = '⚠ Invalid email or password. Please try again.';
          alertEl.className = 'alert alert-danger';
          alertEl.classList.remove('hidden');
        }
      }
    }, 800);
  });
})();

// ── REGISTER FORM ────────────────────────────────────────────
(function initRegisterForm() {
  var form = document.getElementById('registerForm');
  if (!form) return;
  initPasswordToggle('toggleRegPwd', 'regPassword');
  initPasswordStrength('regPassword', 'pwdStrength', 'pwdStrengthText');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var firstName = (document.getElementById('firstName')   || {}).value || '';
    var lastName  = (document.getElementById('lastName')    || {}).value || '';
    var email     = (document.getElementById('regEmail')    || {}).value || '';
    var password  = (document.getElementById('regPassword') || {}).value || '';
    var confirm   = (document.getElementById('confirmPwd')  || {}).value || '';
    var role      = (document.getElementById('role')        || {}).value || 'client';
    var terms     = (document.getElementById('terms')       || {}).checked;

    document.querySelectorAll('#registerForm .form-error').forEach(function(el) { el.classList.add('hidden'); });

    var errors = [];
    if (!firstName.trim() || !lastName.trim()) errors.push('name');
    if (!isValidEmail(email.trim())) {
      errors.push('email');
      var ee = document.getElementById('regEmailError');
      if (ee) { ee.textContent = 'Valid email required.'; ee.classList.remove('hidden'); }
    }
    if (!isValidPassword(password)) {
      errors.push('pwd');
      var pe = document.getElementById('pwdRegError');
      if (pe) { pe.textContent = 'Min 8 chars with uppercase, lowercase and a digit.'; pe.classList.remove('hidden'); }
    }
    if (password !== confirm) {
      errors.push('confirm');
      var ce = document.getElementById('confirmError');
      if (ce) { ce.textContent = 'Passwords do not match.'; ce.classList.remove('hidden'); }
    }
    if (!terms) { errors.push('terms'); }
    if (errors.length) return;

    // Check duplicate email in demo users
    if (DEMO_USERS.some(function(u) { return u.email.toLowerCase() === email.trim().toLowerCase(); })) {
      var ae = document.getElementById('regEmailError');
      if (ae) { ae.textContent = 'An account with this email already exists.'; ae.classList.remove('hidden'); }
      return;
    }

    var btn = document.getElementById('regSubmitBtn');
    var btnText = document.getElementById('regBtnText');
    var spinner = document.getElementById('regBtnSpinner');
    if (btn) btn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');

    // Simulate registration (replace with real API in production)
    setTimeout(function() {
      var newUser = {
        id:       DEMO_USERS.length + 1,
        name:     firstName.trim() + ' ' + lastName.trim(),
        email:    email.trim().toLowerCase(),
        password: password,
        role:     role,
        org:      (document.getElementById('organization') || {}).value || '',
        status:   'active',
      };
      DEMO_USERS.push(newUser);
      Session.set(newUser);

      if (window.KCS && window.KCS.ui) {
        window.KCS.ui.showToast('Welcome, ' + firstName + '! Account created.', 'success');
      }
      setTimeout(function() {
        window.location.href = dashboardFor(role);
      }, 800);
    }, 1000);
  });
})();

// ── LOGOUT ───────────────────────────────────────────────────
function logout() {
  Session.clear();
  window.location.href = 'login.html';
}
window.logout = logout;

// ── EXPORT ───────────────────────────────────────────────────
window.KCS = window.KCS || {};
window.KCS.auth = {
  Session:       Session,
  requireAuth:   requireAuth,
  populateUserInfo: populateUserInfo,
  dashboardFor:  dashboardFor,
  logout:        logout,
  demoLogin:     window.demoLogin,
};
