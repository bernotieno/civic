import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  Search, 
  TrendingUp, 
  Shield, 
  UserPlus,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Play,
  Users,
  Clock,
  Star
} from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Animation trigger
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animated statistics
  useEffect(() => {
    const stats = [
      { value: 12847, label: t('hero.stats.totalFeedback') },
      { value: 9234, label: t('hero.stats.issuesResolved') },
      { value: 87, label: t('hero.stats.responseRate'), suffix: '%' }
    ];

    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [t]);

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const valueProps = [
    {
      icon: MessageSquare,
      title: t('hero.valueProps.voiceMatters.title'),
      description: t('hero.valueProps.voiceMatters.description'),
      color: 'from-blue-500 to-cyan-500',
      delay: '0ms'
    },
    {
      icon: TrendingUp,
      title: t('hero.valueProps.realResponses.title'),
      description: t('hero.valueProps.realResponses.description'),
      color: 'from-green-500 to-emerald-500',
      delay: '100ms'
    },
    {
      icon: Search,
      title: t('hero.valueProps.trackProgress.title'),
      description: t('hero.valueProps.trackProgress.description'),
      color: 'from-purple-500 to-pink-500',
      delay: '200ms'
    },
    {
      icon: Shield,
      title: t('hero.valueProps.anonymous.title'),
      description: t('hero.valueProps.anonymous.description'),
      color: 'from-orange-500 to-red-500',
      delay: '300ms'
    }
  ];

  const stats = [
    { value: 12847, label: t('hero.stats.totalFeedback'), icon: MessageSquare, color: 'text-blue-600' },
    { value: 9234, label: t('hero.stats.issuesResolved'), icon: CheckCircle, color: 'text-green-600' },
    { value: 87, label: t('hero.stats.responseRate'), suffix: '%', icon: TrendingUp, color: 'text-purple-600' }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-900/80 to-black/60"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1600')] bg-cover bg-center opacity-10"></div>
        
        {/* Floating Elements */}
        <div 
          className="absolute top-20 left-20 w-64 h-64 bg-gray-800/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
          }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px)`
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-gray-600/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(-50%, -50%) translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)`
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Content */}
          <div className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 group hover:bg-white/20 transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
              <span className="text-white/90 text-sm font-medium">Trusted by 40+ Counties</span>
              <ArrowRight className="w-4 h-4 ml-2 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-8">
              <span className="bg-gradient-to-r from-white via-gray-100 to-blue-100 bg-clip-text text-transparent">
                {t('hero.title')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button
                onClick={() => navigate('/register')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="flex items-center justify-center">
                  <UserPlus className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  {t('hero.getStarted')}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              <button
                onClick={() => navigate('/anonymous-feedback')}
                className="group px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Anonymous Feedback
                </span>
              </button>

              <button 
                onClick={() => navigate('/track')}
                className="group px-8 py-4 bg-transparent text-white rounded-2xl font-semibold border-2 border-white/30 hover:border-white hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  {t('hero.trackFeedback')}
                </span>
              </button>
            </div>
          </div>

          {/* Registration CTA Card */}
          <div className={`transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-16 max-w-2xl mx-auto border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">
                  {t('hero.registerCTA.title')}
                </h3>
              </div>
              <p className="text-white/80 mb-6 leading-relaxed">
                {t('hero.registerCTA.description')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Shield, text: t('hero.registerCTA.secure') },
                  { icon: CheckCircle, text: t('hero.registerCTA.approved') },
                  { icon: Users, text: t('hero.registerCTA.free') }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-center p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-all duration-300">
                    <item.icon className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-white/90 text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className={`transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {valueProps.map((prop, index) => (
                <div
                  key={index}
                  className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
                  style={{ animationDelay: prop.delay }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${prop.color} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:rotate-12 transition-transform duration-300 shadow-2xl`}>
                    <prop.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-4 text-lg group-hover:text-blue-200 transition-colors">
                    {prop.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors">
                    {prop.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Statistics */}
          <div className={`transition-all duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 mr-3 text-green-400" />
                Live Impact Dashboard
              </h3>
              <div className="grid md:grid-cols-3 gap-12">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center group/stat">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl group-hover/stat:bg-white/20 transition-all duration-300">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </div>
                    <div className={`text-5xl font-bold ${stat.color} mb-2 group-hover/stat:scale-110 transition-transform duration-300`}>
                      {stat.value.toLocaleString()}{stat.suffix || ''}
                    </div>
                    <div className="text-white/80 font-medium group-hover/stat:text-white transition-colors">
                      {stat.label}
                    </div>
                    <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4 group-hover/stat:via-white/60 transition-all duration-300"></div>
                  </div>
                ))}
              </div>
              
              {/* Real-time indicator */}
              <div className="flex items-center justify-center mt-8 text-white/60">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">Updated in real-time</span>
              </div>
            </div>
          </div>

          {/* Video Demo Button */}
          <div className={`transition-all duration-1000 delay-900 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="mt-16">
              <button className="group flex items-center justify-center mx-auto px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-gray-900 ml-1" />
                </div>
                <span className="text-white font-medium">Watch Demo (2 min)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;