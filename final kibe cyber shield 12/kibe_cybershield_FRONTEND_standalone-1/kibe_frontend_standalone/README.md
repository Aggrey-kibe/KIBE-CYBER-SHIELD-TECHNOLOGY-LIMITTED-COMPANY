# Kibe CyberShield Platform — Standalone Frontend

**Company:** Kibe CyberShield Technologies Ltd | Nakuru, Kenya  
**Owner:** Aggrey Kibe Kwamboka | aggreykwamboka62@gmail.com | +254 714 134 241

---

## Quick Start (No Server Required)

Open `index.html` directly in any modern browser:

```
kibe_frontend_standalone/
└── index.html   ← Open this file
```

Or serve locally:
```bash
# Python (any version)
python3 -m http.server 8080
# Then open: http://localhost:8080
```

---

## Demo Login Credentials

| Role   | Email                     | Password    |
|--------|--------------------------|-------------|
| 🔐 Admin  | admin@kibecyber.com       | Admin@123   |
| 🛡️ Staff  | staff@kibecyber.com       | Staff@123   |
| 👤 Client | client@kibecyber.com      | Client@123  |

---

## File Structure

```
kibe_frontend_standalone/
│
├── index.html              # Home / landing page
├── login.html              # Login (demo auth)
├── register.html           # User registration
├── dashboard.html          # Role-based router
├── admin.html              # Admin control panel
├── staff.html              # Staff operations portal
├── client.html             # Client portal
├── about.html              # Company information
├── services.html           # Services & pricing
├── contact.html            # Contact form
├── forgot_password.html    # Password reset request
├── reset_password.html     # Password reset form
├── 403.html                # Access denied
├── 404.html                # Page not found
├── 500.html                # Server error
│
├── css/
│   ├── style.css           # Global styles & design tokens
│   ├── dashboard.css       # Dashboard layouts & components
│   ├── forms.css           # Auth form styles
│   └── responsive.css      # Mobile-first responsive design
│
├── js/
│   ├── auth.js             # Login/register/session (sessionStorage)
│   ├── navigation.js       # SPA routing, sidebar, clock
│   ├── main.js             # Public page animations, terminal, UI
│   ├── dashboard.js        # Canvas charts (incident/ticket analytics)
│   ├── notifications.js    # Live notification panel
│   └── security.js         # Alerts & audit log rendering
│
└── assets/
    ├── icons/shield.svg
    └── images/kibe-logo.svg
```

---

## Authentication (Frontend-Only Mode)

This standalone version uses `sessionStorage` for authentication simulation.
Demo users are hardcoded in `js/auth.js` under `DEMO_USERS`.

**To connect to a real backend:**
1. Remove the `DEMO_USERS` array in `js/auth.js`
2. Replace the `setTimeout` simulation blocks with real `fetch()` calls:
   ```javascript
   // Replace this:
   setTimeout(function() { ... }, 800);
   
   // With this:
   fetch('/api/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password }),
   })
   .then(r => r.json())
   .then(d => { if (d.ok) Session.set(d.user); ... });
   ```

---

## Design System

| Token | Value |
|-------|-------|
| Primary background | `#0B132B` |
| Surface | `#1E293B` |
| Accent cyan | `#00C2FF` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Font (headings) | Syne |
| Font (mono) | IBM Plex Mono |
| Font (body) | Inter |

---

## Backend Integration

When you're ready to connect to the Flask backend (`kibe_cybershield_full/`):

1. Copy all HTML files to `kibe_cybershield_full/templates/`
2. Convert relative CSS/JS paths back to `url_for('static', ...)` format
3. Add Jinja2 `{% csrf_token %}` to all POST forms
4. Replace `sessionStorage` auth with Flask session-based auth

The full Flask backend is in the `kibe_cybershield_full.zip` package.

---

*Kibe CyberShield Technologies Ltd — Securing Africa's Digital Economy*
