from flask import Blueprint, jsonify, request
from pymongo import MongoClient
from datetime import datetime

# MongoDB configuration
client = MongoClient('your_database_url')
db = client['attendance_db']
attendance_collection = db['attendance']
students_collection = db['students']

# Create the 'bsdata' blueprint
bsdata_app = Blueprint('bsdata', __name__)

@bsdata_app.route('/students', methods=['GET'])
def get_students():
    try:
        # Fetch the students data from MongoDB
        students = list(students_collection.find({}, {'_id': 0, 'student_id': 1, 'name': 1}))
        
        # Return the students as a JSON response
        return jsonify(students)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bsdata_app.route('/attendance', methods=['GET'])
def get_attendance():
    # Retrieve query parameters for student, month, and day range
    student_name = request.args.get('student')  # Example: "John Doe"
    month = request.args.get('month')  # Example: "01" for January
    day = request.args.get('day')  # Example: "15" for 15th day
    day_range = request.args.get('day_range')  # Example: "10-20" for a range from 10 to 20

    # Fetch students and attendance records from MongoDB
    students = list(students_collection.find({}, {'_id': 0, 'student_id': 1, 'name': 1}))
    attendance = list(attendance_collection.find({}, {'_id': 0, 'student_id': 1, 'date': 1}))

    # Filter students if a specific student is selected
    if student_name:
        students = [student for student in students if student_name.lower() in student['name'].lower()]

    # Create a dictionary to store student attendance data
    attendance_dict = {}
    all_dates = set()

    # Fill the attendance dictionary with student attendance data
    for record in attendance:
        student_id = record['student_id']
        date = record['date']
        all_dates.add(date)

        if student_id not in attendance_dict:
            attendance_dict[student_id] = set()
        attendance_dict[student_id].add(date)

    # Initialize total days held for the selected filters
    total_days_held = 0
    filtered_dates = set()

    # Apply month and day filters
    if month and day:
        filtered_dates = {
            date for date in all_dates
            if datetime.strptime(date, "%Y-%m-%d").month == int(month) and
               datetime.strptime(date, "%Y-%m-%d").day == int(day)
        }
        total_days_held = len(filtered_dates)
        attendance_dict = {
            student_id: {date for date in dates if date in filtered_dates}
            for student_id, dates in attendance_dict.items()
        }
    elif month:
        filtered_dates = {date for date in all_dates if datetime.strptime(date, "%Y-%m-%d").month == int(month)}
        total_days_held = len(filtered_dates)
        attendance_dict = {
            student_id: {date for date in dates if date in filtered_dates}
            for student_id, dates in attendance_dict.items()
        }
    elif day:
        filtered_dates = {date for date in all_dates if f"-{str(day).zfill(2)}" in date}
        total_days_held = len(filtered_dates)
        attendance_dict = {
            student_id: {date for date in dates if date in filtered_dates}
            for student_id, dates in attendance_dict.items()
        }

    # Apply day range filter if provided
    if day_range:
        day_start, day_end = map(int, day_range.split('-'))
        filtered_dates = {
            date for date in filtered_dates if day_start <= int(date.split('-')[2]) <= day_end
        }
        total_days_held = len(filtered_dates)
        attendance_dict = {
            student_id: {date for date in dates if date in filtered_dates}
            for student_id, dates in attendance_dict.items()
        }

    # Format the response with attendance data for each student
    result = []
    for idx, student in enumerate(students, start=1):
        student_id = student['student_id']

        # Get the attendance data for the student after applying all filters
        student_attendance = attendance_dict.get(student_id, [])

        # Calculate attended days and percentage
        attended_days = len(student_attendance)
        percentage = (attended_days / total_days_held) * 100 if total_days_held > 0 else 0

        result.append({
            's_no': idx,
            'name': student['name'],
            'attendance': list(student_attendance),
            'attended_days': attended_days,
            'total_days_held': total_days_held,
            'percentage': round(percentage, 2)
        })

    return jsonify(result)
