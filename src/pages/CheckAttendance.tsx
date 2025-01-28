import { useState, useEffect } from 'react';
import { Check, X, Search, Download } from 'lucide-react';

interface AttendanceData {
  attendance: string[];
  attended_days: number;
  name: string;
  percentage: number;
  s_no: number;
  total_days_held: number;
}

interface TransformedAttendance {
  id: number;
  name: string;
  attendance: Record<string, boolean>;
}

const CheckAttendance = () => {
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [attendanceData, setAttendanceData] = useState<TransformedAttendance[]>([]);

  // Available months with their days
  const months = [
    { name: 'January', days: 31 },
    { name: 'February', days: 28 }, // 2024 is a leap year
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 },
    { name: 'September', days: 30 },
    { name: 'October', days: 31 },
    { name: 'November', days: 30 },
    { name: 'December', days: 31 }
  ];

  // Get number of days for selected month
  const selectedMonthData = months.find(m => m.name === selectedMonth);
  const daysInMonth = Array.from({ length: selectedMonthData?.days || 31 }, (_, i) => i + 1);

  // Fetch and transform the data from the API
  useEffect(() => {
    fetch('http://localhost:5000/bsdata/attendance')
      .then((response) => response.json())
      .then((data: AttendanceData[]) => {
        const transformedData = data.map((item) => {
          const attendance: Record<string, boolean> = {};
  
          // Extract the current year and calculate the selected month
          const currentYear = new Date().getFullYear(); // Dynamically get the current year
          const selectedMonthNumber = new Date(`${selectedMonth} 1, ${currentYear}`).getMonth(); // Get month number (0-11)
  
          console.log('Selected Month Number:', selectedMonthNumber);
          console.log('Item Attendance:', item.attendance);
  
          // Map attendance only for the selected month and year
          for (let i = 1; i <= 31; i++) {
            const day = i.toString().padStart(2, '0');
            const formattedDate = `${currentYear}-${(selectedMonthNumber + 1)
              .toString()
              .padStart(2, '0')}-${day}`;
  
            // Debug individual date checks
            const isPresent = item.attendance.includes(formattedDate);
            console.log(`Checking ${formattedDate}: ${isPresent}`);
  
            attendance[day] = isPresent;
          }
  
          return {
            id: item.s_no,
            name: item.name,
            attendance,
          };
        });
        
        setAttendanceData(transformedData);
        console.log('Attendance data transformed successfully', transformedData);
      })
      .catch((error) => console.error('Error fetching attendance data:', error));
  }, [selectedMonth]);
  
  // Handle month change
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedDay('all'); // Reset day selection when month changes
  };

  // Calculate attendance statistics
  const calculateStats = (attendance: Record<string, boolean>) => {
    const days = selectedDay === 'all'
      ? Object.entries(attendance).slice(0, selectedMonthData?.days)
      : Object.entries(attendance).filter(([day]) => Number(day) === selectedDay);

    const totalDays = days.length;
    const presentDays = days.filter(([_, present]) => present).length;
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0';
    return { totalDays, presentDays, percentage };
  };

  // Filter students based on search
  const filteredStudents = attendanceData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get visible days based on filter
  const visibleDays = selectedDay === 'all' ? daysInMonth : [selectedDay];

  // Handle CSV download
  const downloadCSV = () => {
    // Create CSV header
    const headers = ['Student Name'];
    visibleDays.forEach(day => headers.push(`Day ${day}`));
    if (selectedDay === 'all') {
      headers.push('Present Days', 'Total Days', 'Percentage');
    }

    // Create CSV rows
    const rows = filteredStudents.map(student => {
      const stats = calculateStats(student.attendance);
      const row = [student.name];
      visibleDays.forEach(day => {
        row.push(student.attendance[day.toString().padStart(2, '0')] ? 'Present' : 'Absent');
      });
      if (selectedDay === 'all') {
        row.push(stats.presentDays.toString());
        row.push(stats.totalDays.toString());
        row.push(stats.percentage + '%');
      }
      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${selectedMonth}_${selectedDay === 'all' ? 'all_days' : `day_${selectedDay}`}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Check Attendance</h1>
        <button
          onClick={downloadCSV}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="mr-2 h-5 w-5" />
          Download CSV
        </button>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {months.map(month => (
              <option key={month.name} value={month.name}>
                {month.name}
              </option>
            ))}
          </select>
        </div>
  
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Day
          </label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Days</option>
            {daysInMonth.map(day => (
              <option key={day} value={day}>Day {day}</option>
            ))}
          </select>
        </div>
  
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
  
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                {/* Show only the selected day or all days */}
                {selectedDay === 'all'
                  ? visibleDays.map(day => (
                      <th key={day} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {day}
                      </th>
                    ))
                  : (
                    <th key={selectedDay} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                )}
  
                {/* Show Present Days, Total Days, and Percentage only if selectedDay is 'all' */}
                {selectedDay === 'all' && (
                  <>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present Days
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Days
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const stats = calculateStats(student.attendance);
                return (
                  <tr key={student.id}>
                    <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                    </td>
                    {/* Show only the selected day or all days */}
                    {selectedDay === 'all'
                      ? visibleDays.map(day => (
                          <td key={day} className="px-3 py-4 text-center whitespace-nowrap">
                            {student.attendance[day] ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                          </td>
                        ))
                      : (
                        <td key={selectedDay} className="px-3 py-4 text-center whitespace-nowrap">
                          {student.attendance[selectedDay] ? (
                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                    )}
  
                    {/* Show Present Days, Total Days, and Percentage only if selectedDay is 'all' */}
                    {selectedDay === 'all' && (
                      <>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-sm text-gray-900">{stats.presentDays}</span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-sm text-gray-900">{stats.totalDays}</span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            Number(stats.percentage) >= 75
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {stats.percentage}%
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CheckAttendance;