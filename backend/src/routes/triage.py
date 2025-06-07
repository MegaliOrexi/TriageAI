import os
import requests
import json
import math
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

triage_bp = Blueprint('triage', __name__)

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
    elif method == 'PATCH':
        response = requests.patch(url, headers=headers, json=data)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    if response.status_code >= 400:
        raise Exception(f"Supabase API error: {response.status_code} - {response.text}")
    
    return response.json()

# Default triage settings
DEFAULT_TRIAGE_SETTINGS = {
    "risk_level_weight": 0.5,
    "waiting_time_weight": 0.3,
    "resource_availability_weight": 0.1,
    "staff_availability_weight": 0.1,
    "waiting_time_exponent_base": 1.05,
    "waiting_time_constant": 30
}

class TriageFuzzyLogic:
    def __init__(self, settings=None):
        # Default settings
        self.settings = settings or DEFAULT_TRIAGE_SETTINGS
    
    def calculate_priority(self, patient_data):
        """Calculate patient priority score"""
        # Calculate component scores
        risk_level_score = self.calculate_risk_level_score(patient_data.get('risk_level', 1))
        waiting_time_score = self.calculate_waiting_time_score(patient_data.get('waiting_time_minutes', 0))
        resource_availability_score = self.calculate_resource_availability_score(
            patient_data.get('resource_availability', 75)
        )
        staff_availability_score = self.calculate_staff_availability_score(
            patient_data.get('staff_availability', 80)
        )
        
        # Apply weights to component scores
        weighted_risk_level_score = risk_level_score * self.settings['risk_level_weight']
        weighted_waiting_time_score = waiting_time_score * self.settings['waiting_time_weight']
        weighted_resource_availability_score = resource_availability_score * self.settings['resource_availability_weight']
        weighted_staff_availability_score = staff_availability_score * self.settings['staff_availability_weight']
        
        # Calculate final priority score (0-100)
        priority_score = (
            weighted_risk_level_score + 
            weighted_waiting_time_score + 
            weighted_resource_availability_score + 
            weighted_staff_availability_score
        )
        
        # Ensure score is within bounds and convert to integer
        priority_score = int(min(100, max(0, priority_score)))
        
        # Return priority score and component details
        return {
            "priority_score": priority_score,
            "components": {
                "risk_level": {
                    "value": patient_data.get('risk_level', 1),
                    "score": int(risk_level_score),
                    "weighted_score": int(weighted_risk_level_score)
                },
                "waiting_time": {
                    "value": patient_data.get('waiting_time_minutes', 0),
                    "score": int(waiting_time_score),
                    "weighted_score": int(weighted_waiting_time_score)
                },
                "resource_availability": {
                    "value": patient_data.get('resource_availability', 75),
                    "score": int(resource_availability_score),
                    "weighted_score": int(weighted_resource_availability_score)
                },
                "staff_availability": {
                    "value": patient_data.get('staff_availability', 80),
                    "score": int(staff_availability_score),
                    "weighted_score": int(weighted_staff_availability_score)
                }
            }
        }
    
    def calculate_risk_level_score(self, risk_level):
        """Calculate risk level score (0-100)"""
        # Map risk levels to scores (0-100)
        risk_level_map = {
            1: 33.33,  # Low
            2: 66.67,  # Medium
            3: 100     # High
        }
        return risk_level_map.get(risk_level, 0)
    
    def calculate_waiting_time_score(self, waiting_time_minutes):
        """Calculate waiting time score with exponential weighting (0-100)"""
        # Apply exponential weighting to waiting time
        exponential_factor = math.pow(
            self.settings['waiting_time_exponent_base'], 
            waiting_time_minutes / self.settings['waiting_time_constant']
        )
        
        # Calculate score (0-100)
        score = min(100, 100 * (1 - 1 / exponential_factor))
        
        return score
    
    def calculate_resource_availability_score(self, resource_availability):
        """Calculate resource availability score (0-100)"""
        # Higher availability = higher score
        return resource_availability
    
    def calculate_staff_availability_score(self, staff_availability):
        """Calculate staff availability score (0-100)"""
        # Higher availability = higher score
        return staff_availability

