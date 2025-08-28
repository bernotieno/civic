import type React from "react"
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-gray-200" style={{backgroundColor: '#E2FCF7'}}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img 
                src="/logo.jpg" 
                alt="CivicAI Logo" 
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback if logo.jpg doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">CivicAI</h1>
              <p className="text-xs text-gray-500">Kenya's Civic Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`${isActive('/')} font-medium transition-colors`}>
              Home
            </Link>
            <Link to="/bills" className={`${isActive('/bills')} font-medium transition-colors`}>
              Bills
            </Link>
            <Link to="/about" className={`${isActive('/about')} font-medium transition-colors`}>
              About
            </Link>
          </nav>

          {/* Auth Buttons - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm">
              Register
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-emerald-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              <Link to="/" className={`block px-3 py-2 rounded-md ${isActive('/')} font-medium transition-colors`} onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link to="/bills" className={`block px-3 py-2 rounded-md ${isActive('/bills')} font-medium transition-colors`} onClick={() => setIsMenuOpen(false)}>
                Bills
              </Link>
              <Link to="/about" className={`block px-3 py-2 rounded-md ${isActive('/about')} font-medium transition-colors`} onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
              <div className="pt-2 border-t border-gray-200">
                <Link to="/login" className="block px-3 py-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="block px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors text-center" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
