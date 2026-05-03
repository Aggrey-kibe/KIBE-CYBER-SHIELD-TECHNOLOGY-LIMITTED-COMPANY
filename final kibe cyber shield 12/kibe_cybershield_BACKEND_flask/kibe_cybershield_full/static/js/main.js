// ============================================================
// KIBE CYBERSHIELD — MAIN.JS
// Global utilities, form helpers, UI polish
// Navigation is handled by navigation.js
// ============================================================

'use strict';

// ── NOTIFICATION BADGE UPDATER ──
function updateNotifBadge(count) {
  document.querySelectorAll('.notif-count').forEach(function(badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : String(count);
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// ── SHOW TOAST MESSAGE ──
function showToast(message, type) {
  type = type || 'info';
  var toast = document.createElement('div');
  toast.className = 'kcs-toast alert alert-' + type;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;min-width:280px;max-width:400px;padding:14px 20px;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.4);font-size:0.875rem;opacity:0;transform:translateY(20px);transition:all 0.3s ease';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function() {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

// ── SECURITY SCORE RING ──
function renderSecurityScore(score, elementId) {
  var el = document.getElementById(elementId);
  if (!el) return;
  var r = 54;
  var circ = 2 * Math.PI * r;
  var fill = Math.max(0, Math.min(100, score)) / 100 * circ;
  el.style.strokeDasharray = fill + ' ' + circ;
}

// ── COUNTER ANIMATION ──
function animateCounters() {
  document.querySelectorAll('[data-counter]').forEach(function(el) {
    var target = parseInt(el.dataset.counter, 10);
    if (isNaN(target)) return;
    var duration = 1000;
    var start = performance.now();
    function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ── FILE UPLOAD ZONE ──
function initFileUpload() {
  var zone  = document.getElementById('uploadZone');
  var input = document.getElementById('fileInput');
  var list  = document.getElementById('uploadList');
  if (!zone || !input) return;

  zone.addEventListener('click', function(e) {
    if (e.target !== input) input.click();
  });
  zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function(e) {
    e.preventDefault(); zone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', function() { handleFiles(input.files); input.value = ''; });

  function handleFiles(files) {
    if (!list) return;
    Array.from(files).forEach(function(file) {
      var size = file.size < 1024 ? file.size + ' B'
               : file.size < 1048576 ? (file.size/1024).toFixed(1) + ' KB'
               : (file.size/1048576).toFixed(1) + ' MB';
      var item = document.createElement('div');
      item.className = 'upload-file';
      item.innerHTML = '<div class="file-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span class="file-name">' + file.name + '</span><span class="file-size font-mono">' + size + '</span><button class="file-remove" title="Remove" type="button">×</button>';
      item.querySelector('.file-remove').addEventListener('click', function() { item.remove(); });
      list.appendChild(item);
    });
  }
}

// ── FORM: INCIDENT REPORT ──
function initIncidentForm() {
  var form = document.getElementById('incidentForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var title    = (form.querySelector('[name="title"]') || {}).value || '';
    var severity = (form.querySelector('[name="severity"]') || {}).value || '';
    var desc     = (form.querySelector('[name="description"]') || {}).value || '';
    if (!title.trim() || !severity || !desc.trim()) {
      showToast('Please fill all required fields.', 'danger'); return;
    }
    var btn = form.querySelector('[type="submit"]');
    var orig = btn.textContent;
    btn.textContent = 'Submitting\u2026'; btn.disabled = true;
    setTimeout(function() {
      btn.textContent = '\u2713 Incident Reported';
      showToast('Incident report submitted successfully.', 'success');
      form.reset();
      setTimeout(function() { btn.textContent = orig; btn.disabled = false; btn.className = 'btn-primary'; }, 3500);
    }, 1000);
  });
}

// ── FORM: SERVICE REQUEST ──
function initServiceForm() {
  var form = document.getElementById('serviceForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var service = (form.querySelector('[name="service"]') || {}).value || '';
    var desc    = (form.querySelector('[name="description"]') || {}).value || '';
    if (!service || !desc.trim()) {
      showToast('Please select a service and add a description.', 'danger'); return;
    }
    var btn = form.querySelector('[type="submit"]');
    var orig = btn.textContent;
    btn.textContent = 'Sending\u2026'; btn.disabled = true;
    setTimeout(function() {
      btn.textContent = '\u2713 Request Submitted';
      showToast('Service request submitted. Our team will contact you shortly.', 'success');
      form.reset();
      setTimeout(function() { btn.textContent = orig; btn.disabled = false; }, 3500);
    }, 1000);
  });
}

// ── MARK ALL NOTIFICATIONS READ ──
function initMarkAllRead() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-mark-all-read]');
    if (!btn) return;
    var containerId = btn.dataset.markAllRead;
    var container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.notif-item.unread').forEach(function(item) {
      item.classList.remove('unread');
    });
    updateNotifBadge(0);
    showToast('All notifications marked as read.', 'success');
  });
}

