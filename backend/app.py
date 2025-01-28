from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
import face_recognition
import os
import pickle
import numpy as np
import base64
from datetime import datetime, timedelta
import csv
from sklearn.neighbors import KDTree
from visualize import bplot_app
from checkattendance import bsdata_app
from config import enable_cors
from config import students_collection, attendance_collection

# Initialize Flask app
app = Flask(__name__)
enable_cors(app)

# Register blueprints
app.register_blueprint(bplot_app, url_prefix='/bplot')
app.register_blueprint(bsdata_app, url_prefix='/bsdata')

# Path to the pickle file and known faces directory
pickle_file = 'known_faces.pkl'
known_faces_dir = './Faces'

# CSV file configuration
attendance_csv_file = "Attendance.csv"

# Initialize known face encodings and names
known_encodings = []
known_names = []

# KDTree for fast face matching
kdtree = None

# Load known faces from the pickle file or images
if os.path.exists(pickle_file):
    print("Loading existing known faces model...")
    with open(pickle_file, 'rb') as f:
        known_encodings, known_names = pickle.load(f)
    kdtree = KDTree(known_encodings)
else:
    print("No pickle file found. Building the model...")
    for file in os.listdir(known_faces_dir):
        if file.endswith(('jpg', 'jpeg', 'png')):
            img = cv2.imread(os.path.join(known_faces_dir, file))
            if img is not None:
                img = cv2.resize(img, (500, int(img.shape[0] * 500 / img.shape[1])))
                try:
                    encodings = face_recognition.face_encodings(img)
                    if encodings:
                        known_encodings.append(encodings[0])
                        known_names.append(file.split('.')[0])
                except IndexError:
                    print(f"No face found in {file}. Skipping this file.")
    with open(pickle_file, 'wb') as f:
        pickle.dump((known_encodings, known_names), f)
    kdtree = KDTree(known_encodings)

print(f"Loaded {len(known_names)} known faces.")
threshold = 0.5
current_time = datetime.now()

# Function to log attendance in MongoDB
def log_attendance_mongo(student_id, name, logged_names):
    """
    Logs attendance into MongoDB only if the student_id has not been logged for the current date.
    """
    # Generate the current date
    current_date = current_time.strftime("%Y-%m-%d")
    try:
        # Insert the student data with upsert to avoid duplicates
        students_collection.update_one(
            {'student_id': student_id},  # Match existing student_id
            {
                "$set": {
                    'name': name  # Update the name if it exists
                }
            },
            upsert=True  # Insert if no match
        )
    except Exception as e:
        # Log the error if duplicate key is attempted
        print(f"Error inserting student {student_id}: {e}")

    # Check MongoDB for an existing entry for the same student_id on the current date
    existing_entry = attendance_collection.find_one({
        'student_id': student_id,
        'date': current_date
    })

    if not existing_entry:
        # Add the new attendance record
        attendance_collection.update_one(
            {
                'student_id': student_id,
                'date': current_date,
            },
            {
                "$set": {
                    'name': student_id,
                    'time': current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    'month': current_time.strftime("%B")
                }
            },
            upsert=True  # Insert if no match
        )
        # Optionally add to the logged_names set
        logged_names.add(student_id)


# Function to log attendance in the CSV file
def log_attendance_csv(student_id, logged_names):
    current_time = datetime.now()
    time_stamp = current_time.strftime("%Y-%m-%d %H:%M:%S")

    file_exists = os.path.exists(attendance_csv_file)

    # Read existing names from the file
    existing_names = set()
    if file_exists and os.path.getsize(attendance_csv_file) > 0:
        with open(attendance_csv_file, mode='r') as file:
            reader = csv.reader(file)
            next(reader, None)  # Skip header
            for row in reader:
                if row:
                    existing_names.add(row[0])

    # Write only if the student ID is not in the existing or logged names
    if student_id not in existing_names and student_id not in logged_names:
        with open(attendance_csv_file, mode='a', newline='') as file:
            writer = csv.writer(file)
            if not file_exists or os.path.getsize(attendance_csv_file) == 0:
                writer.writerow(["Student ID", "Time"])  # Add header
            writer.writerow([student_id, time_stamp])
        logged_names.add(student_id)

@app.route('/recognize', methods=['POST'])
def recognize_face():
    data = request.get_json()

    # Decode the base64 image
    image_data = data['image']
    img_data = base64.b64decode(image_data)
    np_array = np.frombuffer(img_data, dtype=np.uint8)
    img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    # Convert to RGB for face_recognition
    rgb_frame = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Detect faces and get encodings
    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    recognized_faces = []
    logged_names = set()

    if not face_encodings:
        return jsonify({"message": "No face detected."})

    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        dist, index = kdtree.query([face_encoding], k=1)
        if dist[0][0] < threshold:
            student_id = known_names[index[0][0]]

            # Add student to MongoDB if not exists
            try:
                students_collection.update_one(
                    {'student_id': student_id},
                    {"$set": {'name': student_id}},
                    upsert=True
                )
            except Exception as e:
                print(f"Error inserting student: {e}")

            # Log attendance
            log_attendance_mongo(student_id, student_id, logged_names)
            log_attendance_csv(student_id, logged_names)

            recognized_faces.append({
                'student_id': student_id,
                'time': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })

    return jsonify({"recognized_faces": recognized_faces})

if __name__ == '__main__':
    app.run(debug=True)
