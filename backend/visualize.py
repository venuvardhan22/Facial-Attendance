from flask import Blueprint, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import seaborn as sns
from pymongo import MongoClient

bplot_app = Blueprint('bplot', __name__)
CORS(bplot_app, origins=["http://localhost:5174"])

client = MongoClient('your_database_url')
db = client['attendance_db']
attendance_collection = db['attendance']

@bplot_app.route('/students', methods=['GET'])
def get_students():
    students = attendance_collection.distinct('student_id')
    return jsonify(students)

@bplot_app.route('/plot/<student_id>/<plot_type>', methods=['GET'])
def get_plot(student_id, plot_type):
    pipeline = [
        {
            '$match': {'student_id': student_id}
        },
        {
            '$project': {
                'month': {'$month': {'$dateFromString': {'dateString': '$time'}}},
                'year': {'$year': {'$dateFromString': {'dateString': '$time'}}},
            }
        },
        {
            '$group': {
                '_id': {'month': '$month', 'year': '$year'},
                'attendance_count': {'$sum': 1}
            }
        },
        {
            '$sort': {'_id.year': 1, '_id.month': 1}
        }
    ]
    result = list(attendance_collection.aggregate(pipeline))

    months = [entry['_id']['month'] for entry in result]
    attendance_counts = [entry['attendance_count'] for entry in result]

    plt.figure(figsize=(10, 6))
    
    if plot_type == 'bar':
        sns.barplot(x=months, y=attendance_counts)
        plt.title(f"Monthly Attendance for {student_id}", fontsize=16)
        plt.xlabel("Month", fontsize=12)
        plt.ylabel("Attendance Count", fontsize=12)
        plt.xticks(ticks=range(1, 13), labels=["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])
    else:  # line chart
        sns.lineplot(x=months, y=attendance_counts)
        plt.title(f"Monthly Attendance Trend for {student_id}", fontsize=16)
        plt.xlabel("Month", fontsize=12)
        plt.ylabel("Attendance Count", fontsize=12)

    # Save the plot to a BytesIO object
    img = BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plot_data = base64.b64encode(img.getvalue()).decode('utf-8')
    plt.close()

    return jsonify({'attendance': result, 'image': plot_data})
