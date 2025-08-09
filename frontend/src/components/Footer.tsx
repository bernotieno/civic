import React from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, MessageSquare, Search, BarChart3 } from 'lucide-react';

const Footer: React.FC = () => {
  const quickLinks = [
    { name: 'Submit Feedback', href: '#submit' },
    { name: 'Track Feedback', href: '#track' },
    { name: 'Transparency Portal', href: '#transparency' },
    { name: 'Government Portal', href: '#government' },
    { name: 'Help & Support', href: '#help' },
  ];

  const categories = [
    { name: 'Infrastructure', href: '#infrastructure' },
    { name: 'Healthcare', href: '#healthcare' },
    { name: 'Education', href: '#education' },
    { name: 'Security & Safety', href: '#security' },
    { name: 'Environment', href: '#environment' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Platform Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-2xl font-bold">CitizenPortal</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering citizens to engage with their government through transparent, 
              efficient feedback and response systems. Building stronger communities together.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center"
                  >
                    {index === 0 && <MessageSquare className="w-4 h-4 mr-2" />}
                    {index === 1 && <Search className="w-4 h-4 mr-2" />}
                    {index === 2 && <BarChart3 className="w-4 h-4 mr-2" />}
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Feedback Categories</h3>
            <ul className="space-y-3">
              {categories.map((category, index) => (
                <li key={index}>
                  <a
                    href={category.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-blue-400 mr-3 mt-1 flex-shrink-0" />
                <div className="text-gray-300">
                  <p>Government Digital Services</p>
                  <p>P.O. Box 30007-00100</p>
                  <p>Nairobi, Kenya</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                <span className="text-gray-300">+254 (0) 20 123-4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                <span className="text-gray-300">feedback@citizenportal.go.ke</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Integration Info */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h3 className="text-lg font-semibold mb-2">Submit via WhatsApp</h3>
              <p className="text-gray-300">
                Send your feedback directly via WhatsApp for quick and easy submission.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 whitespace-nowrap">
                +254 700 123 456
              </button>
              <button className="border border-gray-600 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 whitespace-nowrap">
                Learn How
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Government of Kenya - CitizenPortal. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#accessibility" className="text-gray-400 hover:text-white transition-colors">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;