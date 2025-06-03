import os
import requests
import json
import joblib
import pandas as pd
from flask import Blueprint, jsonify, request
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

patients_bp = Blueprint('patients', __name__)

# Load the triage model
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                         'er_triage_model_20250602_151451.joblib')
triage_model = joblib.load(MODEL_PATH)

# Supabase connection details
def get_supabase_url():
    return os.environ.get('SUPABASE_URL', 'https://my-custom.supabase.co')

def get_supabase_key():
    return os.environ.get('SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_KEY')

def supabase_request(method, path, data=None, params=None):
    """Helper function to make requests to Supabase REST API"""
    url = f"{get_supabase_url()}{path}"
    headers = {
        'apikey': get_supabase_key(),
        'Authorization': f'Bearer {get_supabase_key()}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    if method == 'GET':
        response = requests.get(url, headers=headers, params=params)
    elif method == 'POST':
        response = requests.post(url, headers=headers, json=data)
    elif method == 'PUT':
        response = requests.put(url, headers=headers, json=data)
    elif method == 'DELETE':
        response = requests.delete(url, headers=headers, params=params)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    if response.status_code >= 400:
        raise Exception(f"Supabase API error: {response.status_code} - {response.text}")
    
    return response.json()

@patients_bp.route('/', methods=['GET'])
def get_patients():
    """Get all patients"""
    try:
        # Get query parameters
        status = request.args.get('status')
        
        # Build query parameters
        params = {}
        if status:
            params['status'] = f'eq.{status}'
        
        # Make request to Supabase
        result = supabase_request('GET', '/rest/v1/patients', params=params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@patients_bp.route('/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Get a specific patient by ID"""
    try:
        # Make request to Supabase
        params = {'id': f'eq.{patient_id}'}
        result = supabase_request('GET', '/rest/v1/patients', params=params)
        
        if not result:
            return jsonify({"error": "Patient not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@patients_bp.route('/predict', methods=['POST'])
def predict_triage():
    """Predict patient triage level"""
    try:
        data = request.json
        
        # Required fields for the model
        required_fields = [
            'Systolic_BP', 'Diastolic_BP', 'Pulse_Rate', 'Respiratory_Rate',
            'SPO2', 'Temperature', 'Age', 'Lactate', 'Shock_Index', 'NEWS2',
            'Ambulance_Arrival', 'Diabetes', 'Hypertension', 'COPD',
            'AVPU', 'Chief_Complaint', 'Symptom_Duration'
        ]
        
        # Validate required fields
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Convert data to DataFrame for prediction
        df = pd.DataFrame([data])
        
        # Make prediction
        prediction = triage_model.predict(df)
        risk_level = int(prediction[0])  # Convert numpy int to Python int
        
        return jsonify({
            "prediction": risk_level,
            "risk_level": ["Low", "Medium", "High"][risk_level]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@patients_bp.route('/', methods=['POST'])
def create_patient():
    """Create a new patient with triage prediction"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'date_of_birth']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Get triage data from request
        triage_data = {
            'Systolic_BP': data.get('Systolic_BP'),
            'Diastolic_BP': data.get('Diastolic_BP'),
            'Pulse_Rate': data.get('Pulse_Rate'),
            'Respiratory_Rate': data.get('Respiratory_Rate'),
            'SPO2': data.get('SPO2'),
            'Temperature': data.get('Temperature'),
            'Age': data.get('Age'),
            'Lactate': data.get('Lactate'),
            'Shock_Index': data.get('Shock_Index'),
            'NEWS2': data.get('NEWS2'),
            'Ambulance_Arrival': data.get('Ambulance_Arrival'),
            'Diabetes': data.get('Diabetes'),
            'Hypertension': data.get('Hypertension'),
            'COPD': data.get('COPD'),
            'AVPU': data.get('AVPU'),
            'Chief_Complaint': data.get('Chief_Complaint'),
            'Symptom_Duration': data.get('Symptom_Duration')
        }
        
        # Validate triage data
        for field, value in triage_data.items():
            if value is None:
                return jsonify({"error": f"Missing triage field: {field}"}), 400
        
        # Make prediction using the model
        df = pd.DataFrame([triage_data])
        prediction = triage_model.predict(df)
        risk_level = int(prediction[0])
        
        # Prepare patient data for database
        patient_data = {
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'date_of_birth': data['date_of_birth'],
            'gender': data.get('gender'),
            'status': 'waiting',
            'arrival_time': datetime.now().isoformat(),
            'risk_level': risk_level,
            'chief_complaint': triage_data['Chief_Complaint'],
            'triage_data': triage_data  # Store all triage data as JSONB
        }
        
        # Make request to Supabase
        result = supabase_request('POST', '/rest/v1/patients', data=patient_data)
        
        return jsonify({
            **result[0],
            "risk_level_text": ["Low", "Medium", "High"][risk_level]
        }), 201
    except Exception as e:
        print("Error creating patient:", str(e))  # Add debug logging
        return jsonify({"error": str(e)}), 500

@patients_bp.route('/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Update a patient"""
    try:
        data = request.json
        
        # Protect certain fields
        if 'id' in data:
            del data['id']
        if 'created_at' in data:
            del data['created_at']
        
        # Update timestamp
        data['updated_at'] = datetime.now().isoformat()
        
        # Make request to Supabase
        params = {'id': f'eq.{patient_id}'}
        result = supabase_request('PUT', '/rest/v1/patients', data=data, params=params)
        
        if not result:
            return jsonify({"error": "Patient not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@patients_bp.route('/<patient_id>/status', methods=['PUT'])
def update_patient_status(patient_id):
    """Update a patient's status"""
    try:
        data = request.json
        if 'status' not in data:
            return jsonify({"error": "Missing status field"}), 400
        
        # Validate status
        valid_statuses = ['waiting', 'in_treatment', 'treated', 'discharged']
        if data['status'] not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        
        # Update status and timestamp
        update_data = {
            'status': data['status'],
            'updated_at': datetime.now().isoformat()
        }
        
        # If status is changing to in_treatment, record treatment start time
        if data['status'] == 'in_treatment':
            update_data['treatment_start_time'] = datetime.now().isoformat()
        
        # Make request to Supabase
        params = {'id': f'eq.{patient_id}'}
        result = supabase_request('PUT', '/rest/v1/patients', data=update_data, params=params)
        
        if not result:
            return jsonify({"error": "Patient not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@patients_bp.route('/<patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    """Delete a patient"""
    try:
        # Make request to Supabase
        params = {'id': f'eq.{patient_id}'}
        supabase_request('DELETE', '/rest/v1/patients', params=params)
        
        return jsonify({"message": "Patient deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
