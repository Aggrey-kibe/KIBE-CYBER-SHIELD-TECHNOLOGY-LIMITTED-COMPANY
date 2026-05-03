"""
================================================================
KIBE CYBERSHIELD — HEALTH MONITOR (health_monitor.py)
Run this script at any time to perform a full system health check.
Usage: python health_monitor.py
================================================================
"""

import sys, os, json, sqlite3, time, re, re as _re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

PASS = 0; FAIL = 0; WARNS = []

def t(label, ok, detail='', warn=False):
    global PASS, FAIL
    sym = '✓' if ok else ('⚠' if warn else '✗')
    if ok: PASS += 1
    elif warn: WARNS.append(label)
    else: FAIL += 1
    print(f'  {sym} {label}' + (f' [{detail}]' if detail else ''))

def section(title):
    print(f'\n── {title} {"─"*(54-len(title))}')

print('═'*58)
print('  KIBE CYBERSHIELD — SYSTEM HEALTH MONITOR')
print(f'  {time.strftime("%Y-%m-%d %H:%M:%S EAT")}')
print('═'*58)

# ── 1. File Integrity ─────────────────────────────────────────
section('1. File Integrity')
required_files = [
    'app.py',
    'requirements.txt',
    'database/db.sqlite3',
    'static/css/style.css',
    'static/css/dashboard.css',
    'static/css/forms.css',
    'static/css/responsive.css',
    'static/js/main.js',
    'static/js/auth.js',
    'static/js/navigation.js',
    'static/js/notifications.js',
    'static/js/security.js',
    'templates/index.html',
    'templates/login.html',
    'templates/register.html',
    'templates/forgot_password.html',
    'templates/reset_password.html',
    'templates/admin.html',
    'templates/staff.html',
    'templates/client.html',
    'templates/about.html',
    'templates/services.html',
    'templates/contact.html',
    'templates/dashboard.html',
    'templates/404.html',
    'templates/403.html',
    'templates/500.html',
]
for f in required_files:
    t(f, os.path.isfile(f), 'MISSING' if not os.path.isfile(f) else '')

# ── 2. Python Syntax ──────────────────────────────────────────
section('2. Python Syntax')
import ast
try:
    with open('app.py') as f: ast.parse(f.read())
    t('app.py syntax', True)
except SyntaxError as e:
    t('app.py syntax', False, str(e))

# ── 3. Template Syntax ────────────────────────────────────────
section('3. Template Syntax (Jinja2)')
try:
    from app import app
    for tmpl in sorted(os.listdir('templates')):
        if not tmpl.endswith('.html'): continue
        try:
            app.jinja_env.get_template(tmpl)
            t(tmpl, True)
        except Exception as e:
            t(tmpl, False, str(e)[:60])
except Exception as e:
    t('app import', False, str(e))

# ── 4. Database ───────────────────────────────────────────────
section('4. Database Integrity')
try:
    conn = sqlite3.connect('database/db.sqlite3')
    conn.row_factory = sqlite3.Row
    required_tables = ['users','roles','tickets','incidents','alerts','logs','services','password_resets']
    existing = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    for tbl in required_tables:
        t(f'Table: {tbl}', tbl in existing)
    if 'users' in existing:
        cnt = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
        t(f'Users seeded ({cnt})', cnt >= 3)
        bad = conn.execute("SELECT COUNT(*) FROM users WHERE password_hash NOT LIKE 'pbkdf2:%'").fetchone()[0]
        t('No plaintext passwords', bad == 0, f'{bad} plaintext found' if bad else '')
    conn.close()
except Exception as e:
    t('Database connection', False, str(e))

