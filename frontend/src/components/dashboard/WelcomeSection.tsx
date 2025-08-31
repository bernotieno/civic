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
  user: {
    name?: string;
    county_name?: string;
  } | null;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ user }) => {
  const userName = user?.name || 'Citizen';
  const monthlyResolved = 47; // This could come from dashboard data
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white relative overflow-hidden w-full">
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-3">
              {getGreeting()}, {userName}!
            </h1>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Your voice matters. Engage with Parliament and shape national policy.
            </p>
          </div>

          {/* Right Side - Primary Action */}
          <div className="flex flex-col gap-3">
            {/* Primary CTA - View Bills */}
            <button
              onClick={() => navigate('?view=bills-projects')}
              className="bg-white text-blue-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center justify-center group shadow-lg text-sm sm:text-base"
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="truncate">Engage with Parliament</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