def get_triage_settings():
    """Get triage settings from database or use defaults"""
    try:
        # Try to get settings from Supabase
        params = {'key': 'eq.priority_calculation'}
        result = supabase_request('GET', '/rest/v1/system_settings', params=params)
        
        if result and len(result) > 0:
            return result[0]['value']
        
        return DEFAULT_TRIAGE_SETTINGS
    except Exception as e:
        print(f"Error fetching triage settings: {e}")
        return DEFAULT_TRIAGE_SETTINGS

@triage_bp.route('/queue', methods=['GET'])
def get_queue():
    """Get prioritized patient queue"""
    try:
        # Get all waiting patients
        params = {'status': 'eq.waiting'}
        patients = supabase_request('GET', '/rest/v1/patients', params=params)
        
        if not patients:
            return jsonify([])
        
        # Get triage settings
        settings = get_triage_settings()
        
        # Initialize fuzzy logic system
        fuzzy_logic = TriageFuzzyLogic(settings)
        
        # Calculate waiting time and priority for each patient
        now = datetime.utcnow()  # Use UTC time
        for patient in patients:
            # Calculate waiting time in minutes
            # Handle both ISO format with and without timezone
            arrival_time_str = patient['arrival_time']
            try:
                # Try parsing with timezone info
                arrival_time = datetime.fromisoformat(arrival_time_str)
                # Convert to UTC if it has timezone info
                if arrival_time.tzinfo is not None:
                    arrival_time = arrival_time.astimezone(None).replace(tzinfo=None)
            except ValueError:
                # If parsing fails, try removing timezone info
                arrival_time = datetime.fromisoformat(arrival_time_str.split('+')[0].split('Z')[0])
            
            waiting_time_minutes = int((now - arrival_time).total_seconds() / 60)  # Convert to integer minutes
            
            # Get resource and staff availability for this patient
            resource_availability = calculate_resource_availability(patient)
            staff_availability = calculate_staff_availability(patient)
            
            # Calculate priority score
            priority_result = fuzzy_logic.calculate_priority({
                'risk_level': patient['risk_level'],
                'waiting_time_minutes': waiting_time_minutes,
                'resource_availability': resource_availability,
                'staff_availability': staff_availability
            })
            
            # Update patient with priority score
            patient['priority_score'] = int(priority_result['priority_score'])  # Convert to integer
            patient['waiting_time_minutes'] = waiting_time_minutes
            
            # Update patient in database
            update_data = {
                'priority_score': int(priority_result['priority_score']),  # Convert to integer
                'last_priority_update': now.isoformat() + 'Z',  # Add UTC indicator
            }
            # Format the query parameters correctly for Supabase
            result = supabase_request('PATCH', f'/rest/v1/patients?id=eq.{patient["id"]}', data=update_data)
            
            # Log priority update
            log_data = {
                'patient_id': patient['id'],
                'previous_score': int(patient.get('priority_score', 0)),  # Convert to integer
                'new_score': int(priority_result['priority_score']),  # Convert to integer
                'waiting_time_minutes': waiting_time_minutes,
                'risk_level': patient['risk_level'],
                'resource_availability_factor': int(resource_availability),  # Convert to integer
                'staff_availability_factor': int(staff_availability),  # Convert to integer
                'reason': 'Regular queue update',
                'created_at': now.isoformat() + 'Z'  # Add UTC indicator
            }
            supabase_request('POST', '/rest/v1/priority_logs', data=log_data)
        
        # Sort by priority score (descending)
        sorted_queue = sorted(patients, key=lambda p: p.get('priority_score', 0), reverse=True)
        
        return jsonify(sorted_queue)
    except Exception as e:
        print(f"Queue Error: {str(e)}")  # Add debug logging
        return jsonify({"error": str(e)}), 500

