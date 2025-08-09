import React from 'react';
import { Building, Heart, GraduationCap, Shield, Leaf, Bus } from 'lucide-react';
import type { FeedbackCategory } from '../types';

const Services: React.FC = () => {
  const categories: FeedbackCategory[] = [
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      icon: 'building',
      description: 'Report issues with roads, water supply, electricity, and public facilities in your area.',
      subcategories: ['Roads', 'Water Supply', 'Electricity', 'Public Buildings']
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: 'heart',
      description: 'Share feedback about hospitals, clinics, medical services, and healthcare accessibility.',
      subcategories: ['Hospitals', 'Clinics', 'Medical Services', 'Health Programs']
    },
    {
      id: 'education',
      name: 'Education',
      icon: 'graduation-cap',
      description: 'Provide input on schools, universities, educational programs, and learning facilities.',
      subcategories: ['Primary Schools', 'Secondary Schools', 'Universities', 'Vocational Training']
    },
    {
      id: 'security',
      name: 'Security & Safety',
      icon: 'shield',
      description: 'Report security concerns, safety issues, and feedback about police services.',
      subcategories: ['Police Services', 'Public Safety', 'Emergency Response', 'Crime Prevention']
    },
    {
      id: 'environment',
      name: 'Environment',
      icon: 'leaf',
      description: 'Address environmental concerns including waste management, pollution, and conservation.',
      subcategories: ['Waste Management', 'Air Quality', 'Water Pollution', 'Conservation']
    },
    {
      id: 'transport',
      name: 'Transportation',
      icon: 'bus',
      description: 'Share feedback about public transport, traffic management, and transportation infrastructure.',
      subcategories: ['Public Transport', 'Traffic Management', 'Road Safety', 'Transport Infrastructure']
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
            FEEDBACK CATEGORIES
          </span>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold text-gray-900">
            What Would You Like to Report?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the category that best matches your feedback. Your input helps us improve public services.
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
                {category.subcategories.length} subcategories available
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl">
            Start Feedback Submission
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Anonymous submissions are welcome • Average response time: 3-5 business days
          </p>
        </div>
      </div>
    </section>
  );
};

export default Services;