// ── TABLE ROW ACTIONS ──
function initTableActions() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    var id = btn.dataset.id || '';
    var map = {
      'approve': function() { showToast('Item ' + id + ' approved.', 'success'); btn.textContent = 'Approved'; btn.disabled = true; },
      'reject':  function() { showToast('Item ' + id + ' rejected.', 'danger'); },
      'resolve': function() { showToast('Incident ' + id + ' resolved.', 'success'); btn.textContent = 'Resolved'; btn.disabled = true; },
      'view':    function() { showToast('Loading details for ' + id + '\u2026', 'info'); },
      'edit':    function() { showToast('Edit mode for ' + id + '.', 'info'); },
      'lock':    function() { showToast('Account ' + id + ' locked.', 'warning'); },
      'delete':  function() {
        if (!confirm('Delete this item?')) return;
        showToast('Item deleted.', 'danger');
        var row = btn.closest('tr');
        if (row) { row.style.opacity = '0'; setTimeout(function() { row.remove(); }, 300); }
      }
    };
    if (map[action]) map[action]();
  });
}

// ── SETTINGS SAVE BUTTONS (not in a form) ──
function initSettingsButtons() {
  document.querySelectorAll('[data-save-settings]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var orig = btn.textContent;
      btn.textContent = 'Saving\u2026'; btn.disabled = true;
      setTimeout(function() {
        btn.textContent = '\u2713 Saved';
        showToast('Settings saved successfully.', 'success');
        setTimeout(function() { btn.textContent = orig; btn.disabled = false; }, 2500);
      }, 700);
    });
  });
}

// ── DOM READY ──
document.addEventListener('DOMContentLoaded', function() {
  animateCounters();
  initFileUpload();
  initIncidentForm();
  initServiceForm();
  initMarkAllRead();
  initTableActions();
  initSettingsButtons();
  setTimeout(function() { renderSecurityScore(92, 'scoreRingFill'); }, 400);
});

// ── EXPOSE GLOBALS ──
window.KCS = window.KCS || {};
window.KCS.ui = { showToast: showToast, updateNotifBadge: updateNotifBadge, renderSecurityScore: renderSecurityScore, animateCounters: animateCounters };

// ── LIVE STATS REFRESH ────────────────────────────────────────
// Refreshes stat counters from /api/stats every 60 seconds
(function initLiveStats() {
  function refresh() {
    fetch('/api/stats', { credentials: 'same-origin' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        Object.keys(data).forEach(function(key) {
          var el = document.querySelector('[data-stat="' + key + '"]');
          if (el) el.textContent = data[key];
          // Also update data-counter elements
          var counter = document.querySelector('[data-stat-key="' + key + '"]');
          if (counter) {
            var val = parseInt(data[key], 10);
            if (!isNaN(val)) {
              counter.setAttribute('data-counter', val);
              counter.textContent = val.toLocaleString();
            }
          }
        });
      })
      .catch(function() {}); // Fail silently
  }
  // Only run on dashboard pages
  if (document.querySelector('[data-content-section]')) {
    refresh();
    setInterval(refresh, 60000); // refresh every 60s
  }
})();

