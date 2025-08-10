import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Heart, 
  GraduationCap, 
  Shield, 
  Leaf, 
  Bus,
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  TrendingUp,
  Sparkles,
  Plus,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FeedbackCategory } from '../types';

const Services: React.FC = () => {
  const { t } = useTranslation();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const categories: FeedbackCategory[] = [
    {
      id: 'infrastructure',
      name: t('services.categories.infrastructure.name'),
      icon: 'building',
      description: t('services.categories.infrastructure.description'),
      subcategories: t('services.categories.infrastructure.subcategories', { returnObjects: true }) as string[]
    },
    {
      id: 'healthcare',
      name: t('services.categories.healthcare.name'),
      icon: 'heart',
      description: t('services.categories.healthcare.description'),
      subcategories: t('services.categories.healthcare.subcategories', { returnObjects: true }) as string[]
    },
    {
      id: 'education',
      name: t('services.categories.education.name'),
      icon: 'graduation-cap',
      description: t('services.categories.education.description'),
      subcategories: t('services.categories.education.subcategories', { returnObjects: true }) as string[]
    },
    {
      id: 'security',
      name: t('services.categories.security.name'),
      icon: 'shield',
      description: t('services.categories.security.description'),
      subcategories: t('services.categories.security.subcategories', { returnObjects: true }) as string[]
    },
    {
      id: 'environment',
      name: t('services.categories.environment.name'),
      icon: 'leaf',
      description: t('services.categories.environment.description'),
      subcategories: t('services.categories.environment.subcategories', { returnObjects: true }) as string[]
    },
    {
      id: 'transport',
      name: t('services.categories.transport.name'),
      icon: 'bus',
      description: t('services.categories.transport.description'),
      subcategories: t('services.categories.transport.subcategories', { returnObjects: true }) as string[]
    },
  ];

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleCards(prev => [...prev, cardIndex]);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const cards = document.querySelectorAll('[data-index]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const getIcon = (iconName: string, isHovered: boolean = false) => {
    const iconClass = `w-8 h-8 text-white transition-all duration-300 ${isHovered ? 'scale-110 rotate-12' : ''}`;
    
    switch (iconName) {
      case 'building':
        return <Building className={iconClass} />;
      case 'heart':
        return <Heart className={iconClass} />;
      case 'graduation-cap':
        return <GraduationCap className={iconClass} />;
      case 'shield':
        return <Shield className={iconClass} />;
      case 'leaf':
        return <Leaf className={iconClass} />;
      case 'bus':
        return <Bus className={iconClass} />;
      default:
        return <Building className={iconClass} />;
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-red-500 to-pink-600',
      'from-green-500 to-emerald-600',
      'from-purple-500 to-indigo-600',
      'from-yellow-500 to-orange-600',
      'from-teal-500 to-cyan-600'
    ];
    return colors[index % colors.length];
  };

  const getStats = () => [
    { icon: Users, value: '12K+', label: 'Active Users' },
    { icon: CheckCircle, value: '98%', label: 'Response Rate' },
    { icon: Clock, value: '24h', label: 'Avg Response Time' },
    { icon: TrendingUp, value: '85%', label: 'Issue Resolution' }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 overflow-hidden" 
      id="submit"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-6 group hover:bg-blue-200 transition-all duration-300">
            <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">
              {t('services.title').toUpperCase()}
            </span>
            <ArrowRight className="w-4 h-4 ml-2 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
              {t('services.subtitle')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            {t('services.description')}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {getStats().map((stat, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 text-center">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {categories.map((category, index) => (
            <div
              key={index}
              data-index={index}
              className={`group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden transform hover:scale-105 hover:-translate-y-2 ${
                visibleCards.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                animationDelay: `${index * 100}ms`
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(index)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              {/* Hover Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-20 h-20 bg-gradient-to-br ${getCategoryColor(index)} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:rotate-3 group-hover:scale-110`}>
                  {getIcon(category.icon, hoveredCard === index)}
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors">
                    {category.description}
                  </p>

                  {/* Subcategories Info */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-blue-50 rounded-full px-4 py-2 group-hover:bg-blue-100 transition-colors">
                      <span className="text-blue-700 font-semibold text-sm">
                        {category.subcategories.length} {t('services.subcategoriesAvailable')}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Subcategories */}
                  <div className={`transition-all duration-300 overflow-hidden ${
                    selectedCategory === category.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="grid grid-cols-1 gap-2">
                        {category.subcategories.slice(0, 4).map((sub, subIndex) => (
                          <div key={subIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-sm text-gray-700">{sub}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                        {category.subcategories.length > 4 && (
                          <div className="text-center pt-2">
                            <span className="text-xs text-gray-500">
                              +{category.subcategories.length - 4} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="group/btn inline-flex items-center justify-center w-full mt-4 p-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-blue-600 transition-all duration-300 transform hover:scale-105">
                    <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform" />
                    Submit Feedback
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                <div className="bg-green-500 text-white rounded-full p-2">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Make a Difference?
              </h3>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                {t('services.getStarted')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group relative px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    {t('services.submitFeedback')}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button className="px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-2xl font-semibold hover:border-white hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105">
                  Learn More
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center mt-8 space-x-8 text-white/60">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="text-sm">Secure & Anonymous</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-sm">24/7 Available</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span className="text-sm">Trusted by Thousands</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;