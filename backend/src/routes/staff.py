import os
import requests
import json
from flask import Blueprint, jsonify, request
from datetime import datetime

staff_bp = Blueprint('staff', __name__)

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

@staff_bp.route('/', methods=['GET'])
def get_staff():
    """Get all staff members"""
    try:
        # Get query parameters
        status = request.args.get('status')
        specialty = request.args.get('specialty')
        
        # Build query parameters
        params = {}
        if status:
            params['status'] = f'eq.{status}'
        if specialty:
            params['specialty'] = f'eq.{specialty}'
        
        # Make request to Supabase
        result = supabase_request('GET', '/rest/v1/staff', params=params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@staff_bp.route('/<staff_id>', methods=['GET'])
def get_staff_member(staff_id):
    """Get a specific staff member by ID"""
    try:
        # Make request to Supabase
        params = {'id': f'eq.{staff_id}'}
        result = supabase_request('GET', '/rest/v1/staff', params=params)
        
        if not result:
            return jsonify({"error": "Staff member not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@staff_bp.route('/', methods=['POST'])
def create_staff():
    """Create a new staff member"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'role', 'specialty']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Set default values
        data.setdefault('status', 'available')
        
        # Make request to Supabase
        result = supabase_request('POST', '/rest/v1/staff', data=data)
        
        return jsonify(result[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@staff_bp.route('/<staff_id>', methods=['PUT'])
def update_staff(staff_id):
    """Update a staff member"""
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
        params = {'id': f'eq.{staff_id}'}
        result = supabase_request('PUT', '/rest/v1/staff', data=data, params=params)
        
        if not result:
            return jsonify({"error": "Staff member not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@staff_bp.route('/<staff_id>/availability', methods=['PUT'])
def update_staff_availability(staff_id):
    """Update a staff member's availability"""
    try:
        data = request.json
        if 'status' not in data:
            return jsonify({"error": "Missing status field"}), 400
        
        # Validate status
        valid_statuses = ['available', 'busy', 'off_duty']
        if data['status'] not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        
        # Update status and timestamp
        update_data = {
            'status': data['status'],
            'updated_at': datetime.now().isoformat()
        }
        
        # If status is changing to busy, we might want to record which patient they're attending
        if data['status'] == 'busy' and 'current_patient_id' in data:
            update_data['current_patient_id'] = data['current_patient_id']
        
        # If status is changing to available, clear current patient
        if data['status'] == 'available':
            update_data['current_patient_id'] = None
        
        # Make request to Supabase
        params = {'id': f'eq.{staff_id}'}
        result = supabase_request('PUT', '/rest/v1/staff', data=update_data, params=params)
        
        if not result:
            return jsonify({"error": "Staff member not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@staff_bp.route('/<staff_id>', methods=['DELETE'])
def delete_staff(staff_id):
    """Delete a staff member"""
    try:
        # Make request to Supabase
        params = {'id': f'eq.{staff_id}'}
        supabase_request('DELETE', '/rest/v1/staff', params=params)
        
        return jsonify({"message": "Staff member deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
