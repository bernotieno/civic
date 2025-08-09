/**
 * Welcome Section Component
 * Personalized greeting with quick stats and primary CTAs
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  UserX, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface WelcomeSectionProps {
  userName: string;
  monthlyResolved: number;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  userName, 
  monthlyResolved 
}) => {
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 lg:p-8 mb-8 text-white relative overflow-hidden w-full">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-16 translate-y-16"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Left Side - Simplified Greeting */}
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center mb-3">
              <Sparkles className="h-6 w-6 mr-2 text-yellow-300" />
              <h1 className="text-2xl lg:text-3xl font-bold">
                {getGreeting()}, {userName}!
              </h1>
            </div>

            <p className="text-blue-100 text-base mb-4">
              Your voice matters. Help improve your community.
            </p>

            {/* Single Key Stat */}
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2 text-sm w-fit">
              <TrendingUp className="h-4 w-4 mr-2 text-green-300" />
              <span className="font-semibold">{monthlyResolved} issues resolved this month</span>
            </div>
          </div>

          {/* Right Side - Primary Action */}
          <div className="flex flex-col gap-3">
            {/* Primary CTA - Submit Feedback */}
            <button
              onClick={() => navigate('/submit-feedback')}
              className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center justify-center group shadow-lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Submit Feedback
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