// ── ADMIN: CREATE USER via API ────────────────────────────────
(function initCreateUser() {
  var btn = document.getElementById('createUserBtn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var modal = document.getElementById('addUserModal');
    if (!modal) return;

    var name     = (modal.querySelector('input[type="text"]')     || {}).value || '';
    var emailEl  = modal.querySelector('input[type="email"]');
    var email    = emailEl ? emailEl.value : '';
    var roleEl   = modal.querySelector('select');
    var role     = roleEl ? roleEl.value : 'client';
    var pwdEl    = modal.querySelector('input[type="password"]');
    var password = pwdEl ? pwdEl.value : '';

    if (!name.trim() || !email.trim() || password.length < 8) {
      if (window.KCS && window.KCS.ui) {
        window.KCS.ui.showToast('Name, valid email and password (min 8 chars) required.', 'danger');
      }
      return;
    }

    var csrf = '';
    var meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) csrf = meta.getAttribute('content');
    var inp = document.querySelector('input[name="csrf_token"]');
    if (inp) csrf = inp.value;

    btn.textContent = 'Creating…'; btn.disabled = true;

    fetch('/api/users', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
      body: JSON.stringify({ name: name, email: email, role: role, password: password, org: '' })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      btn.textContent = 'Create User'; btn.disabled = false;
      if (d.ok) {
        modal.style.display = 'none';
        if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.message, 'success');
        // Clear form
        if (emailEl) emailEl.value = '';
        if (pwdEl) pwdEl.value = '';
        modal.querySelectorAll('input[type="text"]').forEach(function(i) { i.value = ''; });
        // Reload user table after 1s
        setTimeout(function() { window.location.reload(); }, 1200);
      } else {
        if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.error || 'Failed', 'danger');
      }
    })
    .catch(function(err) {
      btn.textContent = 'Create User'; btn.disabled = false;
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(String(err), 'danger');
    });
  });
})();

// ── ADMIN: USER STATUS UPDATE (suspend/activate) ──────────────
function updateUserStatus(uid, status) {
  var csrf = '';
  var meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) csrf = meta.getAttribute('content');
  var inp = document.querySelector('input[name="csrf_token"]');
  if (inp) csrf = inp.value;

  fetch('/api/users/' + uid + '/status', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
    body: JSON.stringify({ status: status })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.ok) {
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.message, 'success');
      setTimeout(function() { window.location.reload(); }, 1000);
    } else {
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.error || 'Failed', 'danger');
    }
  })
  .catch(function(err) {
    if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(String(err), 'danger');
  });
}

// ── INCIDENT/TICKET STATUS UPDATE (staff/admin) ───────────────
function updateIncidentStatus(id, status) {
  var csrf = document.querySelector('meta[name="csrf-token"]');
  csrf = csrf ? csrf.getAttribute('content') : '';
  fetch('/api/incidents/' + id + '/status', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
    body: JSON.stringify({ status: status })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    var msg = d.ok ? d.message : (d.error || 'Failed');
    var type = d.ok ? 'success' : 'danger';
    if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(msg, type);
    if (d.ok) setTimeout(function() { window.location.reload(); }, 1200);
  })
  .catch(function(e) { console.error(e); });
}

function updateTicketStatus(id, status) {
  var csrf = document.querySelector('meta[name="csrf-token"]');
  csrf = csrf ? csrf.getAttribute('content') : '';
  fetch('/api/tickets/' + id + '/status', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
    body: JSON.stringify({ status: status })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    var msg = d.ok ? d.message : (d.error || 'Failed');
    var type = d.ok ? 'success' : 'danger';
    if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(msg, type);
    if (d.ok) setTimeout(function() { window.location.reload(); }, 1200);
  })
  .catch(function(e) { console.error(e); });
}

// ── CHANGE PASSWORD FORM (profile section) ────────────────────
(function initChangePassword() {
  var form = document.getElementById('changePwdForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var current = (form.querySelector('[name="current_password"]') || {}).value || '';
    var newpwd  = (form.querySelector('[name="new_password"]')    || {}).value || '';
    var confirm = (form.querySelector('[name="confirm_password"]') || {}).value || '';
    var btn = form.querySelector('[type="submit"]');
    var orig = btn ? btn.textContent : 'Change Password';

    if (!current || newpwd.length < 8) {
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast('Current password and new password (min 8) required.', 'danger');
      return;
    }
    if (newpwd !== confirm) {
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast('New passwords do not match.', 'danger');
      return;
    }
    if (btn) { btn.textContent = 'Updating…'; btn.disabled = true; }

    var csrf = document.querySelector('meta[name="csrf-token"]');
    csrf = csrf ? csrf.getAttribute('content') : '';

    fetch('/api/change-password', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
      body: JSON.stringify({ current_password: current, new_password: newpwd, confirm_password: confirm })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (btn) { btn.textContent = orig; btn.disabled = false; }
      var msg = d.ok ? d.message : (d.error || 'Failed');
      var type = d.ok ? 'success' : 'danger';
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(msg, type);
      if (d.ok) form.reset();
    })
    .catch(function(e) {
      if (btn) { btn.textContent = orig; btn.disabled = false; }
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(String(e), 'danger');
    });
  });
})();

