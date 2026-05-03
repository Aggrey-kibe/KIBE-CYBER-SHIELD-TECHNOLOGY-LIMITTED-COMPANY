# Kibe CyberShield Platform
### Enterprise Cybersecurity & AI Security Operations Platform

**Company:** Kibe CyberShield Technologies Ltd  
**Owner:** Aggrey Kibe Kwamboka  
**Location:** Nakuru, Kenya  
**Email:** aggreykwamboka62@gmail.com  
**Phone:** +254 714 134 241  

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start development server
python app.py

# 3. Open browser
http://localhost:5000
```

**Demo login credentials:**

| Role   | Email                      | Password    |
|--------|---------------------------|-------------|
| Admin  | admin@kibecyber.com       | Admin@123   |
| Staff  | staff@kibecyber.com       | Staff@123   |
| Client | client@kibecyber.com      | Client@123  |

---

## Project Structure

```
kibe_cybershield_full/
├── app.py                    # Flask application (1,100+ lines)
├── health_monitor.py         # System health check script
├── requirements.txt          # Python dependencies
├── run.sh                    # Startup script (dev + prod)
├── Procfile                  # Heroku/Railway deployment
├── .env.example              # Environment configuration template
├── README.md                 # This file
│
├── database/
│   └── db.sqlite3            # SQLite database (auto-created)
│
├── templates/                # Jinja2 HTML templates (15 files)
│   ├── index.html            # Landing page
│   ├── login.html            # Login form
│   ├── register.html         # Registration form
│   ├── forgot_password.html  # Password reset request
│   ├── reset_password.html   # Password reset form
│   ├── dashboard.html        # Role-based redirect
│   ├── admin.html            # Admin control panel
│   ├── staff.html            # Staff operations portal
│   ├── client.html           # Client portal
│   ├── about.html            # Company information
│   ├── services.html         # Services & pricing
│   ├── contact.html          # Contact form
│   └── 403.html / 404.html / 500.html
│
├── static/
│   ├── css/
│   │   ├── style.css         # Global styles & design tokens
│   │   ├── dashboard.css     # Dashboard layout & components
│   │   ├── forms.css         # Auth forms
│   │   └── responsive.css    # Mobile responsive
│   │
│   └── js/
│       ├── auth.js           # Form validation & API calls (v4)
│       ├── navigation.js     # SPA navigation, sidebar, session
│       ├── main.js           # UI utilities, counters, upload
│       ├── dashboard.js      # Dashboard helpers
│       ├── notifications.js  # Notification rendering
│       └── security.js       # Alerts & audit log rendering
```

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | PBKDF2-SHA256 (Werkzeug) |
| CSRF protection | Server tokens on all POST forms + `X-CSRFToken` header |
| Brute force protection | 5 failed attempts → 15-min IP lockout |
| Session timeout | 30-minute inactivity |
| Role-based access | `@role_required()` decorator on all protected routes |
| SQL injection | Parameterised queries only |
| XSS | Jinja2 auto-escaping enabled |
| HttpOnly cookies | `SESSION_COOKIE_HTTPONLY = True` |
| SameSite cookies | `SESSION_COOKIE_SAMESITE = 'Lax'` |
| Audit logging | All auth + data events logged to `logs` table |
| Password reset | Secure 48-byte URL-safe token, 1-hour expiry, single-use |
| File upload | Extension allowlist (PDF, PNG, JPG, ZIP, LOG, TXT, CSV, DOCX) |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/login` | Login page / authenticate |
| GET/POST | `/register` | Registration page / create account |
| GET | `/logout` | Sign out |
| GET/POST | `/forgot-password` | Request password reset |
| GET/POST | `/reset-password/<token>` | Reset password via token |

### Dashboards
| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/admin` | Admin only |
| GET | `/staff` | Admin + Staff |
| GET | `/client` | All authenticated |
| GET | `/dashboard` | Role-based redirect |

### JSON API (requires login + CSRF header)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/csrf-token` | All | Get fresh CSRF token |
| GET | `/api/session-check` | All | Check session status |
| GET | `/api/stats` | All | Dashboard statistics |
| GET/POST | `/api/incidents` | All | List / create incidents |
| GET/POST | `/api/tickets` | All | List / create tickets |
| GET/POST | `/api/services` | All | List / request services |
| GET | `/api/alerts` | All | Security alerts |
| GET | `/api/logs` | Admin+Staff | Audit logs |
| POST | `/api/profile` | All | Update profile |
| POST | `/api/change-password` | All | Change password |
| POST | `/api/upload` | All | Upload files |
| GET/POST | `/api/users` | Admin | List / create users |
| POST | `/api/users/<id>/status` | Admin | Suspend / activate |
| POST | `/api/users/<id>/reset-password` | Admin | Reset password |
| POST | `/api/incidents/<id>/status` | Admin+Staff | Update status |
| POST | `/api/tickets/<id>/status` | Admin+Staff | Update status |
| DELETE | `/api/users/<id>` | Admin | Suspend user |

---

## Production Deployment

### Option 1: Simple VPS

```bash
# Copy .env.example to .env and configure
cp .env.example .env
nano .env

# Install with gunicorn
pip install -r requirements.txt

# Start production server
bash run.sh prod
# OR: gunicorn --workers 4 --bind 0.0.0.0:5000 app:app
```

### Option 2: Heroku / Railway

```bash
# Deploy with Procfile (already included)
git init && git add . && git commit -m "Initial deploy"
heroku create kibe-cybershield
heroku config:set KCS_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
git push heroku main
```

### Important: Enable HTTPS in Production

In `app.py`, uncomment:
```python
# SESSION_COOKIE_SECURE = True   # Uncomment when running on HTTPS
```

### Email Configuration (Password Reset)

Set these environment variables:
```
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## Database Schema

| Table | Key Columns |
|-------|-------------|
| users | id, name, email, password_hash, role, org, phone, status |
| roles | id, name, description, permissions |
| tickets | id, user_id, subject, priority, status |
| incidents | id, reported_by, title, severity, status, affected_sys |
| alerts | id, alert_id, severity, title, source, status |
| services | id, user_id, service, plan, priority, status |
| logs | id, user_id, user_email, action, detail, ip_address |
| password_resets | id, user_id, token, used, expires_at |

---

## System Health Check

Run at any time to verify the system:

```bash
python health_monitor.py
```

Expected output: `99/99 passed | 0 failed`

---

*Kibe CyberShield Technologies Ltd — Securing Africa's Digital Economy*  
*© 2026 All Rights Reserved | Nakuru, Kenya*
