import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Shield, 
  Users, 
  Zap, 
  Eye, 
  MessageCircle,
  ArrowRight,
  Sparkles,
  Award,
  TrendingUp,
  CheckCircle,
  Star,
  Lock,
  Activity,
  Globe,
  Lightbulb
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
// Remove unused import

const WhyChooseUs: React.FC = () => {
  const { t } = useTranslation();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [animatedTrust, setAnimatedTrust] = useState({ uptime: 0, encryption: 0, monitoring: 0 });
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    {
      number: '01',
      title: t('whyChooseUs.features.fastResponse.title') || 'Fast Response',
      description: t('whyChooseUs.features.fastResponse.description') || 'Get quick responses to your feedback and concerns.',
      icon: 'clock'
    },
    {
      number: '02',
      title: t('whyChooseUs.features.secure.title') || 'Secure Platform',
      description: t('whyChooseUs.features.secure.description') || 'Your data is protected with enterprise-grade security.',
      icon: 'shield'
    },
    {
      number: '03',
      title: t('whyChooseUs.features.directAccess.title') || 'Direct Access',
      description: t('whyChooseUs.features.directAccess.description') || 'Connect directly with government officials and departments.',
      icon: 'users'
    },
    {
      number: '04',
      title: t('whyChooseUs.features.realTimeTracking.title') || 'Real-time Tracking',
      description: t('whyChooseUs.features.realTimeTracking.description') || 'Track the status of your feedback in real-time.',
      icon: 'zap'
    },
    {
      number: '05',
      title: t('whyChooseUs.features.transparency.title') || 'Full Transparency',
      description: t('whyChooseUs.features.transparency.description') || 'Complete visibility into government processes and responses.',
      icon: 'eye'
    },
    {
      number: '06',
      title: t('whyChooseUs.features.multipleChannels.title') || 'Multiple Channels',
      description: t('whyChooseUs.features.multipleChannels.description') || 'Various ways to submit and track your feedback.',
      icon: 'message-circle'
    },
  ];

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const featureIndex = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleFeatures(prev => [...prev, featureIndex]);
            
            // Animate trust indicators when section is visible
            if (featureIndex === 0) {
              animateTrustIndicators();
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const features = document.querySelectorAll('[data-index]');
    features.forEach(feature => observer.observe(feature));

    return () => observer.disconnect();
  }, []);

  // Auto-rotate active tab
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const animateTrustIndicators = () => {
    // Animate uptime to 99.9
    let uptime = 0;
    const uptimeTimer = setInterval(() => {
      uptime += 0.1;
      if (uptime >= 99.9) {
        uptime = 99.9;
        clearInterval(uptimeTimer);
      }
      setAnimatedTrust(prev => ({ ...prev, uptime }));
    }, 20);

    // Animate encryption to 256
    let encryption = 0;
    const encryptionTimer = setInterval(() => {
      encryption += 4;
      if (encryption >= 256) {
        encryption = 256;
        clearInterval(encryptionTimer);
      }
      setAnimatedTrust(prev => ({ ...prev, encryption }));
    }, 15);

    // Animate monitoring to 24
    let monitoring = 0;
    const monitoringTimer = setInterval(() => {
      monitoring += 0.5;
      if (monitoring >= 24) {
        monitoring = 24;
        clearInterval(monitoringTimer);
      }
      setAnimatedTrust(prev => ({ ...prev, monitoring }));
    }, 50);
  };

  const getIcon = (iconName: string, isHovered: boolean = false) => {
    const iconClass = `w-8 h-8 text-white transition-all duration-300 ${isHovered ? 'scale-110 rotate-12' : ''}`;
    
    const iconMap = {
      'clock': Clock,
      'shield': Shield,
      'users': Users,
      'zap': Zap,
      'eye': Eye,
      'message-circle': MessageCircle
    };
    
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Clock;
    return <IconComponent className={iconClass} />;
  };

  const trustIndicators = [
    {
      value: animatedTrust.uptime,
      suffix: '%',
      label: t('whyChooseUs.trustIndicators.uptime') || 'Uptime',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'System reliability'
    },
    {
      value: animatedTrust.encryption,
      suffix: '-bit',
      label: t('whyChooseUs.trustIndicators.encryption') || 'Encryption',
      icon: Lock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Military-grade security'
    },
    {
      value: animatedTrust.monitoring,
      suffix: '/7',
      label: t('whyChooseUs.trustIndicators.monitoring') || 'Monitoring',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Continuous oversight'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6 group hover:from-blue-200 hover:to-purple-200 transition-all duration-300">
            <Award className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">
              {(t('whyChooseUs.subtitle') || 'Why Choose Us').toUpperCase()}
            </span>
            <Sparkles className="w-4 h-4 ml-2 text-purple-600 group-hover:rotate-12 transition-transform" />
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {t('whyChooseUs.title') || 'The Smart Choice for Civic Engagement'}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            {t('whyChooseUs.description') || 'Experience the future of citizen-government interaction with our comprehensive platform.'}
          </p>

          {/* Feature Highlights Carousel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto shadow-lg border border-gray-100">
            <div className="flex justify-center space-x-4 mb-4">
              {['Speed', 'Security', 'Trust'].map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === index
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="text-center">
              {activeTab === 0 && (
                <div className="flex items-center justify-center animate-fade-in">
                  <Zap className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-gray-700">Average response time: <strong>2.3 minutes</strong></span>
                </div>
              )}
              {activeTab === 1 && (
                <div className="flex items-center justify-center animate-fade-in">
                  <Shield className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-gray-700">End-to-end encryption: <strong>256-bit SSL</strong></span>
                </div>
              )}
              {activeTab === 2 && (
                <div className="flex items-center justify-center animate-fade-in">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-gray-700">User satisfaction: <strong>4.9/5 stars</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              data-index={index}
              className={`group relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:scale-105 hover:-translate-y-2 ${
                visibleFeatures.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                animationDelay: `${index * 100}ms`
              }}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Background Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              
              {/* Hover Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>

              <div className="relative z-10">
                {/* Header with Number and Icon */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:rotate-3 group-hover:scale-110">
                      {getIcon(feature.icon || '', hoveredFeature === index)}
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-gray-300 transition-colors">
                      {feature.number}
                    </div>
                  </div>
                  
                  {/* Benefit Badge */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Feature {feature.number}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>

                  {/* Action Hint */}
                  <div className={`flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0`}>
                    <span className="text-sm font-medium mr-2">Learn more</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-3xl">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-b-3xl transition-all duration-1000 ease-out"
                    style={{ 
                      width: visibleFeatures.includes(index) ? '100%' : '0%',
                      transitionDelay: `${index * 200 + 500}ms`
                    }}
                  ></div>
                </div>
              </div>

              {/* Floating Success Icon */}
              <div className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0`}>
                <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full transform translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full transform -translate-x-16 translate-y-16"></div>
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                <Globe className="w-5 h-5 mr-2 text-white" />
                <span className="text-white font-medium">Trusted Worldwide</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Built for Reliability & Performance
              </h3>
              <p className="text-white/80 max-w-2xl mx-auto">
                Our infrastructure is designed with enterprise-grade security and reliability standards
              </p>
            </div>

            {/* Animated Trust Stats */}
            <div className="grid md:grid-cols-3 gap-8">
              {trustIndicators.map((indicator, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 group text-center"
                >
                  <div className={`w-16 h-16 ${indicator.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <indicator.icon className={`w-8 h-8 ${indicator.color.replace('text-', 'text-')}`} />
                  </div>
                  
                  <div className="text-4xl font-bold text-white mb-2">
                    {indicator.value.toFixed(indicator.suffix === '%' ? 1 : 0)}
                    <span className="text-2xl">{indicator.suffix}</span>
                  </div>
                  
                  <div className="text-lg font-semibold text-white/90 mb-2">
                    {indicator.label}
                  </div>
                  
                  <div className="text-sm text-white/70">
                    {indicator.description}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-400 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(indicator.value / (indicator.suffix === '%' ? 100 : indicator.suffix === '-bit' ? 256 : 24)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <button className="group inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <Lightbulb className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Experience the Difference
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
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

export default WhyChooseUs;