@triage_bp.route('/calculate', methods=['POST'])
def calculate_priority():
    """Calculate priority for a specific patient"""
    try:
        data = request.json
        
        # Validate required fields
        if 'patient_id' not in data:
            return jsonify({"error": "Missing patient_id field"}), 400
        
        # Get patient
        params = {'id': f"eq.{data['patient_id']}"}
        patients = supabase_request('GET', '/rest/v1/patients', params=params)
        
        if not patients:
            return jsonify({"error": "Patient not found"}), 404
        
        patient = patients[0]
        
        # Get triage settings
        settings = get_triage_settings()
        
        # Initialize fuzzy logic system
        fuzzy_logic = TriageFuzzyLogic(settings)
        
        # Calculate waiting time in minutes
        now = datetime.utcnow()  # Use UTC time
        # Handle both ISO format with and without timezone
        arrival_time_str = patient['arrival_time']
        try:
            # Try parsing with timezone info
            arrival_time = datetime.fromisoformat(arrival_time_str)
            # Convert to UTC if it has timezone info
            if arrival_time.tzinfo is not None:
                arrival_time = arrival_time.astimezone(None).replace(tzinfo=None)
        except ValueError:
            # If parsing fails, try removing timezone info
            arrival_time = datetime.fromisoformat(arrival_time_str.split('+')[0].split('Z')[0])
        
        waiting_time_minutes = int((now - arrival_time).total_seconds() / 60)  # Convert to integer minutes
        
        # Get resource and staff availability
        resource_availability = data.get('resource_availability', calculate_resource_availability(patient))
        staff_availability = data.get('staff_availability', calculate_staff_availability(patient))
        
        # Calculate priority score
        priority_result = fuzzy_logic.calculate_priority({
            'risk_level': patient['risk_level'],
            'waiting_time_minutes': waiting_time_minutes,
            'resource_availability': resource_availability,
            'staff_availability': staff_availability
        })
        
        # Update patient with priority score
        update_data = {
            'priority_score': int(priority_result['priority_score']),  # Convert to integer
            'last_priority_update': now.isoformat() + 'Z',  # Add UTC indicator
        }
        # Format the query parameters correctly for Supabase
        result = supabase_request('PATCH', f'/rest/v1/patients?id=eq.{patient["id"]}', data=update_data)
        
        # Log priority update
        log_data = {
            'patient_id': patient['id'],
            'previous_score': int(patient.get('priority_score', 0)),  # Convert to integer
            'new_score': int(priority_result['priority_score']),  # Convert to integer
            'waiting_time_minutes': waiting_time_minutes,
            'risk_level': patient['risk_level'],
            'resource_availability_factor': int(resource_availability),  # Convert to integer
            'staff_availability_factor': int(staff_availability),  # Convert to integer
            'reason': 'Manual calculation',
            'created_at': now.isoformat() + 'Z'  # Add UTC indicator
        }
        supabase_request('POST', '/rest/v1/priority_logs', data=log_data)
        
        # Update patient object for response
        patient['priority_score'] = int(priority_result['priority_score'])  # Convert to integer
        patient['waiting_time_minutes'] = waiting_time_minutes
        
        return jsonify({
            'patient': patient,
            'priority_details': priority_result
        })
    except Exception as e:
        print(f"Calculate Priority Error: {str(e)}")  # Add debug logging
        return jsonify({"error": str(e)}), 500

