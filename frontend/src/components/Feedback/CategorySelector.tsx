import React from 'react';
import { 
  Building, 
  Car, 
  Stethoscope, 
  GraduationCap, 
  Shield, 
  Trash2, 
  Zap, 
  Trees,
  Users,
  FileText
} from 'lucide-react';

interface CategorySelectorProps {
  selected: string;
  onSelect: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onSelect }) => {
  const categories = [
    { id: 'infrastructure', name: 'Infrastructure', icon: <Building className="w-5 h-5" />, color: 'blue' },
    { id: 'transportation', name: 'Transportation', icon: <Car className="w-5 h-5" />, color: 'green' },
    { id: 'healthcare', name: 'Healthcare', icon: <Stethoscope className="w-5 h-5" />, color: 'red' },
    { id: 'education', name: 'Education', icon: <GraduationCap className="w-5 h-5" />, color: 'purple' },
    { id: 'safety', name: 'Public Safety', icon: <Shield className="w-5 h-5" />, color: 'orange' },
    { id: 'waste', name: 'Waste Management', icon: <Trash2 className="w-5 h-5" />, color: 'yellow' },
    { id: 'utilities', name: 'Utilities', icon: <Zap className="w-5 h-5" />, color: 'indigo' },
    { id: 'environment', name: 'Environment', icon: <Trees className="w-5 h-5" />, color: 'emerald' },
    { id: 'social', name: 'Social Services', icon: <Users className="w-5 h-5" />, color: 'pink' },
    { id: 'other', name: 'Other', icon: <FileText className="w-5 h-5" />, color: 'gray' }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' : 'hover:border-blue-300',
      green: isSelected ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300' : 'hover:border-green-300',
      red: isSelected ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300' : 'hover:border-red-300',
      purple: isSelected ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' : 'hover:border-purple-300',
      orange: isSelected ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300' : 'hover:border-orange-300',
      yellow: isSelected ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300' : 'hover:border-yellow-300',
      indigo: isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'hover:border-indigo-300',
      emerald: isSelected ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'hover:border-emerald-300',
      pink: isSelected ? 'bg-pink-100 dark:bg-pink-900/30 border-pink-500 text-pink-700 dark:text-pink-300' : 'hover:border-pink-300',
      gray: isSelected ? 'bg-gray-100 dark:bg-gray-800 border-gray-500 text-gray-700 dark:text-gray-300' : 'hover:border-gray-300'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        Select Category *
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category) => {
          const isSelected = selected === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-center group
                ${isSelected 
                  ? getColorClasses(category.color, true)
                  : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ${getColorClasses(category.color, false)}`
                }
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`${isSelected ? '' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                  {category.icon}
                </div>
                <span className="text-xs font-medium">
                  {category.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;