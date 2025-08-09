import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, TrendingUp, Shield, UserPlus } from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section 
      className="relative py-20 bg-gradient-to-br from-gray-50 to-blue-50"
      style={{
        backgroundImage: 'linear-gradient(rgba(249, 250, 251, 0.9), rgba(239, 246, 255, 0.9)), url(https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1600)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Content */}
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Your Voice{' '}
              <span className="text-blue-600">Matters</span>
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Submit feedback, track progress, and engage with your government. 
              Together, we build better communities through transparent communication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Get Started - Register Now
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center justify-center">
                <Search className="w-5 h-5 mr-2" />
                Track Existing Feedback
              </button>
            </div>

            {/* Registration CTA */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🇰🇪 Register with Your Kenyan National ID
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Join thousands of Kenyans already using CivicAI to engage with their county governments.
                Registration takes less than 2 minutes with your 8-digit National ID.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>✓ Secure & Private</span>
                <span>✓ Government Approved</span>
                <span>✓ Free to Use</span>
              </div>
            </div>

            {/* Value Propositions */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 text-center">
                <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Your Voice Matters</h3>
                <p className="text-sm text-gray-600">Every feedback counts towards building better communities</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 text-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Get Real Responses</h3>
                <p className="text-sm text-gray-600">Receive official responses from government officials</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 text-center">
                <Search className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
                <p className="text-sm text-gray-600">Monitor the status of your feedback in real-time</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 text-center">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Anonymous Option</h3>
                <p className="text-sm text-gray-600">Submit feedback anonymously when needed</p>
              </div>
            </div>

            {/* Live Statistics */}
            <div className="grid md:grid-cols-3 gap-8 bg-white/90 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">12,847</div>
                <div className="text-gray-600">Total Feedback Received</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">9,234</div>
                <div className="text-gray-600">Issues Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">87%</div>
                <div className="text-gray-600">Response Rate</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-600 rounded-full opacity-10 hidden lg:block"></div>
        <div className="absolute top-10 right-10 w-24 h-24 bg-blue-400 rounded-full opacity-20 hidden lg:block"></div>
      </div>
    </section>
  );
};

export default Hero;