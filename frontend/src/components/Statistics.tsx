import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  Download,
  Eye,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Zap,
  Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
// Remove unused import

const Statistics: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState<number[]>([0, 0, 0, 0]);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [performanceProgress, setPerformanceProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const stats = [
    {
      value: '12.8K',
      label: t('statistics.totalFeedback') || 'Total Feedback',
      numericValue: 12800
    },
    {
      value: '87%',
      label: t('statistics.responseRate') || 'Response Rate',
      numericValue: 87
    },
    {
      value: '3.2',
      label: t('statistics.avgResponseDays') || 'Avg Response Time',
      numericValue: 3.2
    },
    {
      value: '94%',
      label: t('statistics.citizenSatisfaction') || 'Citizen Satisfaction',
      numericValue: 94
    },
  ];

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          animateNumbers();
          animatePerformanceCircle();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate numbers
  const animateNumbers = () => {
    stats.forEach((stat, index) => {
      let current = 0;
      const target = stat.numericValue;
      const increment = target / 100;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedStats(prev => {
          const newStats = [...prev];
          newStats[index] = current;
          return newStats;
        });
      }, 20);
    });
  };

  // Animate performance circle
  const animatePerformanceCircle = () => {
    let progress = 0;
    const timer = setInterval(() => {
      progress += 1;
      if (progress >= 87) {
        progress = 87;
        clearInterval(timer);
      }
      setPerformanceProgress(progress);
    }, 30);
  };

  const formatStatValue = (value: number, originalValue: string) => {
    if (originalValue.includes('%')) {
      return `${Math.round(value)}%`;
    } else if (originalValue.includes('K')) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toFixed(1);
    }
  };

  const getColorClass = (color: string, type: 'text' | 'bg' | 'border' = 'text') => {
    const colorMap = {
      blue: { text: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-600' },
      green: { text: 'text-green-600', bg: 'bg-green-600', border: 'border-green-600' },
      orange: { text: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-600' },
      purple: { text: 'text-purple-600', bg: 'bg-purple-600', border: 'border-purple-600' }
    };
    return colorMap[color as keyof typeof colorMap]?.[type] || colorMap.blue[type];
  };

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 overflow-hidden" 
      id="transparency"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-6 group hover:bg-blue-200 transition-all duration-300">
            <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">
              Performance Dashboard
            </span>
            <Sparkles className="w-4 h-4 ml-2 text-blue-600 group-hover:rotate-12 transition-transform" />
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
              Real-Time Impact
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track our commitment to transparency and citizen engagement through live data
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Enhanced Performance Circle */}
          <div className={`relative mb-12 lg:mb-0 transition-all duration-1000 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="flex justify-center">
              <div className="relative group">
                {/* Main Circle */}
                <div className="relative w-96 h-96">
                  {/* Animated Background Ring */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#gradient-bg)"
                      strokeWidth="2"
                      className="opacity-20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#gradient-main)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(performanceProgress / 100) * 283} 283`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                      <linearGradient id="gradient-main" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full w-80 h-80 flex items-center justify-center shadow-2xl border border-gray-100 group-hover:shadow-3xl transition-all duration-300">
                      <div className="text-center">
                        {/* Icon with Animation */}
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:rotate-3 group-hover:scale-110">
                            <TrendingUp className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        {/* Animated Percentage */}
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          {Math.round(performanceProgress)}%
                        </div>
                        <div className="text-xl font-semibold text-gray-700 mb-4">
                          {t('statistics.governmentPerformance') || 'Government Performance'}
                        </div>

                        {/* Performance Badge */}
                        <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full">
                          <Award className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-green-700 font-medium text-sm">Excellent Rating</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute top-8 right-8 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute bottom-12 left-12 w-4 h-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute top-16 left-16 w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className={`space-y-6 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:scale-105 hover:-translate-y-1`}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredStat(index)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out"
                    style={{ 
                      width: isVisible ? `${(animatedStats[index] / stats[index].numericValue) * 100}%` : '0%',
                      transitionDelay: `${index * 200}ms`
                    }}
                  ></div>
                </div>

                <div className="relative z-10 flex items-center">
                  {/* Icon */}
                  <div className="flex-shrink-0 mr-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:rotate-3 group-hover:scale-110">
                      {index === 0 && <Users className="w-10 h-10 text-white" />}
                      {index === 1 && <TrendingUp className="w-10 h-10 text-white" />}
                      {index === 2 && <Clock className="w-10 h-10 text-white" />}
                      {index === 3 && <CheckCircle className="w-10 h-10 text-white" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-baseline mb-2">
                      <div className="text-4xl font-bold text-gray-900 mr-2 group-hover:text-blue-700 transition-colors">
                        {formatStatValue(animatedStats[index], stat.value)}
                      </div>
                      {hoveredStat === index && (
                        <div className="flex items-center text-green-600 animate-fade-in">
                          <TrendingUp className="w-5 h-5 mr-1" />
                          <span className="text-sm font-medium">+12% vs last month</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 group-hover:text-gray-900 transition-colors">
                      {stat.label}
                    </h3>
                    
                    {/* Performance Indicator */}
                    <div className="flex items-center">
                      <div className="flex items-center mr-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-green-600 font-medium">Live</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated 2 minutes ago
                      </div>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className={`transition-all duration-300 ${
                    hoveredStat === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}>
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Transparency Portal CTA */}
        <div className={`mt-20 transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="relative bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 rounded-3xl p-12 overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full transform translate-x-20 -translate-y-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full transform -translate-x-16 translate-y-16"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
            </div>

            <div className="relative z-10 text-center">
              {/* Header */}
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl mr-4">
                  <PieChart className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {t('statistics.transparencyPortal.title') || 'Transparency Portal'}
                  </h3>
                  <div className="flex items-center text-white/70">
                    <Activity className="w-4 h-4 mr-2" />
                    <span className="text-sm">Real-time data • Updated every 5 minutes</span>
                  </div>
                </div>
              </div>

              <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
                {t('statistics.transparencyPortal.description') || 'Access real-time data and insights about government performance and citizen engagement.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                <button className="group relative px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center">
                    <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    {t('statistics.transparencyPortal.viewDashboard') || 'View Dashboard'}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button className="group px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-2xl font-semibold hover:border-white hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105">
                  <span className="flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    {t('statistics.transparencyPortal.downloadReport') || 'Download Report'}
                  </span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { icon: Shield, title: "Secure & Verified", desc: "ISO 27001 Certified" },
                  { icon: Zap, title: "Real-time Updates", desc: "Live data processing" },
                  { icon: Award, title: "Award Winning", desc: "Transparency Excellence 2024" }
                ].map((item, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <item.icon className="w-8 h-8 text-white mx-auto mb-3" />
                    <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-white/70">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default Statistics;