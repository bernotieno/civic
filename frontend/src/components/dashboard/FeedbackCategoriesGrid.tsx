/**
 * Feedback Categories Grid Component
 * Quick access grid for different national policy feedback categories
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  Heart,
  GraduationCap,
  Construction,
  Wheat,
  Leaf,
  Shield,
  Building,
  TrendingUp,
  Users,
  MoreHorizontal
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
      id: 'legislation',
      name: 'Legislation & Bills',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      description: 'Parliamentary bills and legislation',
      count: 45
    },
    {
      id: 'budget',
      name: 'Budget & Finance',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50',
      description: 'National budget and financial policies',
      count: 32
    },
    {
      id: 'healthcare',
      name: 'Healthcare Policy',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'hover:bg-red-50',
      description: 'National healthcare policies',
      count: 28
    },
    {
      id: 'education',
      name: 'Education Policy',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'hover:bg-purple-50',
      description: 'National education policies',
      count: 24
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure Development',
      icon: Construction,
      color: 'text-orange-600',
      bgColor: 'hover:bg-orange-50',
      description: 'National infrastructure projects',
      count: 19
    },
    {
      id: 'agriculture',
      name: 'Agriculture & Food Security',
      icon: Wheat,
      color: 'text-amber-600',
      bgColor: 'hover:bg-amber-50',
      description: 'Agricultural policies and food security',
      count: 16
    },
    {
      id: 'environment',
      name: 'Environment & Climate',
      icon: Leaf,
      color: 'text-emerald-600',
      bgColor: 'hover:bg-emerald-50',
      description: 'Environmental and climate policies',
      count: 14
    },
    {
      id: 'security',
      name: 'National Security',
      icon: Shield,
      color: 'text-indigo-600',
      bgColor: 'hover:bg-indigo-50',
      description: 'National security and defense',
      count: 12
    },
    {
      id: 'governance',
      name: 'Governance & Oversight',
      icon: Building,
      color: 'text-gray-600',
      bgColor: 'hover:bg-gray-50',
      description: 'Government oversight and reforms',
      count: 18
    },
    {
      id: 'economic',
      name: 'Economic Policy',
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'hover:bg-cyan-50',
      description: 'Economic development policies',
      count: 21
    },
    {
      id: 'social',
      name: 'Social Services',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'hover:bg-pink-50',
      description: 'Social welfare and services',
      count: 15
    },
    {
      id: 'other',
      name: 'Other National Issues',
      icon: MoreHorizontal,
      color: 'text-slate-600',
      bgColor: 'hover:bg-slate-50',
      description: 'Other national matters',
      count: 8
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
