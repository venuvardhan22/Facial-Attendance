# config.py
from pymongo import MongoClient
from flask_cors import CORS

# MongoDB Configuration
client = MongoClient('your_database_url')
db = client['attendance_db']
students_collection = db['students']
attendance_collection = db['attendance']

# CORS setup function
def enable_cors(app):
    CORS(app, origins=["http://localhost:5173"])
