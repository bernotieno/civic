import { Button } from "./ui/button"

export default function Footer() {
  return (
    <footer className="text-white" style={{background: 'linear-gradient(to right, #1B636F, #0D3C43)'}}>
      <div className="w-full container-responsive py-8 sm:py-10 lg:py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Logo and description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <img
                src="/logo.png"
                alt="CivicAI Logo"
                className="w-8 sm:w-10 h-8 sm:h-10 mr-3 rounded-lg"
              />
              <span className="text-lg sm:text-xl font-bold">CivicAI</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-gray-100">
              Empowering Kenyan citizens to engage meaningfully with government documents and policies through
              AI-powered insights and community participation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Submit Feedback
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Track Feedback
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Transparency portal
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Government portal
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Infrastructure
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Healthcare
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Education
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Security & Safety
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base hover:text-emerald-300 transition-colors block py-1">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm sm:text-base">Nairobi, Kenya</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-sm sm:text-base">+254 (0) 20 123-4567</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm sm:text-base break-all">feedback@civicai.go.ke</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-teal-600 pt-6 sm:pt-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="text-center lg:text-left">
              <h3 className="font-semibold text-base sm:text-lg mb-2">Stay Updated</h3>
              <p className="text-sm sm:text-base text-gray-100">Get notified about new legislation and platform updates</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto lg:mx-0">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 sm:py-3 rounded-lg bg-teal-600 border border-teal-500 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm sm:text-base form-mobile"
              />
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base font-medium btn-mobile touch-target">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-teal-600 pt-4 sm:pt-6 text-center lg:text-left">
          <p className="text-xs sm:text-sm text-teal-200">© 2025 Government of Kenya - CivicAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
