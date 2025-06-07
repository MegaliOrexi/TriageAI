import os
import requests
import json
import joblib
import pandas as pd
from flask import Blueprint, jsonify, request, make_response
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import insert
from flask_sqlalchemy import SQLAlchemy
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

@patients_bp.route('/', methods=['POST'])
def add_patient():
    try:
        data = request.json
        
        # Calculate Shock Index
        data['Shock_Index'] = data['Pulse_Rate'] / data['Systolic_BP']
        
        # Calculate NEWS2 score
        def calculate_NEWS2(data):
            score = 0
            
            # Respiratory Rate
            resp_rate = data['Respiratory_Rate']
            if resp_rate <= 8: score += 3
            elif 9 <= resp_rate <= 11: score += 1
            elif 21 <= resp_rate <= 24: score += 2
            elif resp_rate >= 25: score += 3
            
            # SPO2 (assuming room air)
            spo2 = data['SPO2']
            if spo2 <= 92: score += 3
            elif 93 <= spo2 <= 94: score += 2
            elif 95 <= spo2 <= 96: score += 1
            
            # Systolic BP
            sys_bp = data['Systolic_BP']
            if sys_bp <= 90: score += 3
            elif 91 <= sys_bp <= 100: score += 2
            elif 101 <= sys_bp <= 110: score += 1
            elif sys_bp >= 220: score += 3
            
            # Pulse
            pulse = data['Pulse_Rate']
            if pulse <= 40: score += 3
            elif 41 <= pulse <= 50: score += 1
            elif 91 <= pulse <= 110: score += 1
            elif 111 <= pulse <= 130: score += 2
            elif pulse >= 131: score += 3
            
            # Temperature
            temp = data['Temperature']
            if temp <= 35.0: score += 3
            elif 35.1 <= temp <= 36.0: score += 1
            elif 38.1 <= temp <= 39.0: score += 1
            elif temp >= 39.1: score += 2
            
            # AVPU
            if data['AVPU'] != 'Alert': score += 3
            
            return score
        
        # Add NEWS2 score to data
        data['NEWS2'] = calculate_NEWS2(data)
        
        # Make prediction using the model
        df = pd.DataFrame([data])
        prediction = triage_model.predict(df)
        risk_level = int(prediction[0])
        
        # Add prediction results to data
        data['risk_level'] = risk_level
        data['status'] = 'waiting'
        data['arrival_time'] = datetime.now().isoformat()
        
        data['avpu'] = data.pop('AVPU', None)

        # Insert into database with calculated scores and prediction
        result = supabase_request('POST', '/rest/v1/patients', data=data)
        
        return jsonify({
            'message': 'Patient added successfully',
            'id': result[0]['id'],
            'risk_level': risk_level,
            'risk_level_text': ["Low", "Medium", "High"][risk_level],
            'shock_index': data['Shock_Index'],
            'news2_score': data['NEWS2']
        }), 201
        
    except Exception as e:
        print(f"Error adding patient: {str(e)}")  # Add debug logging
        return jsonify({'error': str(e)}), 500

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
