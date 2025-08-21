import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About CivicAI</h1>
            <p className="text-xl text-gray-600">Empowering Kenya's civic engagement through technology</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              CivicAI is Kenya's premier civic engagement platform that enables citizens to provide feedback 
              to their county governments through a secure, tenant-based system. We believe in transparent 
              governance and empowering every Kenyan voice.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">🔐 Secure & Anonymous</h3>
                <p className="text-gray-600">Submit feedback anonymously or with full authentication using your National ID.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">🏛️ County-Based</h3>
                <p className="text-gray-600">Each of Kenya's 47 counties operates independently with isolated data.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">📍 Location Hierarchy</h3>
                <p className="text-gray-600">Organized by County → Sub-County → Ward → Village structure.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">⚡ Real-time Tracking</h3>
                <p className="text-gray-600">Track your feedback status and government responses in real-time.</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <p className="text-gray-600">Register with your National ID or submit feedback anonymously</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <p className="text-gray-600">Submit feedback about local issues in your county</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <p className="text-gray-600">Track your feedback and receive updates from government officials</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <p className="text-gray-600">See real impact as issues get resolved in your community</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;