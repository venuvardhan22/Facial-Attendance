
import { Link, useLocation } from 'react-router-dom';
import { Camera, ClipboardList, LayoutDashboard } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-700' : 'hover:bg-indigo-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
      <Link
        to="/take-attendance"
        className={`${isActive('/take-attendance')} flex items-center justify-center p-4 rounded-lg bg-indigo-600 text-white transition-colors duration-200`}
      >
        <Camera className="mr-2 h-5 w-5" />
        Take Attendance
      </Link>
      <Link
        to="/check-attendance"
        className={`${isActive('/check-attendance')} flex items-center justify-center p-4 rounded-lg bg-indigo-600 text-white transition-colors duration-200`}
      >
        <ClipboardList className="mr-2 h-5 w-5" />
        Check Attendance
      </Link>
      <Link
        to="/student-dashboard"
        className={`${isActive('/student-dashboard')} flex items-center justify-center p-4 rounded-lg bg-indigo-600 text-white transition-colors duration-200`}
      >
        <LayoutDashboard className="mr-2 h-5 w-5" />
        Student Dashboard
      </Link>
    </div>
  );
};

export default Navigation;