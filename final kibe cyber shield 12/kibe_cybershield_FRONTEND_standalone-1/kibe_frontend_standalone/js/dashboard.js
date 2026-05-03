// ============================================================
// KIBE CYBERSHIELD — dashboard.js
// Renders analytics charts using live data from Flask API.
// Uses Canvas 2D API directly (no external dependencies).
// ============================================================

'use strict';

// ── COLOUR PALETTE ────────────────────────────────────────────
var COLOURS = {
  critical: '#EF4444',
  high:     '#F59E0B',
  medium:   '#00C2FF',
  low:      '#22C55E',
  open:     '#F59E0B',
  in_progress: '#00C2FF',
  resolved: '#22C55E',
  closed:   '#64748B',
  bg:       'rgba(30,41,59,0.8)',
  grid:     'rgba(100,116,139,0.15)',
  text:     '#94A3B8',
};

// ── SIMPLE BAR CHART (Canvas 2D) ─────────────────────────────
function drawBarChart(canvasId, labels, values, colors) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = canvas.offsetWidth || 400;
  var H = canvas.offsetHeight || 220;
  canvas.width  = W;
  canvas.height = H;

  var pad = { top: 20, right: 20, bottom: 50, left: 45 };
  var chartW = W - pad.left - pad.right;
  var chartH = H - pad.top  - pad.bottom;
  var maxVal = Math.max.apply(null, values) || 1;
  var barW   = Math.min(48, (chartW / values.length) * 0.6);
  var gap    = chartW / values.length;

  // Background
  ctx.fillStyle = 'transparent';
  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = COLOURS.grid;
  ctx.lineWidth = 1;
  for (var g = 0; g <= 4; g++) {
    var y = pad.top + chartH - (g / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    // Y axis labels
    ctx.fillStyle = COLOURS.text;
    ctx.font = '11px IBM Plex Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round((g / 4) * maxVal), pad.left - 8, y + 4);
  }

  // Bars
  values.forEach(function(val, i) {
    var x = pad.left + gap * i + (gap - barW) / 2;
    var barH = (val / maxVal) * chartH;
    var y    = pad.top + chartH - barH;

    // Bar fill with gradient
    var grad = ctx.createLinearGradient(0, y, 0, y + barH);
    var col  = colors[i] || COLOURS.medium;
    grad.addColorStop(0, col);
    grad.addColorStop(1, col + '66');
    ctx.fillStyle = grad;

    // Rounded top
    var r = Math.min(4, barH / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.arcTo(x + barW, y, x + barW, y + r, r);
    ctx.lineTo(x + barW, y + barH);
    ctx.lineTo(x, y + barH);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();

    // Value label on top
    if (val > 0) {
      ctx.fillStyle = '#E8F0FE';
      ctx.font      = 'bold 12px IBM Plex Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(val, x + barW / 2, y - 6);
    }

    // X axis label
    ctx.fillStyle  = COLOURS.text;
    ctx.font       = '11px Inter, sans-serif';
    ctx.textAlign  = 'center';
    var label = labels[i] || '';
    ctx.fillText(label.charAt(0).toUpperCase() + label.slice(1), x + barW / 2, H - 8);
  });
}

// ── DONUT CHART (Canvas 2D) ───────────────────────────────────
function drawDonutChart(canvasId, labels, values, colors) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = canvas.offsetWidth || 400;
  var H = canvas.offsetHeight || 220;
  canvas.width  = W;
  canvas.height = H;

  var total = values.reduce(function(a, b) { return a + b; }, 0) || 1;
  var cx    = W * 0.38;
  var cy    = H / 2;
  var outer = Math.min(cx, cy) * 0.85;
  var inner = outer * 0.55;

  ctx.clearRect(0, 0, W, H);

  var startAngle = -Math.PI / 2;
  values.forEach(function(val, i) {
    if (!val) return;
    var sweep = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outer, startAngle, startAngle + sweep);
    ctx.closePath();
    ctx.fillStyle = colors[i] || COLOURS.medium;
    ctx.fill();
    startAngle += sweep;
  });

  // Inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  ctx.fillStyle = '#111827';
  ctx.fill();

  // Centre text
  ctx.fillStyle  = '#E8F0FE';
  ctx.font       = 'bold 22px Syne, sans-serif';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 8);
  ctx.font      = '11px Inter, sans-serif';
  ctx.fillStyle = COLOURS.text;
  ctx.fillText('total', cx, cy + 12);

  // Legend
  var lx = W * 0.68;
  var ly = cy - (labels.length * 20) / 2;
  labels.forEach(function(label, i) {
    var y = ly + i * 24;
    ctx.fillStyle = colors[i] || COLOURS.medium;
    ctx.fillRect(lx, y, 12, 12);
    ctx.fillStyle  = COLOURS.text;
    ctx.font       = '12px Inter, sans-serif';
    ctx.textAlign  = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      (label.charAt(0).toUpperCase() + label.slice(1).replace('_',' ')).substring(0, 12) +
      ' (' + values[i] + ')',
      lx + 18, y
    );
  });
}

// ── FETCH LIVE DATA AND DRAW ───────────────────────────────────
function renderCharts() {
  Promise.all([
    fetch('/api/incidents', { credentials: 'same-origin' }).then(function(r){ return r.json(); }).catch(function(){ return []; }),
    fetch('/api/tickets',   { credentials: 'same-origin' }).then(function(r){ return r.json(); }).catch(function(){ return []; }),
  ]).then(function(results) {
    var incidents = Array.isArray(results[0]) ? results[0] : [];
    var tickets   = Array.isArray(results[1]) ? results[1] : [];

    // Incident severity breakdown
    var sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    incidents.forEach(function(i) { if (sevCounts[i.severity] !== undefined) sevCounts[i.severity]++; });
    drawBarChart(
      'incidentChart',
      Object.keys(sevCounts),
      Object.values(sevCounts),
      [COLOURS.critical, COLOURS.high, COLOURS.medium, COLOURS.low]
    );

    // Ticket status breakdown
    var sttCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    tickets.forEach(function(t) { if (sttCounts[t.status] !== undefined) sttCounts[t.status]++; });
    drawDonutChart(
      'ticketChart',
      Object.keys(sttCounts),
      Object.values(sttCounts),
      [COLOURS.open, COLOURS.in_progress, COLOURS.resolved, COLOURS.closed]
    );
  }).catch(function() {});
}

// ── RESIZE HANDLER ────────────────────────────────────────────
var _resizeTimer;
window.addEventListener('resize', function() {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(renderCharts, 250);
});

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('incidentChart') && !document.getElementById('ticketChart')) return;

  // Draw after short delay to let layout settle
  setTimeout(renderCharts, 400);

  // Redraw when overview section is clicked / shown
  document.querySelectorAll('[data-section="overview"]').forEach(function(link) {
    link.addEventListener('click', function() {
      setTimeout(renderCharts, 150);
    });
  });

  // Refresh charts every 5 minutes
  setInterval(renderCharts, 300000);
});

// ── GLOBALS ───────────────────────────────────────────────────
window.KCS = window.KCS || {};
window.KCS.dashboard = {
  renderCharts:    renderCharts,
  drawBarChart:    drawBarChart,
  drawDonutChart:  drawDonutChart,
};
