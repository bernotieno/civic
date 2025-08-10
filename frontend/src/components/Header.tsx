import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Search, 
  User, 
  LogIn, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Settings
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getNavigationItems, getRoleDisplayName } from '../utils/roleBasedRouting';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Get navigation items based on user authentication status
  const navItems: NavItem[] = getNavigationItems(user);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false);
    
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

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  return (
    <>
      <header className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-white shadow-sm'
      }`}>
        {/* Contact Info Bar - Hidden on scroll for cleaner look */}
        <div className={`bg-gradient-to-r from-slate-50 to-blue-50/30 transition-all duration-300 ${
          isScrolled ? 'h-0 overflow-hidden py-0' : 'py-2'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex items-center space-x-6">
                <div className="flex items-center group">
                  <Phone className="w-4 h-4 mr-2 group-hover:text-blue-600 transition-colors" />
                  <span className="group-hover:text-blue-600 transition-colors cursor-pointer">
                    {t('header.phone')}
                  </span>
                </div>
                <div className="flex items-center group">
                  <Mail className="w-4 h-4 mr-2 group-hover:text-blue-600 transition-colors" />
                  <span className="group-hover:text-blue-600 transition-colors cursor-pointer">
                    {t('header.email')}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {[Facebook, Twitter, Linkedin].map((Icon, index) => (
                  <Icon
                    key={index}
                    className="w-4 h-4 hover:text-blue-600 cursor-pointer transition-all duration-200 hover:scale-110"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`flex justify-between items-center transition-all duration-300 ${
              isScrolled ? 'h-14' : 'h-16'
            }`}>
              {/* Logo with hover effect */}
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => navigate('/')}>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                    <div className="w-4 h-4 bg-white rounded-sm group-hover:rotate-12 transition-transform duration-200"></div>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-200">
                    {t('header.brandName')}
                  </span>
                </div>
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-center space-x-1">
                  {navItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg group ${
                        location.pathname === item.href
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-900 hover:text-blue-600 hover:bg-blue-50/50'
                      }`}
                    >
                      {item.name}
                      <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-blue-600 transition-all duration-200 ${
                        location.pathname === item.href ? 'w-6' : 'w-0 group-hover:w-4'
                      }`}></span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  
                  {/* Search Dropdown */}
                  <div className={`absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 transition-all duration-200 ${
                    isSearchOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                  }`}>
                    <div className="p-4">
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <LanguageSwitcher />

                {/* Authentication Section */}
                <div className="flex items-center">
                  {isAuthenticated && user ? (
                    // Authenticated user dropdown
                    <div className="relative">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:block text-left">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getRoleDisplayName(user)} • {user.county_name}
                          </p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isUserMenuOpen ? 'rotate-180' : ''
                        }`} />
                      </button>

                      {/* User Dropdown Menu */}
                      <div className={`absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 transition-all duration-200 ${
                        isUserMenuOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                      }`}>
                        <div className="p-4 border-b border-gray-100">
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{getRoleDisplayName(user)} • {user.county_name}</p>
                        </div>
                        <div className="py-2">
                          <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <User className="w-4 h-4 mr-3" />
                            Profile Settings
                          </button>
                          <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Bell className="w-4 h-4 mr-3" />
                            Notifications
                          </button>
                          <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Settings className="w-4 h-4 mr-3" />
                            Settings
                          </button>
                          <hr className="my-2" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            {t('header.logout')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Guest user buttons
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate('/login')}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>{t('header.login')}</span>
                      </button>
                      <button
                        onClick={() => navigate('/register')}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <User className="w-4 h-4" />
                        <span>{t('header.register')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden transition-all duration-300 ${
            isMobileMenuOpen 
              ? 'max-h-96 opacity-100 visible' 
              : 'max-h-0 opacity-0 invisible'
          } overflow-hidden bg-white border-t border-gray-100`}>
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-900 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* Click outside handlers */}
      {(isUserMenuOpen || isSearchOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsSearchOpen(false);
          }}
        />
      )}
    </>
  );
};

export default Header;