from flask import Flask, request, jsonify
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

# Route to view saved messages (Admin Panel Light)
@app.route('/messages', methods=['GET'])
def get_messages():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row # Access columns by name
        c = conn.cursor()
        c.execute("SELECT * FROM messages ORDER BY timestamp DESC")
        rows = c.fetchall()
        conn.close()
        
        messages = [dict(row) for row in rows]
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    print("Server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
