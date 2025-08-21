import React from 'react';

interface CallToActionProps {
  backgroundImage?: string;
}

const CallToActionComponent: React.FC<CallToActionProps> = ({ 
  backgroundImage = '/hero-big.jpeg' 
}) => {
  return (
    <div className="px-2 py-4">
      <div className="relative bg-white rounded-3xl p-16 transition-all duration-500 border border-gray-100 overflow-hidden">
      {/* Background Image */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{backgroundImage: `url("${backgroundImage}")`}}
        ></div>
      )}
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 text-center">
        <h2 className="text-gray-900 text-3xl font-semibold mb-4">
          Ready to Make a Difference?
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Get started today
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-md font-medium hover:shadow-lg transition-all duration-200 min-w-[140px] border-2 border-blue-500">
            Submit Feedback
          </button>
          <button className="border-2 border-gray-700 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors duration-200 min-w-[140px]">
            Learn More
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CallToActionComponent;