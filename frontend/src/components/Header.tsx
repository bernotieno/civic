import type React from "react"
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-[#0D3C43]' : 'text-gray-700 hover:text-[#0D3C43]';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-gray-200 safe-area-padding" style={{backgroundColor: '#E2FCF7'}}>
      <div className="w-full px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="flex-shrink-0">
              <img
                src="/logo.png"
                alt="CivicAI Logo"
                className="h-8 sm:h-10 w-auto"
                onError={(e) => {
                  // Fallback if logo.png doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-8 sm:w-10 h-8 sm:h-10 rounded-lg items-center justify-center" style={{ backgroundColor: '#0D3C43' }}>
                <span className="text-white font-bold text-base sm:text-lg">C</span>
              </div>
            </div>
            <div className="hidden xs:block min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">CivicAI</h1>
              <p className="text-xs text-gray-500 truncate hidden sm:block">Kenya's Civic Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link to="/" className={`${isActive('/')} font-medium transition-colors text-sm lg:text-base`}>
              Home
            </Link>
            <Link to="/bills" className={`${isActive('/bills')} font-medium transition-colors text-sm lg:text-base`}>
              Bills
            </Link>
            <Link to="/about" className={`${isActive('/about')} font-medium transition-colors text-sm lg:text-base`}>
              About
            </Link>
          </nav>

          {/* Auth Buttons - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
            <Link to="/login" className="px-3 xl:px-4 py-2 text-gray-700 hover:text-[#0D3C43] font-medium transition-colors text-sm lg:text-base">
              Login
            </Link>
            <Link to="/register" className="px-3 xl:px-4 py-2 bg-[#0D3C43] text-white rounded-lg hover:bg-[#0D3C43]/90 font-medium transition-colors shadow-sm text-sm lg:text-base touch-target">
              Register
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-[#0D3C43] hover:bg-gray-100 touch-target"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-3 sm:px-4 py-3 space-y-1 nav-mobile">
              <Link
                to="/"
                className={`block px-3 py-3 rounded-md ${isActive('/')} font-medium transition-colors touch-target`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/bills"
                className={`block px-3 py-3 rounded-md ${isActive('/bills')} font-medium transition-colors touch-target`}
                onClick={() => setIsMenuOpen(false)}
              >
                Bills
              </Link>
              <Link
                to="/about"
                className={`block px-3 py-3 rounded-md ${isActive('/about')} font-medium transition-colors touch-target`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-3 text-gray-700 hover:text-[#0D3C43] font-medium transition-colors rounded-md hover:bg-gray-50 touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-3 bg-[#0D3C43] text-white rounded-lg hover:bg-[#0D3C43]/90 font-medium transition-colors text-center touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
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
