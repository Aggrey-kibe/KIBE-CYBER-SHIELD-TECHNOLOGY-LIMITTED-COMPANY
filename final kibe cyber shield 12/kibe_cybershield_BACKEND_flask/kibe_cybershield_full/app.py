"""
Kibe CyberShield Technology — app.py  (v2 — full integration)
Pure stdlib: Flask + sqlite3 + hashlib. No SQLAlchemy / bcrypt required.
Password security: PBKDF2-HMAC-SHA256, 310 000 iterations (NIST 2023 rec.)
"""

from flask import (Flask, render_template, request, redirect,
                   url_for, session, flash, jsonify)
from datetime import datetime, timedelta
import sqlite3, hashlib, os, secrets, re
from functools import wraps

app = Flask(__name__)
app.secret_key        = os.environ.get('SECRET_KEY', 'kibe-cs-xK9#mP!2026-ultra')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=8)
app.config['SESSION_COOKIE_HTTPONLY']    = True
app.config['SESSION_COOKIE_SAMESITE']   = 'Lax'

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

# ── DATABASE ──────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            email         TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL DEFAULT 'client'
                              CHECK(role IN ('admin','staff','client')),
            status        TEXT NOT NULL DEFAULT 'active'
                              CHECK(status IN ('active','suspended')),
            phone         TEXT,
            department    TEXT,
            created_at    TEXT DEFAULT (datetime('now','utc')),
            last_login    TEXT
        );
        CREATE TABLE IF NOT EXISTS incidents (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            description TEXT,
            severity    TEXT NOT NULL DEFAULT 'medium'
                            CHECK(severity IN ('low','medium','high','critical')),
            status      TEXT NOT NULL DEFAULT 'open'
                            CHECK(status IN ('open','investigating','resolved')),
            assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at  TEXT DEFAULT (datetime('now','utc')),
            updated_at  TEXT DEFAULT (datetime('now','utc'))
        );
        CREATE TABLE IF NOT EXISTS alerts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            message    TEXT,
            alert_type TEXT NOT NULL DEFAULT 'info'
                           CHECK(alert_type IN ('info','warning','danger','success')),
            source     TEXT,
            is_read    INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','utc'))
        );
        CREATE TABLE IF NOT EXISTS tickets (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            subject     TEXT NOT NULL,
            description TEXT,
            priority    TEXT NOT NULL DEFAULT 'medium'
                            CHECK(priority IN ('low','medium','high')),
            status      TEXT NOT NULL DEFAULT 'open'
                            CHECK(status IN ('open','in_progress','closed')),
            created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
            assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at  TEXT DEFAULT (datetime('now','utc')),
            updated_at  TEXT DEFAULT (datetime('now','utc'))
        );
        CREATE TABLE IF NOT EXISTS logs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action     TEXT NOT NULL,
            details    TEXT,
            ip_address TEXT,
            created_at TEXT DEFAULT (datetime('now','utc'))
        );
        CREATE TABLE IF NOT EXISTS services (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            icon        TEXT DEFAULT 'shield-alt',
            status      TEXT NOT NULL DEFAULT 'active'
                            CHECK(status IN ('active','inactive')),
            price       TEXT
        );
        """)
        db.commit()

def seed_db():
    with get_db() as db:
        if not db.execute("SELECT 1 FROM services LIMIT 1").fetchone():
            db.executemany(
                "INSERT INTO services(name,description,icon,price) VALUES(?,?,?,?)",
                [
                    ('Threat Detection',        'AI-powered real-time threat detection and analysis for your infrastructure.',     'brain',         '$299/mo'),
                    ('Incident Response',        '24/7 incident response team ready to neutralize threats immediately.',           'bolt',          '$499/mo'),
                    ('Network Monitoring',       'Continuous network traffic analysis and anomaly detection.',                     'network-wired', '$199/mo'),
                    ('Vulnerability Assessment', 'Comprehensive scanning and remediation of system vulnerabilities.',              'search',        '$399/mo'),
                    ('SOC as a Service',         'Full Security Operations Center managed by certified analysts.',                 'server',        '$999/mo'),
                    ('Security Consulting',      'Expert cybersecurity advisory, policy development and strategic roadmaps.',      'users',         '$250/hr'),
                ])
        if not db.execute("SELECT 1 FROM alerts LIMIT 1").fetchone():
            db.executemany(
                "INSERT INTO alerts(title,message,alert_type,source) VALUES(?,?,?,?)",
                [
                    ('Brute Force Detected',       'Multiple failed login attempts from IP 192.168.1.105',             'danger',  'Auth System'),
                    ('SSL Certificate Expiring',    'Certificate for api.kibeshield.com expires in 14 days',           'warning', 'Cert Monitor'),
                    ('System Update Available',     'Security patch KB2024-001 is available for deployment',           'info',    'Update Manager'),
                    ('Firewall Rule Updated',       'New egress rules deployed successfully across all nodes',         'success', 'Firewall'),
                    ('Suspicious Outbound Traffic', 'Unusual data exfiltration pattern detected on port 4444',        'danger',  'IDS'),
                    ('New Malware Signature Added',  'Threat DB updated — 1 243 new signatures loaded',                'info',    'AV Engine'),
                ])
        if not db.execute("SELECT 1 FROM incidents LIMIT 1").fetchone():
            db.executemany(
                "INSERT INTO incidents(title,description,severity,status) VALUES(?,?,?,?)",
                [
                    ('SQL Injection Attempt', 'Detected SQL injection attack on login endpoint',  'high',     'investigating'),
                    ('Phishing Campaign',      'Targeted phishing emails sent to 3 staff members','medium',   'open'),
                    ('Malware Detection',      'Trojan detected on workstation WS-042',           'critical', 'open'),
                    ('Unauthorized Access',    'Access attempt on admin panel from unknown IP',   'high',     'resolved'),
                    ('Port Scan Detected',     'External actor scanning ports 1-1024 on perimeter','low',     'resolved'),
                ])
        for email, name, role, pw in [
            ('admin@kibeshield.com',  'Aggrey Kibe', 'admin',  'Admin@2026'),
            ('staff@kibeshield.com',  'SOC Analyst', 'staff',  'Staff@2026'),
            ('client@kibeshield.com', 'Demo Client', 'client', 'Client@2026'),
        ]:
            if not db.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
                db.execute("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
                           (name, email, hash_password(pw), role))
        db.commit()

# ── PASSWORD ──────────────────────────────────────────────────────────────────
PBKDF2_ITER = 310_000

def hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    dk   = hashlib.pbkdf2_hmac('sha256', pw.encode(), salt.encode(), PBKDF2_ITER)
    return f"pbkdf2:{PBKDF2_ITER}${salt}${dk.hex()}"

def check_password(pw: str, stored: str) -> bool:
    try:
        meta, salt, dk_hex = stored.split('$')
        iters = int(meta.split(':')[1])
        dk    = hashlib.pbkdf2_hmac('sha256', pw.encode(), salt.encode(), iters)
        return secrets.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False

def validate_password(pw: str):
    if len(pw) < 8:                   return 'Password must be at least 8 characters.'
    if not re.search(r'[A-Z]', pw):   return 'Password must contain an uppercase letter.'
    if not re.search(r'[0-9]', pw):   return 'Password must contain a digit.'
    return None

# ── HELPERS ───────────────────────────────────────────────────────────────────
def log_action(action: str, details: str = ''):
    try:
        with get_db() as db:
            db.execute("INSERT INTO logs(user_id,action,details,ip_address) VALUES(?,?,?,?)",
                       (session.get('user_id'), action, details, request.remote_addr))
            db.commit()
    except Exception:
        pass

def ts(iso_str):
    if not iso_str: return ''
    return str(iso_str)[:16].replace('T',' ')

app.jinja_env.filters['ts'] = ts

def login_required(f):
    @wraps(f)
    def decorated(*a, **kw):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*a, **kw)
    return decorated

def role_required(*roles):
    def deco(f):
        @wraps(f)
        def decorated(*a, **kw):
            if 'user_id' not in session:
                flash('Please log in.', 'warning')
                return redirect(url_for('login'))
            if session.get('role') not in roles:
                flash('Access denied — insufficient permissions.', 'danger')
                return redirect(url_for('dashboard'))
            return f(*a, **kw)
        return decorated
    return deco

# ── SECURITY HEADERS ──────────────────────────────────────────────────────────
@app.after_request
def set_security_headers(resp):
    resp.headers['X-Content-Type-Options'] = 'nosniff'
    resp.headers['X-Frame-Options']        = 'SAMEORIGIN'
    resp.headers['X-XSS-Protection']       = '1; mode=block'
    resp.headers['Referrer-Policy']        = 'strict-origin-when-cross-origin'
    return resp

# ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/services')
def services():
    with get_db() as db:
        svcs = db.execute("SELECT * FROM services WHERE status='active' ORDER BY id").fetchall()
    return render_template('services.html', services=svcs)

@app.route('/contact', methods=['GET','POST'])
def contact():
    if request.method == 'POST':
        name    = request.form.get('name','').strip()
        email   = request.form.get('email','').strip()
        subject = request.form.get('subject','General Inquiry').strip()
        message = request.form.get('message','').strip()
        if not name or not email or not message:
            flash('All fields are required.', 'danger')
        elif not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            flash('Please enter a valid email address.', 'danger')
        else:
            log_action('Contact Form', f'{name} <{email}> — {subject}')
            flash('Message sent! Our team will respond within 24 hours.', 'success')
            return redirect(url_for('contact'))
    return render_template('contact.html')

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route('/login', methods=['GET','POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        email    = request.form.get('email','').strip().lower()
        password = request.form.get('password','')
        remember = request.form.get('remember')
        with get_db() as db:
            user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if user and user['status'] == 'active' and check_password(password, user['password_hash']):
            session.clear()
            session['user_id'] = user['id']
            session['name']    = user['name']
            session['email']   = user['email']
            session['role']    = user['role']
            if remember:
                session.permanent = True
            with get_db() as db:
                db.execute("UPDATE users SET last_login=? WHERE id=?",
                           (datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'), user['id']))
                db.commit()
            log_action('Login', f'{email} authenticated')
            flash(f'Welcome back, {user["name"]}!', 'success')
            return redirect(url_for('dashboard'))
        elif user and user['status'] == 'suspended':
            flash('Your account has been suspended. Contact support.', 'danger')
            log_action('Blocked Login', f'Suspended account: {email}')
        else:
            flash('Invalid email or password.', 'danger')
            log_action('Failed Login', f'Bad credentials for: {email}')
    return render_template('login.html')

@app.route('/register', methods=['GET','POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        name     = request.form.get('name','').strip()
        email    = request.form.get('email','').strip().lower()
        password = request.form.get('password','')
        confirm  = request.form.get('confirm_password','')
        if not name or not email or not password or not confirm:
            flash('All fields are required.', 'danger')
        elif not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            flash('Please enter a valid email address.', 'danger')
        elif password != confirm:
            flash('Passwords do not match.', 'danger')
        else:
            err = validate_password(password)
            if err:
                flash(err, 'danger')
            else:
                with get_db() as db:
                    if db.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
                        flash('That email is already registered. Please log in.', 'warning')
                    else:
                        db.execute("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
                                   (name, email, hash_password(password), 'client'))
                        db.commit()
                        log_action('Register', f'New client: {email}')
                        flash('Account created! You can now log in.', 'success')
                        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/logout')
def logout():
    log_action('Logout', f'{session.get("email")} signed out')
    session.clear()
    flash('You have been signed out securely.', 'info')
    return redirect(url_for('login'))

# ── DASHBOARD ─────────────────────────────────────────────────────────────────
@app.route('/dashboard')
@login_required
def dashboard():
    r = session.get('role')
    if r == 'admin': return redirect(url_for('admin_dashboard'))
    if r == 'staff': return redirect(url_for('staff_dashboard'))
    return redirect(url_for('client_dashboard'))

# ADMIN
@app.route('/dashboard/admin')
@role_required('admin')
def admin_dashboard():
    with get_db() as db:
        users     = db.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
        incidents = db.execute("SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10").fetchall()
        alerts    = db.execute("SELECT * FROM alerts WHERE is_read=0 ORDER BY created_at DESC LIMIT 8").fetchall()
        logs      = db.execute("""
            SELECT l.*, u.name as user_name
            FROM logs l LEFT JOIN users u ON l.user_id=u.id
            ORDER BY l.created_at DESC LIMIT 20""").fetchall()
        all_tickets = db.execute("""
            SELECT t.*, u.name as creator_name
            FROM tickets t LEFT JOIN users u ON t.created_by=u.id
            ORDER BY t.created_at DESC LIMIT 20""").fetchall()
        stats = {
            'total_users':      db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
            'active_incidents': db.execute("SELECT COUNT(*) FROM incidents WHERE status!='resolved'").fetchone()[0],
            'unread_alerts':    db.execute("SELECT COUNT(*) FROM alerts WHERE is_read=0").fetchone()[0],
            'open_tickets':     db.execute("SELECT COUNT(*) FROM tickets WHERE status='open'").fetchone()[0],
        }
        sev_data = {r[0]: r[1] for r in db.execute("SELECT severity,COUNT(*) FROM incidents GROUP BY severity").fetchall()}
        tkt_data = {r[0]: r[1] for r in db.execute("SELECT status,COUNT(*) FROM tickets GROUP BY status").fetchall()}
    return render_template('admin.html', users=users, incidents=incidents,
                           alerts=alerts, logs=logs, all_tickets=all_tickets,
                           stats=stats, sev_data=sev_data, tkt_data=tkt_data)

@app.route('/admin/users/create', methods=['POST'])
@role_required('admin')
def admin_create_user():
    name  = request.form.get('name','').strip()
    email = request.form.get('email','').strip().lower()
    role  = request.form.get('role','client')
    pw    = request.form.get('password','').strip()
    if not name or not email or not pw:
        flash('All fields required to create a user.', 'danger')
    elif role not in ('admin','staff','client'):
        flash('Invalid role.', 'danger')
    else:
        err = validate_password(pw)
        if err:
            flash(err, 'danger')
        else:
            with get_db() as db:
                if db.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
                    flash('Email already exists.', 'warning')
                else:
                    db.execute("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
                               (name, email, hash_password(pw), role))
                    db.commit()
                    log_action('Admin Create User', f'Created {role}: {email}')
                    flash(f'User {name} created successfully.', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/users/<int:uid>/status', methods=['POST'])
@role_required('admin')
def update_user_status(uid):
    if uid == session['user_id']:
        flash("You cannot change your own status.", 'warning')
        return redirect(url_for('admin_dashboard'))
    new_status = request.form.get('status')
    if new_status in ('active','suspended'):
        with get_db() as db:
            row = db.execute("SELECT name FROM users WHERE id=?", (uid,)).fetchone()
            db.execute("UPDATE users SET status=? WHERE id=?", (new_status, uid))
            db.commit()
        if row:
            log_action('User Status', f'{row["name"]} set to {new_status}')
            flash(f'{row["name"]} set to {new_status}.', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/users/<int:uid>/delete', methods=['POST'])
@role_required('admin')
def delete_user(uid):
    if uid == session['user_id']:
        flash("You cannot delete your own account.", 'warning')
        return redirect(url_for('admin_dashboard'))
    with get_db() as db:
        row = db.execute("SELECT name,email FROM users WHERE id=?", (uid,)).fetchone()
        if row:
            db.execute("DELETE FROM users WHERE id=?", (uid,))
            db.commit()
            log_action('Delete User', f'Deleted: {row["email"]}')
            flash(f'User {row["name"]} deleted.', 'success')
    return redirect(url_for('admin_dashboard'))

# STAFF
@app.route('/dashboard/staff')
@role_required('admin','staff')
def staff_dashboard():
    with get_db() as db:
        incidents = db.execute("SELECT * FROM incidents ORDER BY created_at DESC").fetchall()
        tickets   = db.execute("""
            SELECT t.*, u.name as creator_name
            FROM tickets t LEFT JOIN users u ON t.created_by=u.id
            ORDER BY t.created_at DESC""").fetchall()
        alerts = db.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10").fetchall()
        stats = {
            'open_incidents': db.execute("SELECT COUNT(*) FROM incidents WHERE status='open'").fetchone()[0],
            'investigating':  db.execute("SELECT COUNT(*) FROM incidents WHERE status='investigating'").fetchone()[0],
            'open_tickets':   db.execute("SELECT COUNT(*) FROM tickets WHERE status='open'").fetchone()[0],
            'alerts_today':   db.execute("SELECT COUNT(*) FROM alerts WHERE date(created_at)=date('now')").fetchone()[0],
        }
    return render_template('staff.html', incidents=incidents, tickets=tickets,
                           alerts=alerts, stats=stats)

@app.route('/staff/incidents', methods=['POST'])
@role_required('admin','staff')
def create_incident():
    title       = request.form.get('title','').strip()
    description = request.form.get('description','').strip()
    severity    = request.form.get('severity','medium')
    if not title:
        flash('Incident title is required.', 'danger')
    elif severity not in ('low','medium','high','critical'):
        flash('Invalid severity.', 'danger')
    else:
        with get_db() as db:
            db.execute("INSERT INTO incidents(title,description,severity,created_by) VALUES(?,?,?,?)",
                       (title, description, severity, session['user_id']))
            db.commit()
        log_action('Create Incident', title)
        flash('Incident logged successfully.', 'success')
    return redirect(url_for('staff_dashboard'))

@app.route('/staff/incidents/<int:iid>/status', methods=['POST'])
@role_required('admin','staff')
def update_incident_status(iid):
    new_status = request.form.get('status')
    if new_status not in ('open','investigating','resolved'):
        flash('Invalid status.', 'danger')
    else:
        with get_db() as db:
            db.execute("UPDATE incidents SET status=?,updated_at=? WHERE id=?",
                       (new_status, datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'), iid))
            db.commit()
        log_action('Update Incident', f'#{iid} to {new_status}')
        flash(f'Incident #{iid} updated to {new_status}.', 'success')
    return redirect(url_for('staff_dashboard'))

@app.route('/staff/tickets/<int:tid>/status', methods=['POST'])
@role_required('admin','staff')
def update_ticket_status(tid):
    new_status = request.form.get('status')
    if new_status not in ('open','in_progress','closed'):
        flash('Invalid ticket status.', 'danger')
    else:
        with get_db() as db:
            db.execute("UPDATE tickets SET status=?,updated_at=?,assigned_to=? WHERE id=?",
                       (new_status, datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                        session['user_id'], tid))
            db.commit()
        log_action('Update Ticket', f'#{tid} to {new_status}')
        flash(f'Ticket #{tid} updated to {new_status}.', 'success')
    return redirect(url_for('staff_dashboard'))

# CLIENT
@app.route('/dashboard/client')
@role_required('admin','staff','client')
def client_dashboard():
    uid = session['user_id']
    with get_db() as db:
        tickets  = db.execute("SELECT * FROM tickets WHERE created_by=? ORDER BY created_at DESC", (uid,)).fetchall()
        services = db.execute("SELECT * FROM services WHERE status='active'").fetchall()
        alerts   = db.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5").fetchall()
    return render_template('client.html', tickets=tickets, services=services, alerts=alerts)

@app.route('/client/tickets', methods=['POST'])
@login_required
def create_ticket():
    subject     = request.form.get('subject','').strip()
    description = request.form.get('description','').strip()
    priority    = request.form.get('priority','medium')
    if not subject or not description:
        flash('Subject and description are required.', 'danger')
    elif priority not in ('low','medium','high'):
        flash('Invalid priority.', 'danger')
    else:
        with get_db() as db:
            db.execute("INSERT INTO tickets(subject,description,priority,created_by) VALUES(?,?,?,?)",
                       (subject, description, priority, session['user_id']))
            db.commit()
        log_action('Create Ticket', subject)
        flash('Support ticket submitted! Our team will respond shortly.', 'success')
    return redirect(url_for('client_dashboard'))

# PROFILE
@app.route('/profile', methods=['GET','POST'])
@login_required
def profile():
    uid = session['user_id']
    if request.method == 'POST':
        action = request.form.get('action','')
        if action == 'update_info':
            name  = request.form.get('name','').strip()
            phone = request.form.get('phone','').strip()
            dept  = request.form.get('department','').strip()
            if not name:
                flash('Name is required.', 'danger')
            else:
                with get_db() as db:
                    db.execute("UPDATE users SET name=?,phone=?,department=? WHERE id=?",
                               (name, phone, dept, uid))
                    db.commit()
                session['name'] = name
                log_action('Profile Update', 'Info updated')
                flash('Profile updated successfully.', 'success')
        elif action == 'change_password':
            current = request.form.get('current_password','')
            new_pw  = request.form.get('new_password','')
            confirm = request.form.get('confirm_new','')
            with get_db() as db:
                user = db.execute("SELECT password_hash FROM users WHERE id=?", (uid,)).fetchone()
            if not check_password(current, user['password_hash']):
                flash('Current password is incorrect.', 'danger')
            elif new_pw != confirm:
                flash('New passwords do not match.', 'danger')
            else:
                err = validate_password(new_pw)
                if err:
                    flash(err, 'danger')
                else:
                    with get_db() as db:
                        db.execute("UPDATE users SET password_hash=? WHERE id=?",
                                   (hash_password(new_pw), uid))
                        db.commit()
                    log_action('Password Change', 'Password updated')
                    flash('Password changed successfully.', 'success')
        return redirect(url_for('profile'))

    with get_db() as db:
        user    = db.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        my_logs = db.execute(
            "SELECT * FROM logs WHERE user_id=? ORDER BY created_at DESC LIMIT 10",
            (uid,)).fetchall()
    return render_template('profile.html', user=user, my_logs=my_logs)

# API
@app.route('/api/alerts/<int:aid>/read', methods=['POST'])
@login_required
def mark_alert_read(aid):
    with get_db() as db:
        db.execute("UPDATE alerts SET is_read=1 WHERE id=?", (aid,))
        db.commit()
    return jsonify(success=True)

@app.route('/api/stats')
@role_required('admin')
def api_stats():
    with get_db() as db:
        return jsonify(
            users     = db.execute("SELECT COUNT(*) FROM users").fetchone()[0],
            incidents = db.execute("SELECT COUNT(*) FROM incidents").fetchone()[0],
            alerts    = db.execute("SELECT COUNT(*) FROM alerts").fetchone()[0],
            tickets   = db.execute("SELECT COUNT(*) FROM tickets").fetchone()[0],
        )

# ERROR HANDLERS
@app.errorhandler(404)
def not_found(e):
    return render_template('error.html', code=404, message='Page not found.'), 404

@app.errorhandler(403)
def forbidden(e):
    return render_template('error.html', code=403, message='Access forbidden.'), 403

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', code=500, message='Internal server error.'), 500

# STARTUP
init_db()
seed_db()

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
