import os
import requests
import json
from flask import Blueprint, jsonify, request
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

resources_bp = Blueprint('resources', __name__)

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

@resources_bp.route('/', methods=['GET'])
def get_resources():
    """Get all resources"""
    try:
        # Get query parameters
        status = request.args.get('status')
        type = request.args.get('type')
        
        # Build query parameters
        params = {}
        if status:
            params['status'] = f'eq.{status}'
        if type:
            params['type'] = f'eq.{type}'
        
        # Make request to Supabase
        result = supabase_request('GET', '/rest/v1/resources', params=params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resources_bp.route('/<resource_id>', methods=['GET'])
def get_resource(resource_id):
    """Get a specific resource by ID"""
    try:
        # Make request to Supabase
        params = {'id': f'eq.{resource_id}'}
        result = supabase_request('GET', '/rest/v1/resources', params=params)
        
        if not result:
            return jsonify({"error": "Resource not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resources_bp.route('/', methods=['POST'])
def create_resource():
    """Create a new resource"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'type']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Set default values
        data.setdefault('status', 'available')
        data.setdefault('capacity', 1)
        data.setdefault('available_capacity', data.get('capacity', 1))
        
        # Make request to Supabase
        result = supabase_request('POST', '/rest/v1/resources', data=data)
        
        return jsonify(result[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resources_bp.route('/<resource_id>', methods=['PUT'])
def update_resource(resource_id):
    """Update a resource"""
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
        params = {'id': f'eq.{resource_id}'}
        result = supabase_request('PUT', '/rest/v1/resources', data=data, params=params)
        
        if not result:
            return jsonify({"error": "Resource not found"}), 404
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resources_bp.route('/<resource_id>/status', methods=['PUT'])
def update_resource_status(resource_id):
    """Update a resource's status"""
    try:
        data = request.json
        if 'status' not in data:
            return jsonify({"error": "Missing status field"}), 400
        
        # Validate status
        valid_statuses = ['available', 'in_use', 'maintenance']
        if data['status'] not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        
        # First, get the current resource to check capacity
        params = {'id': f'eq.{resource_id}'}
        current_resource = supabase_request('GET', '/rest/v1/resources', params=params)
        
        if not current_resource:
            return jsonify({"error": "Resource not found"}), 404
        
        current_resource = current_resource[0]
        
        # Update status, timestamp, and capacity
        update_data = {
            'status': data['status'],
            'updated_at': datetime.now().isoformat()
        }
        
        # Update available capacity based on status change
        if current_resource['status'] == 'available' and data['status'] == 'in_use':
            update_data['available_capacity'] = max(0, current_resource['available_capacity'] - 1)
        elif current_resource['status'] == 'in_use' and data['status'] == 'available':
            update_data['available_capacity'] = min(current_resource['capacity'], current_resource['available_capacity'] + 1)
        
        # If status is changing to in_use, we might want to record which patient is using it
        if data['status'] == 'in_use' and 'current_patient_id' in data:
            update_data['current_patient_id'] = data['current_patient_id']
        
        # If status is changing to available, clear current patient
        if data['status'] == 'available':
            update_data['current_patient_id'] = None
        
        # Make request to Supabase
        result = supabase_request('PUT', '/rest/v1/resources', data=update_data, params=params)
        
        return jsonify(result[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resources_bp.route('/<resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    """Delete a resource"""
    try:
        # Make request to Supabase
        params = {'id': f'eq.{resource_id}'}
        supabase_request('DELETE', '/rest/v1/resources', params=params)
        
        return jsonify({"message": "Resource deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
