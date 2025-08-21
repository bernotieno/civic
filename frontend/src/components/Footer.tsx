import { Button } from "./ui/button"

export default function Footer() {
  return (
    <footer className="bg-teal-700 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              Empowering Kenyan citizens to engage meaningfully with government documents and policies through
              AI-powered insights and community participation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Submit Feedback
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Track Feedback
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Transparency portal
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Government portal
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Infrastructure
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Healthcare
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Education
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Security & Safety
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-300 transition-colors">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="text-sm">Nairobi, Kenya</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-sm">+254 (0) 20 123-4567</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">feedback@civicai.go.ke</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-teal-600 pt-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold text-lg mb-2">Stay Updated</h3>
              <p className="text-sm">Get notified about new legislation and platform updates</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rounded-lg bg-teal-600 border border-teal-500 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-teal-600 pt-6">
          <p className="text-sm text-teal-200">© 2025 Government of Kenya - CivicAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