@triage_bp.route('/settings', methods=['GET'])
def get_settings():
    """Get triage system settings"""
    try:
        settings = get_triage_settings()
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@triage_bp.route('/settings', methods=['PUT'])
def update_settings():
    """Update triage system settings"""
    try:
        data = request.json
        
        # Validate settings
        required_fields = [
            'risk_level_weight', 'waiting_time_weight', 
            'resource_availability_weight', 'staff_availability_weight',
            'waiting_time_exponent_base', 'waiting_time_constant'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Ensure weights sum to 1.0
        weights_sum = (
            data['risk_level_weight'] + 
            data['waiting_time_weight'] + 
            data['resource_availability_weight'] + 
            data['staff_availability_weight']
        )
        
        if abs(weights_sum - 1.0) > 0.01:
            return jsonify({"error": "Weights must sum to 1.0"}), 400
        
        # Update settings in database
        update_data = {
            'key': 'priority_calculation',
            'value': data,
            'description': 'Weights and parameters for the priority calculation algorithm',
            'updated_at': datetime.now().isoformat()
        }
        
        params = {'key': 'eq.priority_calculation'}
        result = supabase_request('PUT', '/rest/v1/system_settings', data=update_data, params=params)
        
        if not result:
            # If no existing record, create one
            supabase_request('POST', '/rest/v1/system_settings', data=update_data)
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@triage_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get triage system statistics"""
    try:
        # Get all patients
        all_patients = supabase_request('GET', '/rest/v1/patients')
        
        # Count patients by status
        status_counts = {
            'waiting': 0,
            'in_treatment': 0,
            'treated': 0,
            'discharged': 0
        }
        
        for patient in all_patients:
            status = patient['status']
            if status in status_counts:
                status_counts[status] += 1
        
        # Count patients by risk level
        risk_level_counts = {
            'low': 0,    # Risk level 1
            'medium': 0, # Risk level 2
            'high': 0    # Risk level 3
        }
        
        for patient in all_patients:
            risk_level = patient['risk_level']
            if risk_level == 1:
                risk_level_counts['low'] += 1
            elif risk_level == 2:
                risk_level_counts['medium'] += 1
            elif risk_level == 3:
                risk_level_counts['high'] += 1
        
        # Calculate average waiting time for treated patients
        treated_patients = [p for p in all_patients if p['status'] in ['treated', 'discharged']]
        total_waiting_time = 0
        
        for patient in treated_patients:
            if 'arrival_time' in patient and 'treatment_start_time' in patient:
                arrival_time = datetime.fromisoformat(patient['arrival_time'])
                treatment_start_time = datetime.fromisoformat(patient['treatment_start_time'])
                waiting_time_minutes = (treatment_start_time - arrival_time).total_seconds() / 60
                total_waiting_time += waiting_time_minutes
        
        avg_waiting_time = total_waiting_time / len(treated_patients) if treated_patients else 0
        
        return jsonify({
            'patient_counts': {
                'total': len(all_patients),
                'by_status': status_counts,
                'by_risk_level': risk_level_counts
            },
            'waiting_time': {
                'average_minutes': avg_waiting_time
            },
            'created_at': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def calculate_resource_availability(patient):
    """Calculate resource availability percentage for a patient"""
    try:
        # Get patient resource requirements
        params = {'patient_id': f"eq.{patient['id']}"}
        requirements = supabase_request('GET', '/rest/v1/patient_resource_requirements', params=params)
        
        if not requirements:
            return 100  # No requirements means 100% availability
        
        # Get available resources
        params = {'status': 'eq.available'}
        available_resources = supabase_request('GET', '/rest/v1/resources', params=params)
        
        # Count how many required resource types are available
        available_types = set(r['type'] for r in available_resources)
        required_types = set(r['resource_type'] for r in requirements)
        
        # Calculate availability percentage
        if not required_types:
            return 100
        
        available_count = sum(1 for t in required_types if t in available_types)
        return (available_count / len(required_types)) * 100
    except Exception as e:
        print(f"Error calculating resource availability: {e}")
        return 75  # Default value

def calculate_staff_availability(patient):
    """Calculate staff availability percentage for a patient"""
    try:
        # Get patient specialty requirements
        params = {'patient_id': f"eq.{patient['id']}"}
        requirements = supabase_request('GET', '/rest/v1/patient_specialty_requirements', params=params)
        
        if not requirements:
            return 100  # No requirements means 100% availability
        
        # Get available staff
        params = {'status': 'eq.available'}
        available_staff = supabase_request('GET', '/rest/v1/staff', params=params)
        
        # Count how many required specialties are available
        available_specialties = set(s['specialty'] for s in available_staff)
        required_specialties = set(r['specialty'] for r in requirements)
        
        # Calculate availability percentage
        if not required_specialties:
            return 100
        
        available_count = sum(1 for s in required_specialties if s in available_specialties)
        return (available_count / len(required_specialties)) * 100
    except Exception as e:
        print(f"Error calculating staff availability: {e}")
        return 80  # Default value
