from flask import Flask, request, jsonify, render_template_string, session, redirect, url_for
from flask_cors import CORS
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- CONFIGURATION (UPDATE THESE!) ---
# To send real emails, you need an App Password if using Gmail with 2FA enabled.
# https://myaccount.google.com/apppasswords
EMAIL_ADDRESS = "harismithasn@gmail.com"  # The sender email
EMAIL_PASSWORD = "8970818680"  # The sender password or App Password
RECIPIENT_EMAIL = "harismithasn@gmail.com"  # Where you want to receive the messages

DB_NAME = "contact.db"

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print(f"Database initialized: {DB_NAME}")

# --- EMAIL SENDING LOGIC ---
def send_email(name, sender_email, message_body):
    try:
        if "YOUR_APP_PASSWORD" in EMAIL_PASSWORD:
            print("Email sending skipped: No password configured.")
            return False, "Email configuration missing."

        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f"New Portfolio Message from {name}"

        body = f"""
        New Message Received via Portfolio:
        
        Name: {name}
        Email: {sender_email}
        
        Message:
        {message_body}
        """
        msg.attach(MIMEText(body, 'plain'))

        # Connect to Gmail SMTP (or change to your provider)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_ADDRESS, RECIPIENT_EMAIL, text)
        server.quit()
        
        print(f"Email sent successfully to {RECIPIENT_EMAIL}")
        return True, "Email sent successfully"
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False, str(e)

# --- ROUTES ---
@app.route('/contact', methods=['POST'])
def contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    if not name or not email or not message:
        return jsonify({"success": False, "error": "Missing fields"}), 400

    # 1. Save to Database
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("INSERT INTO messages (name, email, message) VALUES (?, ?, ?)",
                  (name, email, message))
        conn.commit()
        conn.close()
        print(f"Message from {name} saved to database.")
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"success": False, "error": "Database error"}), 500

    # 2. Send Email
    email_sent, email_msg = send_email(name, email, message)

    return jsonify({
        "success": True, 
        "message": "Message received and saved.", 
        "email_status": email_msg
    }), 200

# --- ADMIN CONFIGURATION ---
ADMIN_PASSWORD = "admin123"
app.secret_key = "super_secret_key_for_session_management" # Required for sessions

# Route to view saved messages (Admin Panel)
@app.route('/messages', methods=['GET', 'POST'])
def get_messages():
    # Handle Login Logic
    if request.method == 'POST':
        password = request.form.get('password')
        if password == ADMIN_PASSWORD:
            from flask import session, redirect, url_for
            session['logged_in'] = True
            return redirect(url_for('get_messages'))
        else:
            return render_template_string(LOGIN_TEMPLATE, error="Invalid Password")

    # Handle View Logic
    from flask import session
    if not session.get('logged_in'):
         return render_template_string(LOGIN_TEMPLATE)

    # Fetch Messages
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM messages ORDER BY timestamp DESC")
        rows = c.fetchall()
        conn.close()
        
        messages = [dict(row) for row in rows]
        return render_template_string(MESSAGES_TEMPLATE, messages=messages)
    except Exception as e:
        return f"Error: {str(e)}", 500

@app.route('/logout')
def logout():
    from flask import session, redirect, url_for
    session.pop('logged_in', None)
    return redirect(url_for('get_messages'))

# --- HTML TEMPLATES ---
LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white; }
        .box { background: #1e293b; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); text-align: center; }
        input { padding: 10px; border-radius: 4px; border: 1px solid #334155; background: #0f172a; color: white; display: block; margin: 10px auto; width: 200px; }
        button { padding: 10px 20px; background: #22d3ee; border: none; border-radius: 4px; color: #0f172a; font-weight: bold; cursor: pointer; }
        button:hover { background: #06b6d4; }
        .error { color: #ff4444; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="box">
        <h2>Admin Access</h2>
        {% if error %}<p class="error">{{ error }}</p>{% endif %}
        <form method="post">
            <input type="password" name="password" placeholder="Enter Password" required>
            <button type="submit">Login</button>
        </form>
    </div>
</body>
</html>
"""

MESSAGES_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Message Inbox</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
        h1 { color: #22d3ee; text-align: center; }
        .container { max-width: 1000px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #334155; }
        th { background: #334155; color: #22d3ee; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; }
        tr:hover { background: #2d3748; }
        .timestamp { font-size: 0.85rem; color: #94a3b8; }
        .logout { display: block; width: fit-content; margin: 0 auto 2rem auto; color: #94a3b8; text-decoration: none; border: 1px solid #334155; padding: 5px 15px; border-radius: 20px; transition: all 0.3s; }
        .logout:hover { border-color: #ff4444; color: #ff4444; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Inbox</h1>
        <a href="/logout" class="logout">Logout</a>
        <table>
            <thead>
                <tr>
                    <th width="15%">Time</th>
                    <th width="15%">Name</th>
                    <th width="20%">Email</th>
                    <th>Message</th>
                </tr>
            </thead>
            <tbody>
                {% for msg in messages %}
                <tr>
                    <td class="timestamp">{{ msg.timestamp }}</td>
                    <td>{{ msg.name }}</td>
                    <td><a href="mailto:{{ msg.email }}" style="color: #67e8f9; text-decoration: none;">{{ msg.email }}</a></td>
                    <td>{{ msg.message }}</td>
                </tr>
                {% else %}
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem;">No messages yet.</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</body>
</html>
"""

if __name__ == '__main__':
    init_db()
    print("Server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
