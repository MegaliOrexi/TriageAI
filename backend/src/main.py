import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import math
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["*"])  # Allow all origins for development, restrict in production

# Import routes
from src.routes.patients import patients_bp
from src.routes.staff import staff_bp
from src.routes.resources import resources_bp
from src.routes.triage import triage_bp

# Register blueprints
app.register_blueprint(patients_bp, url_prefix='/api/patients')
app.register_blueprint(staff_bp, url_prefix='/api/staff')
app.register_blueprint(resources_bp, url_prefix='/api/resources')
app.register_blueprint(triage_bp, url_prefix='/api/triage')

@app.route('/')
def index():
    return jsonify({
        "name": "TriageAI API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

# Supabase connection helper
def get_supabase_url():
    return os.environ.get('SUPABASE_URL', 'https://my-custom.supabase.co')

def get_supabase_key():
    return os.environ.get('SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_KEY')

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    # Run the app, binding to all network interfaces (0.0.0.0)
    app.run(host='0.0.0.0', port=port, debug=False)
