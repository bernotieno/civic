import React from 'react';
import { TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Statistic } from '../types';

const Statistics: React.FC = () => {
  const { t } = useTranslation();

  const stats: Statistic[] = [
    {
      value: '12.8K',
      label: t('statistics.totalFeedback'),
    },
    {
      value: '87%',
      label: t('statistics.responseRate'),
    },
    {
      value: '3.2',
      label: t('statistics.avgResponseDays'),
    },
    {
      value: '94%',
      label: t('statistics.citizenSatisfaction'),
    },
  ];

  return (
    <section className="py-20 bg-white" id="transparency">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          {/* Government Performance Circle */}
          <div className="relative mb-12 lg:mb-0">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full border-4 border-blue-600 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-blue-600 mb-2">87%</div>
                    <div className="text-lg font-semibold text-gray-700">{t('statistics.governmentPerformance')}</div>
                  </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute top-4 right-4 w-4 h-4 bg-green-400 rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-3 h-3 bg-blue-300 rounded-full"></div>
                <div className="absolute top-12 left-12 w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Performance Statistics */}
          <div className="space-y-12">
            {stats.map((stat, index) => {
              const getIcon = (index: number) => {
                switch (index) {
                  case 0:
                    return <Users className="w-8 h-8 text-blue-600" />;
                  case 1:
                    return <TrendingUp className="w-8 h-8 text-green-600" />;
                  case 2:
                    return <Clock className="w-8 h-8 text-orange-600" />;
                  case 3:
                    return <CheckCircle className="w-8 h-8 text-purple-600" />;
                  default:
                    return <Users className="w-8 h-8 text-blue-600" />;
                }
              };

              return (
                <div key={index} className="flex items-center">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                      {getIcon(index)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {stat.label}
                    </h3>
                    <div className="w-24 h-1 bg-blue-600"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transparency Portal CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {t('statistics.transparencyPortal.title')}
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {t('statistics.transparencyPortal.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200">
              {t('statistics.transparencyPortal.viewDashboard')}
            </button>
            <button className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200">
              {t('statistics.transparencyPortal.downloadReport')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;