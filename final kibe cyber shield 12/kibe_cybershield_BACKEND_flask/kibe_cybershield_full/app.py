from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
import bcrypt
from datetime import datetime

app = Flask(__name__)
app.secret_key = "supersecretkey"

# DATABASE
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# USER MODEL
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(200))
    role = db.Column(db.String(20), default="client")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# CREATE DATABASE
with app.app_context():
    db.create_all()

# =============================
# REGISTER
# =============================
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']

        # CHECK IF USER EXISTS
        existing = User.query.filter_by(email=email).first()
        if existing:
            flash("Email already exists", "danger")
            return redirect(url_for('register'))

        # HASH PASSWORD
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        new_user = User(
            name=name,
            email=email,
            password=hashed.decode('utf-8')
        )

        db.session.add(new_user)
        db.session.commit()

        flash("Registered successfully. Please login.", "success")
        return redirect(url_for('login'))

    return render_template('register.html')


# =============================
# LOGIN
# =============================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()

        if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            session['user_id'] = user.id
            session['role'] = user.role

            return redirect(url_for('dashboard'))

        flash("Invalid credentials", "danger")

    return render_template('login.html')


# =============================
# DASHBOARD (PROTECTED)
# =============================
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    return render_template('dashboard.html')


# =============================
# LOGOUT
# =============================
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


# =============================
# RUN
# =============================
if __name__ == '__main__':
    app.run(debug=True)
