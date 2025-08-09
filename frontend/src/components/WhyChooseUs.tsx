import React from 'react';
import { Clock, Shield, Users, Zap, Eye, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Feature } from '../types';

const WhyChooseUs: React.FC = () => {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      number: '01',
      title: t('whyChooseUs.features.fastResponse.title'),
      description: t('whyChooseUs.features.fastResponse.description'),
      icon: 'clock'
    },
    {
      number: '02',
      title: t('whyChooseUs.features.secure.title'),
      description: t('whyChooseUs.features.secure.description'),
      icon: 'shield'
    },
    {
      number: '03',
      title: t('whyChooseUs.features.directAccess.title'),
      description: t('whyChooseUs.features.directAccess.description'),
      icon: 'users'
    },
    {
      number: '04',
      title: t('whyChooseUs.features.realTimeTracking.title'),
      description: t('whyChooseUs.features.realTimeTracking.description'),
      icon: 'zap'
    },
    {
      number: '05',
      title: t('whyChooseUs.features.transparency.title'),
      description: t('whyChooseUs.features.transparency.description'),
      icon: 'eye'
    },
    {
      number: '06',
      title: t('whyChooseUs.features.multipleChannels.title'),
      description: t('whyChooseUs.features.multipleChannels.description'),
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
            {t('whyChooseUs.subtitle').toUpperCase()}
          </span>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold text-gray-900">
            {t('whyChooseUs.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t('whyChooseUs.description')}
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
              <div className="text-gray-600">{t('whyChooseUs.trustIndicators.uptime')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">256-bit</div>
              <div className="text-gray-600">{t('whyChooseUs.trustIndicators.encryption')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">{t('whyChooseUs.trustIndicators.monitoring')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;