import React from 'react';
import { Building, Heart, GraduationCap, Shield, Leaf, Bus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FeedbackCategory } from '../types';

const Services: React.FC = () => {
  const { t } = useTranslation();

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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'building':
        return <Building className="w-8 h-8 text-white" />;
      case 'heart':
        return <Heart className="w-8 h-8 text-white" />;
      case 'graduation-cap':
        return <GraduationCap className="w-8 h-8 text-white" />;
      case 'shield':
        return <Shield className="w-8 h-8 text-white" />;
      case 'leaf':
        return <Leaf className="w-8 h-8 text-white" />;
      case 'bus':
        return <Bus className="w-8 h-8 text-white" />;
      default:
        return <Building className="w-8 h-8 text-white" />;
    }
  };

  return (
    <section className="py-20 bg-white" id="submit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">
            {t('services.title').toUpperCase()}
          </span>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold text-gray-900">
            {t('services.subtitle')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t('services.description')}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:border-blue-200 group"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-700 transition-colors duration-200">
                {getIcon(category.icon)}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {category.name}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                {category.description}
              </p>
              <div className="text-sm text-blue-600 font-medium">
                {category.subcategories.length} {t('services.subcategoriesAvailable')}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl">
            {t('services.submitFeedback')}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            {t('services.getStarted')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Services;