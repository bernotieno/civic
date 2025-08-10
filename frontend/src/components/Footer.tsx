import React from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, MessageSquare, Search, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { name: t('footer.quickLinks.submitFeedback'), href: '#submit', icon: <MessageSquare className="w-4 h-4" /> },
    { name: t('footer.quickLinks.trackFeedback'), href: '#track', icon: <Search className="w-4 h-4" /> },
    { name: t('footer.quickLinks.transparencyPortal'), href: '#transparency', icon: <BarChart3 className="w-4 h-4" /> },
    { name: t('footer.quickLinks.governmentPortal'), href: '#government' },
    { name: t('footer.quickLinks.helpSupport'), href: '#help' },
  ];

  const categories = [
    { name: t('footer.categories.infrastructure'), href: '#infrastructure' },
    { name: t('footer.categories.healthcare'), href: '#healthcare' },
    { name: t('footer.categories.education'), href: '#education' },
    { name: t('footer.categories.security'), href: '#security' },
    { name: t('footer.categories.environment'), href: '#environment' },
  ];

  const socialIcons = [
    { icon: <Facebook />, color: 'hover:text-blue-500' },
    { icon: <Twitter />, color: 'hover:text-sky-400' },
    { icon: <Linkedin />, color: 'hover:text-blue-400' },
    { icon: <Instagram />, color: 'hover:text-pink-500' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Brand & Social */}
        <div>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">{t('header.brandName')}</span>
          </div>
          <p className="text-gray-400 mb-6">{t('footer.description')}</p>
          <div className="flex space-x-4">
            {socialIcons.map((s, i) => (
              <div
                key={i}
                className={`p-2 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all duration-300 ${s.color}`}
              >
                {React.cloneElement(s.icon, { className: 'w-5 h-5' })}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-6 border-l-4 border-blue-500 pl-3">{t('footer.quickLinks.title')}</h3>
          <ul className="space-y-3">
            {quickLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="flex items-center gap-2 text-gray-400 hover:text-white group transition-all duration-300"
                >
                  {link.icon && <span className="text-blue-400 group-hover:scale-110 transition-transform">{link.icon}</span>}
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-lg font-semibold mb-6 border-l-4 border-green-500 pl-3">{t('footer.categories.title')}</h3>
          <ul className="space-y-3">
            {categories.map((category, index) => (
              <li key={index}>
                <a
                  href={category.href}
                  className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block"
                >
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-6 border-l-4 border-yellow-500 pl-3">{t('footer.contact.title')}</h3>
          <div className="space-y-5 text-gray-400">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <p>{t('footer.contact.address')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <span>{t('footer.contact.phone')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <span>{t('footer.contact.email')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Section */}
      <div className="border-t border-gray-800 py-10 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">📲 Submit via WhatsApp</h3>
          <p className="text-gray-400">Send feedback quickly using WhatsApp.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 hover:scale-105">
            +254 700 123 456
          </button>
          <button className="border border-gray-600 hover:border-white hover:text-white text-gray-400 px-6 py-3 rounded-lg font-semibold transition-all duration-300">
            Learn How
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6 px-6 max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-sm text-gray-500">
        <span>{t('footer.legal.copyright')}</span>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
          <a href="#terms" className="hover:text-white transition-colors">Terms</a>
          <a href="#accessibility" className="hover:text-white transition-colors">Accessibility</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