# ── 5. Security Config ────────────────────────────────────────
section('5. Security Configuration')
with open('app.py') as f: src = f.read()
security_checks = [
    ('CSRF validation on POST routes', src.count('validate_csrf()') >= 5),
    ('Password hashing (PBKDF2)', 'generate_password_hash' in src),
    ('Brute-force protection', 'MAX_LOGIN_ATTEMPTS' in src),
    ('Session timeout (30 min)', '1800' in src or 'minutes=30' in src),
    ('SESSION_COOKIE_HTTPONLY', 'SESSION_COOKIE_HTTPONLY' in src and 'True' in src),
    ('SESSION_COOKIE_SAMESITE', 'SESSION_COOKIE_SAMESITE' in src),
    ('Role-based access decorators', '@role_required' in src),
    ('Parameterised queries only', 'f"SELECT' not in src and "f'SELECT" not in src),
    ('Audit logging enabled', "audit('LOGIN" in src),
    ('Forgot password token flow', '/forgot-password' in src and 'password_resets' in src),
]
for label, ok in security_checks:
    t(label, ok)

# ── 6. Route Count ────────────────────────────────────────────
section('6. API Routes')
routes = re.findall(r"^@app\.route\('([^']+)'", src, re.MULTILINE)
t(f'Total routes defined ({len(routes)})', len(routes) >= 25)
required_routes = ['/', '/login', '/register', '/logout', '/admin', '/staff', '/client',
                   '/forgot-password', '/reset-password/<token>', '/api/incidents',
                   '/api/tickets', '/api/services', '/api/users', '/api/alerts',
                   '/api/logs', '/api/stats', '/api/csrf-token', '/api/session-check']
for route in required_routes:
    t(f'Route: {route}', route in routes or route.replace('<token>','<token>') in src)

# ── 7. Functional Test ────────────────────────────────────────
section('7. Functional Health Tests')
try:
    from app import app, init_db
    init_db()

    with app.test_client() as c:
        # Public pages
        for path in ['/', '/login', '/register']:
            r = c.get(path)
            t(f'GET {path} → 200', r.status_code == 200, str(r.status_code))

        # Auth guard
        for path in ['/admin', '/staff', '/client']:
            r = c.get(path)
            t(f'{path} → blocked', r.status_code in (301, 302))

        # Login all roles
        def csrf_tok(c, path='/login'):
            r = c.get(path)
            m = _re.search(r'name="csrf_token" value="([^"]+)"', r.data.decode())
            return m.group(1) if m else ''

        for email, pwd, role, dash in [
            ('admin@kibecyber.com', 'Admin@123', 'admin', '/admin'),
            ('staff@kibecyber.com', 'Staff@123', 'staff', '/staff'),
            ('client@kibecyber.com', 'Client@123', 'client', '/client'),
        ]:
            tok = csrf_tok(c)
            r = c.post('/login', data={'email': email, 'password': pwd, 'csrf_token': tok})
            t(f'{role} login + dashboard', r.status_code in (301, 302) and c.get(dash).status_code == 200)
            c.get('/logout')

        # API endpoints
        tok = csrf_tok(c)
        c.post('/login', data={'email': 'admin@kibecyber.com', 'password': 'Admin@123', 'csrf_token': tok})
        api_tok = json.loads(c.get('/api/csrf-token').data).get('csrf_token', '')
        for ep in ['/api/users', '/api/incidents', '/api/tickets', '/api/services', '/api/alerts', '/api/logs', '/api/stats']:
            r = c.get(ep)
            t(f'GET {ep}', r.status_code == 200)

        # 404 handler
        t('404 handler', c.get('/no-route-xyz99').status_code == 404)

except Exception as e:
    t('Functional tests', False, str(e))

# ── Summary ───────────────────────────────────────────────────
print(f'\n{"═"*58}')
total = PASS + FAIL
print(f'  HEALTH CHECK: {PASS}/{total} passed | {FAIL} failed | {len(WARNS)} warnings')
print(f'{"═"*58}')
if FAIL == 0:
    print('  ✅ SYSTEM IS HEALTHY — ALL CHECKS PASSED')
    print('  Ready for production deployment')
else:
    print(f'  ⚠  {FAIL} issue(s) detected — review above')
    sys.exit(1)