// ── PROFILE UPDATE FORM ───────────────────────────────────────
(function initProfileUpdate() {
  var form = document.getElementById('profileUpdateForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name  = (form.querySelector('[name="name"]')  || {}).value || '';
    var org   = (form.querySelector('[name="org"]')   || {}).value || '';
    var phone = (form.querySelector('[name="phone"]') || {}).value || '';
    var btn   = form.querySelector('[type="submit"]');
    var orig  = btn ? btn.textContent : 'Update Profile';
    if (!name.trim()) {
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast('Name is required.', 'danger');
      return;
    }
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
    var csrf = document.querySelector('meta[name="csrf-token"]');
    csrf = csrf ? csrf.getAttribute('content') : '';
    fetch('/api/profile', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
      body: JSON.stringify({ name: name, org: org, phone: phone })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (btn) { btn.textContent = orig; btn.disabled = false; }
      var type = d.ok ? 'success' : 'danger';
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.ok ? d.message : d.error, type);
    })
    .catch(function(e) {
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    });
  });
})();

// ── FILE UPLOAD SUBMIT ────────────────────────────────────────
(function initUploadSubmit() {
  var uploadBtn = document.getElementById('uploadSubmitBtn');
  var fileInput = document.getElementById('fileInput');
  if (!uploadBtn) return;

  uploadBtn.addEventListener('click', function() {
    // Check for files in the upload list (drag-drop) OR fileInput
    var list = document.getElementById('uploadList');
    var fileCount = list ? list.querySelectorAll('.upload-file').length : 0;
    var inputFiles = fileInput ? fileInput.files : null;
    var totalFiles = fileCount + (inputFiles ? inputFiles.length : 0);

    if (totalFiles === 0) {
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast('Please select files to upload first.', 'warning');
      return;
    }

    var orig = uploadBtn.textContent;
    uploadBtn.textContent = 'Uploading…';
    uploadBtn.disabled = true;

    // Build FormData with files
    var formData = new FormData();
    var added = 0;

    // Add files from fileInput
    if (inputFiles) {
      for (var i = 0; i < inputFiles.length; i++) {
        formData.append('file', inputFiles[i]);
        added++;
      }
    }

    // If no files from input, show success for drag-drop preview
    if (added === 0) {
      uploadBtn.textContent = '✓ Files Queued';
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(fileCount + ' file(s) ready for upload.', 'success');
      setTimeout(function() { uploadBtn.textContent = orig; uploadBtn.disabled = false; }, 3000);
      return;
    }

    // Get CSRF token
    var csrf = '';
    var meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) csrf = meta.getAttribute('content');

    fetch('/api/upload', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRFToken': csrf },
      body: formData
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      uploadBtn.textContent = d.ok ? '✓ Uploaded' : orig;
      uploadBtn.disabled = false;
      var type = d.ok ? 'success' : 'danger';
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast(d.message || d.error, type);
      if (d.ok && fileInput) { fileInput.value = ''; }
      if (d.ok && list) { list.innerHTML = ''; }
      setTimeout(function() { uploadBtn.textContent = orig; }, 3000);
    })
    .catch(function(err) {
      uploadBtn.textContent = orig;
      uploadBtn.disabled = false;
      if (window.KCS && window.KCS.ui) window.KCS.ui.showToast('Upload failed: ' + err, 'danger');
    });
  });
})();

// ── EXPOSE GLOBAL HELPERS ─────────────────────────────────────
window.updateUserStatus    = updateUserStatus;
window.updateIncidentStatus = updateIncidentStatus;
window.updateTicketStatus   = updateTicketStatus;
