/**
 * Feedback Categories Grid Component
 * Quick access grid for different feedback categories
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Construction,
  Heart,
  GraduationCap,
  Shield,
  Leaf,
  Zap
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  count: number;
}

const FeedbackCategoriesGrid: React.FC = () => {
  const navigate = useNavigate();

  const categories: CategoryItem[] = [
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      icon: Construction,
      color: 'text-orange-600',
      bgColor: 'hover:bg-orange-50',
      description: 'Roads, bridges, public works',
      count: 23
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'hover:bg-red-50',
      description: 'Hospitals, clinics, medical services',
      count: 18
    },
    {
      id: 'education',
      name: 'Education',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'hover:bg-purple-50',
      description: 'Schools, learning facilities',
      count: 15
    },
    {
      id: 'safety',
      name: 'Public Safety',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      description: 'Security, emergency services',
      count: 12
    },
    {
      id: 'environment',
      name: 'Environment',
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50',
      description: 'Waste, pollution, conservation',
      count: 9
    },
    {
      id: 'utilities',
      name: 'Utilities',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'hover:bg-yellow-50',
      description: 'Water, electricity, internet',
      count: 14
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/submit-feedback?category=${categoryId}`);
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md ${category.bgColor} hover:text-gray-900 transition-colors`}
            title={category.description}
          >
            <Icon className={`flex-shrink-0 h-4 w-4 ${category.color} group-hover:text-gray-500 mr-3`} />
            <span className="truncate">{category.name}</span>
            <span className="ml-auto text-xs text-gray-400">{category.count}</span>
          </button>
        );
      })}
    </div>
  );

};

export default FeedbackCategoriesGrid;
