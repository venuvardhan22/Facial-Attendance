import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import TakeAttendance from './pages/TakeAttendance';
import CheckAttendance from './pages/CheckAttendance';
import StudentDashboard from './pages/StudentDashboard';
import { Users } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  Attendance System
                </span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Navigation />
          <div className="mt-6">
            <Routes>
              <Route path="/" element={<TakeAttendance />} />
              <Route path="/take-attendance" element={<TakeAttendance />} />
              <Route path="/check-attendance" element={<CheckAttendance />} />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;