import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Service', href: '/service' },
    { name: 'Feedback', href: '/feedback' },
    { name: 'About Us', href: '/about' }
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">PathSoft</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3 ml-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="hidden sm:block text-sm text-gray-700">
                    {user.name}
                  </span>
                  <button
                    onClick={logout}
                    className="border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-6 py-2 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <button className="border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-6 py-2 rounded-lg">
                      Login
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                      Register
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`block px-3 py-2 font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-gray-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth Buttons */}
              <div className="border-t border-gray-200 pt-3 mt-3 space-y-2 px-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-700 px-3 py-2">
                      Welcome, {user.name}
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-center py-2 border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 rounded-lg font-medium transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <button className="block w-full text-center py-2 border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 rounded-lg font-medium transition-all duration-200">
                        Login
                      </button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                      <button className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
                        Register
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;