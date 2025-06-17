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
from ..models.triage_model import triage_model  # Import the triage model


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
    elif method == 'PUT' or method == 'PATCH':
        # For updates, always use PATCH with the filter in the URL
        if params and 'id' in params:
            # Ensure the URL has the proper WHERE clause format
            patient_id = params['id'].split('eq.')[1]  # Extract the ID value
            update_url = f"{url}?id=eq.{patient_id}"
            response = requests.patch(update_url, headers=headers, json=data)
        else:
            raise ValueError("Update operations require an 'id' filter")
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
        
        # Normalize boolean fields to 1/0 if they come as True/False
        for bool_field in ['Ambulance_Arrival', 'Diabetes', 'Hypertension', 'COPD']:
            if bool_field in data:
                if isinstance(data[bool_field], bool):
                    data[bool_field] = 1 if data[bool_field] else 0

        # Accept and use all new fields, provide defaults if missing
        model_input = {
            'Systolic_BP': data.get('Systolic_BP'),
            'Diastolic_BP': data.get('Diastolic_BP'),
            'Pulse_Rate': data.get('Pulse_Rate'),
            'Respiratory_Rate': data.get('Respiratory_Rate'),
            'SPO2': data.get('SPO2'),
            'Temperature': data.get('Temperature'),
            'Age': data.get('Age', 0),
            'Lactate': data.get('Lactate'),
            'Ambulance_Arrival': data.get('Ambulance_Arrival', 0),
            'Diabetes': data.get('Diabetes', 0),
            'Hypertension': data.get('Hypertension', 0),
            'COPD': data.get('COPD', 0),
            'AVPU': data.get('AVPU', 'Alert'),
            'Chief_Complaint': data.get('Chief_Complaint', 'Other'),
            'Symptom_Duration': data.get('Symptom_Duration', '2-6h')
        }

        # Calculate Shock Index
        try:
            model_input['Shock_Index'] = float(model_input['Pulse_Rate']) / float(model_input['Systolic_BP'])
        except (ZeroDivisionError, ValueError, TypeError):
            return jsonify({
                "error": "Invalid values for Pulse_Rate or Systolic_BP"
            }), 400

        # Calculate NEWS2 score
        def calculate_NEWS2(data):
            score = 0
            
            try:
                # Respiratory Rate
                resp_rate = float(data['Respiratory_Rate'])
                if resp_rate <= 8: score += 3
                elif 9 <= resp_rate <= 11: score += 1
                elif 21 <= resp_rate <= 24: score += 2
                elif resp_rate >= 25: score += 3
                
                # SPO2 (assuming room air)
                spo2 = float(data['SPO2'])
                if spo2 <= 92: score += 3
                elif 93 <= spo2 <= 94: score += 2
                elif 95 <= spo2 <= 96: score += 1
                
                # Systolic BP
                sys_bp = float(data['Systolic_BP'])
                if sys_bp <= 90: score += 3
                elif 91 <= sys_bp <= 100: score += 2
                elif 101 <= sys_bp <= 110: score += 1
                elif sys_bp >= 220: score += 3
                
                # Pulse
                pulse = float(data['Pulse_Rate'])
                if pulse <= 40: score += 3
                elif 41 <= pulse <= 50: score += 1
                elif 91 <= pulse <= 110: score += 1
                elif 111 <= pulse <= 130: score += 2
                elif pulse >= 131: score += 3
                
                # Temperature
                temp = float(data['Temperature'])
                if temp <= 35.0: score += 3
                elif 35.1 <= temp <= 36.0: score += 1
                elif 38.1 <= temp <= 39.0: score += 1
                elif temp >= 39.1: score += 2
                
                # AVPU
                if data['AVPU'] != 'Alert': score += 3
                
                return score
            except (ValueError, KeyError, TypeError) as e:
                raise ValueError(f"Error calculating NEWS2 score: {str(e)}")
        
        # Add NEWS2 score to data
        try:
            model_input['NEWS2'] = calculate_NEWS2(model_input)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        # Make prediction using the model
        try:
            df = pd.DataFrame([model_input])
            prediction = triage_model.predict(df)
            risk_level = int(prediction[0])
            print(f"Risk level: {risk_level}")
        except Exception as e:
            return jsonify({
                "error": f"Error making triage prediction: {str(e)}"
            }), 400

        # Add prediction results to data
        data['risk_level'] = risk_level
        data['status'] = 'waiting'
        data['arrival_time'] = datetime.now().isoformat() + 'Z'
        data['avpu'] = data.pop('AVPU', None)
        data['shock_index'] = model_input['Shock_Index']
        data['news2'] = model_input['NEWS2']

        # Convert all keys to lowercase for Supabase/Postgres
        data = {k.lower(): v for k, v in data.items()}

        # Insert into database with calculated scores and prediction
        try:
            result = supabase_request('POST', '/rest/v1/patients', data=data)
            
            return jsonify({
                'message': 'Patient added successfully',
                'id': result[0]['id'],
                'risk_level': risk_level,
                'risk_level_text': ["Low", "Medium", "High"][risk_level],
                'shock_index': data['shock_index'],
                'news2_score': data['news2']
            }), 201
        except Exception as e:
            return jsonify({
                "error": f"Error saving to database: {str(e)}"
            }), 500
            
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
