import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16" style={{ backgroundColor: '#E2FCF7' }}>
      <div className="px-4 lg:px-6 py-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="flex-shrink-0">
              <img
                src="/logo.png"
                alt="CivicAI Logo"
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback if logo.png doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: '#0D3C43' }}>
                <span className="text-white font-bold text-lg">C</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <h2 className="font-semibold text-gray-900 text-sm lg:text-base">CivicAI Admin</h2>
              <p className="text-xs lg:text-sm text-gray-500">Parliament Administration</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.level_display || user?.role_display}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm hover:opacity-90"
              style={{ backgroundColor: '#0D3C43' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;