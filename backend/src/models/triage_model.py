import joblib
import os

# Load the trained model from file with error handling
model_path = os.path.join(os.path.dirname(__file__), 'triage_model.joblib')

try:
    triage_model = joblib.load(model_path)
    print("Model loaded successfully.")
except FileNotFoundError:
    print(f"Model file not found at path: {model_path}")
    triage_model = None
except Exception as e:
    print(f"Error loading model: {str(e)}")
    triage_model = None
