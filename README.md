# KIBE-CYBER-SHIELD-TECHNOLOGY-LIMITTED-COMPANY
Kibe CyberShield Technology is a cybersecurity and AI security platform providing real-time threat detection, incident response, and network protection. It offers secure role-based access (Admin, Staff, Client) with centralized monitoring, user management, and dashboards to ensure safe, reliable, and compliant system security.


# 🛡️ Kibe CyberShield Technology

## Enterprise Cybersecurity & AI Security Operations Platform

---

## 📌 PROJECT DESCRIPTION

Kibe CyberShield Technology is a full-stack enterprise cybersecurity platform designed to simulate a real-world Security Operations Center (SOC).

It provides:
- Cybersecurity monitoring dashboard
- Threat detection and alerts system
- Incident response management
- Role-based access control system
- Secure authentication system
- Admin, Staff, and Client dashboards
- Full backend + frontend integration

This system is designed as a production-style security platform for learning, deployment, and expansion into real cybersecurity operations.

---

## 🏢 COMPANY DETAILS

- **Company Name:** Kibe CyberShield Technology
- **Industry:** Cybersecurity & Artificial Intelligence Security Systems
- **Location:** Nakuru, Kenya
- **Owner:** Aggrey Kibe Kwamboka
- **Contact Email:** aggreykwamboka62@protonmail.com
- **Phone:** +254 714 134 241

---

## ⚙️ SYSTEM ARCHITECTURE

### Frontend
- HTML5
- CSS3 (Custom Cybersecurity UI Design)
- JavaScript (Vanilla JS)

### Backend
- Python (Flask framework)
- REST API structure

### Database
- SQLite (local development)
- Structured relational design

---

## 🧠 CORE FEATURES

### 🔐 Authentication System
- User Registration
- Secure Login / Logout
- Password hashing (bcrypt)
- Session management
- Access control protection

---

### 👥 ROLE-BASED SYSTEM

#### ADMIN
- Full system control
- User management
- View logs & incidents
- System monitoring
- Security oversight

#### STAFF
- Manage incidents
- Handle support tickets
- Monitor alerts
- Operational tasks

#### CLIENT
- View services
- Submit support requests
- View alerts & updates
- Profile management

---

### 📊 DASHBOARD SYSTEM

- Security overview panel
- Threat alerts monitoring
- System health metrics
- Incident tracking
- Activity logs
- Quick action controls

---

### 🛡️ SECURITY FEATURES

- Password hashing (bcrypt)
- Protected routes
- Session timeout system
- Input validation
- XSS & injection protection
- Role-based access restriction

---

## 📁 PROJECT STRUCTURE


Kibe-CyberShield/
│
├── app.py
├── config.py
├── requirements.txt
├── database.db
│
├── templates/
│ ├── index.html
│ ├── login.html
│ ├── register.html
│ ├── dashboard.html
│ ├── admin.html
│ ├── staff.html
│ ├── client.html
│ ├── services.html
│ ├── contact.html
│ └── about.html
│
├── static/
│ ├── css/
│ │ ├── style.css
│ │ ├── dashboard.css
│ │ └── responsive.css
│ │
│ ├── js/
│ │ ├── main.js
│ │ ├── auth.js
│ │ └── dashboard.js
│ │
│ └── images/
│
└── README.md


---

## 🚀 INSTALLATION GUIDE

### 1. Clone Repository
```bash
git clone https://github.com/your-username/kibe-cybershield.git
cd kibe-cybershield
2. Create Virtual Environment
python -m venv venv

Activate:

venv\Scripts\activate   # Windows
3. Install Dependencies
pip install -r requirements.txt

If missing:

pip install flask flask-login flask-sqlalchemy bcrypt flask-cors python-dotenv
4. Run System
python app.py

Open:

http://127.0.0.1:5000
🗄️ DATABASE STRUCTURE
USERS TABLE
id
name
email
password_hash
role
status
created_at
last_login
SYSTEM TABLES
users
roles
incidents
alerts
tickets
logs
services
🎨 UI DESIGN SYSTEM
Theme Style
Cybersecurity SOC interface
Dark professional UI
Modern enterprise dashboard design
Color Palette
Background: #0B132B
Panels: #1F2937
Accent: #00C2FF
Success: #22C55E
Warning: #F59E0B
Danger: #EF4444
📱 RESPONSIVE SUPPORT
Desktop
Laptop
Tablet
Mobile
🔗 NAVIGATION SYSTEM
Navbar (global)
Sidebar (role-based)
Footer (global)
Fully linked routing system
⚡ FUNCTIONALITY CHECKLIST
 Login system working
 Registration system working
 Database integration
 Role-based dashboards
 Navigation links working
 CSS applied globally
 JavaScript functional
 Backend connected
 Security system active
🔮 FUTURE DEVELOPMENT
AI-powered threat detection
Mobile Android application version
Real-time notifications system
Cloud deployment (AWS / Azure)
Advanced SIEM integration
👨‍💻 DEVELOPER

Aggrey Kibe Kwamboka
Founder – Kibe CyberShield Technology
Nakuru, Kenya

Email: aggreykwamboka62@protonmail.com

📜 LICENSE

This project is for educational, development, and enterprise simulation purposes.
All rights reserved © 2026 Kibe CyberShield Technology.
