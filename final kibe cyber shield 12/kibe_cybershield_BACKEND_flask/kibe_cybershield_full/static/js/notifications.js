// ============================================================
// KIBE CYBERSHIELD — notifications.js
// Generates smart notifications from live API data (alerts,
// incidents, tickets). Updates badge count in topbar.
// ============================================================

'use strict';

var _notifCache = [];
var _unreadCount = 0;

function escN(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── BUILD NOTIFICATIONS FROM LIVE DATA ───────────────────────
function buildNotifications(alerts, incidents, tickets) {
  var items = [];
  var now = Date.now();

  (alerts || []).slice(0, 3).forEach(function(a) {
    items.push({
      id:     'a-' + a.id,
      type:   a.severity === 'critical' || a.severity === 'high' ? 'alert' : 'info',
      text:   a.title + ' — ' + (a.source || ''),
      time:   a.created_at ? a.created_at.substring(0, 16).replace('T', ' ') : 'recently',
      unread: a.status === 'active' || a.status === 'investigating',
    });
  });

  (incidents || []).filter(function(i) {
    return i.status === 'open' || i.status === 'investigating';
  }).slice(0, 3).forEach(function(i) {
    items.push({
      id:     'i-' + i.id,
      type:   i.severity === 'critical' ? 'alert' : 'warning',
      text:   'Incident: ' + i.title,
      time:   i.created_at ? i.created_at.substring(0, 10) : '',
      unread: true,
    });
  });

  (tickets || []).filter(function(t) {
    return t.status === 'open';
  }).slice(0, 2).forEach(function(t) {
    items.push({
      id:     't-' + t.id,
      type:   'info',
      text:   'Open ticket: ' + t.subject,
      time:   t.created_at ? t.created_at.substring(0, 10) : '',
      unread: false,
    });
  });

  if (!items.length) {
    items.push({
      id: 'sys-ok', type: 'success',
      text: 'All systems operational — no active alerts',
      time: 'now', unread: false,
    });
  }

  return items;
}

// ── RENDER NOTIFICATION LIST ──────────────────────────────────
function renderNotifications(items, listId) {
  var list = document.getElementById(listId);
  if (!list) return;

  list.innerHTML = items.map(function(n) {
    var dot = n.type === 'alert' ? 'critical' :
              n.type === 'warning' ? 'high' :
              n.type === 'success' ? 'low' : 'medium';
    return '<div class="notif-item' + (n.unread ? ' unread' : '') + '">' +
      '<div class="notif-dot ' + dot + '"></div>' +
      '<div class="notif-body">' +
        '<div class="notif-text">' + escN(n.text) + '</div>' +
        '<div class="notif-time">' + escN(n.time) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── UPDATE BADGE COUNT ────────────────────────────────────────
function updateBadge(count) {
  document.querySelectorAll('[data-notif-badge], .notif-badge, #notifBadge').forEach(function(el) {
    el.textContent = count > 0 ? count : '';
    el.style.display = count > 0 ? '' : 'none';
  });
}

// ── FETCH AND REFRESH ─────────────────────────────────────────
function refreshNotifications() {
  // Fetch alerts (always available) and try incidents/tickets
  Promise.all([
    fetch('/api/alerts',    { credentials: 'same-origin' }).then(function(r) { return r.json(); }).catch(function() { return []; }),
    fetch('/api/incidents', { credentials: 'same-origin' }).then(function(r) { return r.json(); }).catch(function() { return []; }),
    fetch('/api/tickets',   { credentials: 'same-origin' }).then(function(r) { return r.json(); }).catch(function() { return []; }),
  ]).then(function(results) {
    var alerts    = results[0];
    var incidents = results[1];
    var tickets   = results[2];

    _notifCache = buildNotifications(alerts, incidents, tickets);
    _unreadCount = _notifCache.filter(function(n) { return n.unread; }).length;

    ['notifList', 'notifPanelList'].forEach(function(id) {
      renderNotifications(_notifCache, id);
    });
    updateBadge(_unreadCount);
  }).catch(function() {});
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (!document.querySelector('[data-content-section]')) return;

  refreshNotifications();
  setInterval(refreshNotifications, 45000);

  // Mark-all-read on panel open
  var bell = document.querySelector('[data-notif-toggle], #notifToggle, .topbar-icon[data-action="notifications"]');
  if (bell) {
    bell.addEventListener('click', function() {
      _unreadCount = 0;
      updateBadge(0);
      _notifCache.forEach(function(n) { n.unread = false; });
    });
  }
});

// ── GLOBALS ───────────────────────────────────────────────────
window.KCS = window.KCS || {};
window.KCS.notifications = {
  refresh: refreshNotifications,
  getCache: function() { return _notifCache; },
  getUnreadCount: function() { return _unreadCount; },
};
