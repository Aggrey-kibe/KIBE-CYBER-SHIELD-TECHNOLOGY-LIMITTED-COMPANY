// ============================================================
// KIBE CYBERSHIELD — security.js
// Fetches live alerts & logs from Flask API, renders into UI.
// Falls back to inline Jinja2-rendered data when available.
// ============================================================

'use strict';

// ── SEVERITY BADGE HELPER ─────────────────────────────────────
function severityBadge(sev) {
  var map = {
    critical: 'badge-danger',
    high:     'badge-warning',
    medium:   'badge-info',
    low:      'badge-success',
  };
  return 'badge ' + (map[sev] || 'badge-info');
}

function severityDot(sev) {
  return '<div class="alert-dot ' + (sev || 'low') + '"></div>';
}

// ── RENDER ALERTS INTO A CONTAINER ───────────────────────────
function renderAlerts(alerts, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (!alerts || alerts.length === 0) {
    container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--c-text3);">No active alerts</div>';
    return;
  }

  container.innerHTML = alerts.map(function(a) {
    return [
      '<div class="alert-item ' + (a.severity || '') + '">',
        severityDot(a.severity),
        '<div class="alert-info-text">',
          '<div class="alert-title">' + escHtml(a.title) + '</div>',
          '<div class="alert-meta">' + escHtml(a.alert_id || '') + ' &bull; ' + escHtml(a.source || '') + '</div>',
        '</div>',
        '<span class="' + severityBadge(a.severity) + '" style="font-size:0.72rem;white-space:nowrap;">' + escHtml(a.severity || '') + '</span>',
      '</div>',
    ].join('');
  }).join('');
}

// ── RENDER AUDIT LOG ENTRIES ──────────────────────────────────
function renderLogs(logs, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--c-text3);">No log entries</div>';
    return;
  }

  container.innerHTML = logs.map(function(log) {
    var time = (log.created_at || '').length > 10 ? log.created_at.substring(11, 19) : (log.created_at || '');
    return [
      '<div class="log-entry">',
        '<span class="log-time">' + escHtml(time) + '</span>',
        '<span class="log-event">' + escHtml(log.detail || '') + '</span>',
        '<span class="badge badge-info" style="font-size:0.7rem;">' + escHtml(log.action || '') + '</span>',
        '<span class="log-user">' + escHtml(log.user_email || 'system') + '</span>',
      '</div>',
    ].join('');
  }).join('');
}

// ── HTML ESCAPE UTILITY ───────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── LIVE DATA FETCH ───────────────────────────────────────────
function refreshAlerts() {
  fetch('/api/alerts', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      // Render into every alert container found on the page
      ['alertListMain', 'securityAlertList', 'alertListOverview'].forEach(function(id) {
        renderAlerts(data, id);
      });
      renderAlertsTable(data, 'alertsTableBody');
    })
    .catch(function() {}); // Fail silently if not logged in
}

function refreshLogs() {
  fetch('/api/logs?limit=50', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      ['auditLogList', 'auditLogFull', 'auditLogOverview'].forEach(function(id) {
        renderLogs(data, id);
      });
    })
    .catch(function() {});
}

// ── INIT ON PAGE LOAD ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var onDashboard = document.querySelector('[data-content-section]');
  if (!onDashboard) return;

  // Initial fetch
  refreshAlerts();
  refreshLogs();

  // Auto-refresh every 30 seconds
  setInterval(refreshAlerts, 30000);
  setInterval(refreshLogs, 60000);
});

// ── EXPOSE GLOBALS ────────────────────────────────────────────
window.KCS = window.KCS || {};
window.KCS.security = {
  renderAlerts: renderAlerts,
  renderLogs:   renderLogs,
  refreshAlerts: refreshAlerts,
  refreshLogs:   refreshLogs,
};

// ── RENDER ALERTS AS TABLE ROWS ──────────────────────────────
function renderAlertsTable(alerts, tbodyId) {
  var tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!alerts || !alerts.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--c-text3);padding:20px;">No alerts found</td></tr>';
    return;
  }
  tbody.innerHTML = alerts.map(function(a) {
    var time = a.created_at && a.created_at.length > 10 ? a.created_at.substring(11, 19) : '';
    var sevCls = {critical:'badge-danger',high:'badge-warning',medium:'badge-info',low:'badge-success'}[a.severity] || 'badge-info';
    var stCls  = {active:'badge-warning',investigating:'badge-warning',blocked:'badge-danger',
                  resolved:'badge-success',noted:'badge-success',monitoring:'badge-info'}[a.status] || 'badge-info';
    return '<tr>' +
      '<td class="font-mono text-muted">' + escHtml(a.alert_id || '') + '</td>' +
      '<td><span class="badge ' + sevCls + '">' + escHtml(a.severity || '') + '</span></td>' +
      '<td>' + escHtml(a.title || '') + '</td>' +
      '<td class="font-mono text-muted" style="font-size:0.8rem;">' + escHtml(a.source || '') + '</td>' +
      '<td class="font-mono text-muted" style="font-size:0.8rem;">' + time + '</td>' +
      '<td><span class="badge ' + stCls + '">' + escHtml(a.status || '') + '</span></td>' +
      '<td><button class="btn-ghost" style="padding:4px 10px;font-size:0.78rem;">Investigate</button></td>' +
    '</tr>';
  }).join('');
}

