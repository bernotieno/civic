import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems = [
    { path: '/admin-dashboard', label: 'Overview', icon: '📊' },
    { path: '/admin-dashboard/feedback', label: 'Feedback Management', icon: '💬' },
    { path: '/admin-dashboard/bills', label: 'Bills Management', icon: '📋' },
    { path: '/admin-dashboard/analytics', label: 'Analytics & Reports', icon: '📈' },
    { path: '/admin-dashboard/users', label: 'User Management', icon: '👥' },
    { path: '/admin-dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-300 shadow-sm"
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full pt-16 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white border-r-2'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? '#0D3C43' : undefined,
                  borderColor: isActive ? '#0D3C43' : undefined,
                })}
                onMouseEnter={(e) => {
                  const target = e.currentTarget;
                  const isActive = target.classList.contains('text-white');
                  if (!isActive) {
                    target.style.backgroundColor = '#0D3C43';
                    target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget;
                  const isActive = target.classList.contains('text-white');
                  if (!isActive) {
                    target.style.backgroundColor = '';
                    target.style.color = '';
                  }
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;