import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Mail, Facebook, Twitter, Linkedin, Search, Globe, User, LogIn, LogOut } from 'lucide-react';
import type { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getNavigationItems, getRoleDisplayName } from '../utils/roleBasedRouting';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Get navigation items based on user authentication status
  const navItems: NavItem[] = getNavigationItems(user);

  const handleNavigation = (href: string) => {
    if (href.startsWith('#')) {
      // Handle anchor links (scroll to section)
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href);
          element?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Handle route navigation
      navigate(href);
    }
  };

  return (
    <header className="w-full">
      {/* Contact Info Bar */}
      <div className="bg-gray-50 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span>+254 (0) 20 123-4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>feedback@citizenportal.go.ke</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Facebook className="w-4 h-4 hover:text-blue-600 cursor-pointer transition-colors" />
              <Twitter className="w-4 h-4 hover:text-blue-600 cursor-pointer transition-colors" />
              <Linkedin className="w-4 h-4 hover:text-blue-600 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <span className="text-2xl font-bold text-gray-900">CitizenPortal</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <Search className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors" />
              <div className="flex items-center space-x-1 cursor-pointer">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">En</span>
              </div>
              {/* Authentication Section */}
              <div className="flex items-center space-x-2">
                {isAuthenticated && user ? (
                  // Authenticated user menu
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName(user)} • {user.county_name}
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                ) : (
                  // Guest user menu
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="text-sm">Login</span>
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => navigate('/register')}
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Register</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;