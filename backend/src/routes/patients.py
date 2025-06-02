import os
import requests
import json
from flask import Blueprint, jsonify, request
from datetime import datetime

patients_bp = Blueprint('patients', __name__)

# Supabase connection details
def get_supabase_url():
    return os.environ.get('SUPABASE_URL', 'https://marmqmdyndgbwrnwugeq.supabase.co')

def get_supabase_key():
    return os.environ.get('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcm1xbWR5bmRnYndybnd1Z2VxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODg3MDI4MywiZXhwIjoyMDY0NDQ2MjgzfQ.RLjZ4GxQIH4-NRn6beVScIza4s8K-vYhW4wR-pOQfI8')

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
def create_patient():
    """Create a new patient"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'date_of_birth', 'chief_complaint', 'risk_level']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Set default values
        now = datetime.now().isoformat()
        data.setdefault('status', 'waiting')
        data.setdefault('arrival_time', now)
        
        # Make request to Supabase
        result = supabase_request('POST', '/rest/v1/patients', data=data)
        
        return jsonify(result[0]), 201
    except Exception as e:
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
