import React from 'react';
import { Clock, Shield, Users, Zap, Eye, MessageCircle } from 'lucide-react';
import type { Feature } from '../types';

const WhyChooseUs: React.FC = () => {
  const features: Feature[] = [
    {
      number: '01',
      title: 'Fast Response Times',
      description: 'Government officials respond to feedback within 3-5 business days with regular status updates.',
      icon: 'clock'
    },
    {
      number: '02',
      title: 'Secure & Anonymous',
      description: 'Your privacy is protected with secure data handling and anonymous submission options.',
      icon: 'shield'
    },
    {
      number: '03',
      title: 'Direct Government Access',
      description: 'Your feedback reaches the right government departments and officials directly.',
      icon: 'users'
    },
    {
      number: '04',
      title: 'Real-time Tracking',
      description: 'Track your feedback status in real-time from submission to resolution.',
      icon: 'zap'
    },
    {
      number: '05',
      title: 'Full Transparency',
      description: 'Access public statistics and see how your community feedback is being addressed.',
      icon: 'eye'
    },
    {
      number: '06',
      title: 'Multiple Channels',
      description: 'Submit feedback via web, WhatsApp, or phone - choose what works best for you.',
      icon: 'message-circle'
    },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'clock':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'shield':
        return <Shield className="w-6 h-6 text-blue-600" />;
      case 'users':
        return <Users className="w-6 h-6 text-blue-600" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-blue-600" />;
      case 'eye':
        return <Eye className="w-6 h-6 text-blue-600" />;
      case 'message-circle':
        return <MessageCircle className="w-6 h-6 text-blue-600" />;
      default:
        return <Clock className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">
            PLATFORM BENEFITS
          </span>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold text-gray-900">
            Why Use CitizenPortal?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            We've built a platform that prioritizes transparency, efficiency, and citizen satisfaction.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-2">
                    {getIcon(feature.icon || '')}
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {feature.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600">Platform Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">256-bit</div>
              <div className="text-gray-600">SSL Encryption</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">System Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;