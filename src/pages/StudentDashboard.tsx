import { useState, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown, BarChart as BarChartIcon, Search } from 'lucide-react';

const StudentDashboard = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [chartType, setChartType] = useState<string>('bar');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch students dynamically from backend
  const [students, setStudents] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/bplot/students")
      .then(response => response.json())
      .then(data => setStudents(data))
      .catch(error => console.error('Error fetching students:', error));
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStudentSelect = (student: string) => {
    setSelectedStudent(student);
    setSearchTerm('');
    setIsOpen(false);
    setShowChart(false); // Hide chart when new student is selected
  };

  const handleVisualize = () => {
    if (!selectedStudent) return;

    // Fetch attendance data for the selected student from the backend
    fetch(`http://localhost:5000/bplot/plot/${selectedStudent}/${chartType}`)
      .then(response => response.json())
      .then(data => {
        const fetchedData = data.attendance.map((entry: any) => ({
          month: entry._id.month,
          attendance: entry.attendance_count,
        }));
        setAttendanceData(fetchedData);
        setShowChart(true);
      })
      .catch(error => console.error('Error fetching attendance data:', error));
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Student
          </label>
          <div className="relative">
            <div
              className="flex items-center justify-between w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md cursor-pointer bg-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="block truncate">
                {selectedStudent || 'Select a student...'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            
            {isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <ul className="max-h-60 overflow-auto py-1">
                  {filteredStudents.map((student) => (
                    <li
                      key={student}
                      className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 ${
                        selectedStudent === student ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                      }`}
                      onClick={() => handleStudentSelect(student)}
                    >
                      {student}
                    </li>
                  ))}
                  {filteredStudents.length === 0 && (
                    <li className="px-3 py-2 text-gray-500 text-sm">No students found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
          </select>
        </div>
      </div>

      <button
        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
          selectedStudent
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-300 cursor-not-allowed text-gray-500'
        }`}
        onClick={handleVisualize}
        disabled={!selectedStudent}
      >
        <BarChartIcon className="mr-2 h-5 w-5" />
        Visualize
      </button>

      {showChart && selectedStudent && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Attendance History for {selectedStudent}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={getMonthName}
                />
                <YAxis domain={[0, 31]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill="#4f46e5" />
              </BarChart>
              ) : (
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month"
                  tickFormatter={getMonthName}
                   />
                  <YAxis domain={[0, 31]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#4f46e5"
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
