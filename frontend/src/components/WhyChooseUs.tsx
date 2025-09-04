import React from 'react';

interface CallToActionProps {
  backgroundImage?: string;
}

const CallToActionComponent: React.FC<CallToActionProps> = ({ 
  backgroundImage = '/hero-big.jpeg' 
}) => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative bg-white rounded-3xl p-8 sm:p-12 lg:p-16 transition-all duration-500 border border-gray-100 overflow-hidden max-w-7xl mx-auto">
      {/* Background Image */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{backgroundImage: `url("${backgroundImage}")`}}
        ></div>
      )}
      {/* Background Overlay */}
      <div className="absolute inset-0" style={{backgroundColor: '#0f3f45', opacity: 0.8}}></div>
      <div className="relative z-10 text-center">
        <h2 className="text-white text-3xl font-semibold mb-4">
          Ready to Make a Difference?
        </h2>
        <p className="text-white text-lg mb-8">
          Get started today
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-white px-6 py-2 rounded-md font-bold transition-all duration-200 min-w-[140px] border-2" style={{color: '#0C383D'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#0C383D'; e.currentTarget.style.color = 'white'}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#0C383D'}}>
            Submit Feedback
          </button>
          <button className="border text-white px-6 py-2 rounded-md font-bold hover:bg-gray-50 transition-colors duration-200 min-w-[140px]" style={{borderColor: 'white', backgroundColor: '#0C383D'}} onMouseEnter={(e) => {e.currentTarget.style.color = '#0C383D'; e.currentTarget.style.backgroundColor = 'white'}} onMouseLeave={(e) => {e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = '#0C383D'}}>
            Learn More
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CallToActionComponent;