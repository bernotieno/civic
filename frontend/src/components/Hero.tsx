import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16 mt-16">
      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Left Content */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Your Voice in
              <br />
              Civic Decisions
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              Engage with the legislative process. Read bills, vote on issues, and submit feedback to make the voice of
              our nation heard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/projects" className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center">
              Explore Bills
            </Link>
            <Link to="/login" className="border border-teal-700 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-medium transition-colors text-center">
              Create an Account
            </Link>
          </div>

          {/* Statistics Cards */}
<div className="flex flex-col sm:flex-row gap-6">
  <div className="relative bg-gradient-to-br from-lime-100 to-lime-200 px-6 py-8 rounded-3xl shadow-sm overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-lime-200 rounded-full opacity-50 transform translate-x-8 -translate-y-8"></div>
    <div className="relative z-10">
      <div className="text-3xl font-bold text-gray-800 mb-1">12,847</div>
      <p className="text-sm text-gray-600 font-medium">Feedback Received</p>
    </div>
  </div>
  
  <div className="relative bg-gradient-to-br from-teal-100 to-cyan-200 px-6 py-8 rounded-3xl shadow-sm overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-200 rounded-full opacity-50 transform translate-x-8 -translate-y-8"></div>
    <div className="relative z-10">
      <div className="text-3xl font-bold text-gray-800 mb-1">9,234</div>
      <p className="text-sm text-gray-600 font-medium">Issues Resolved</p>
    </div>
  </div>
  
  <div className="relative bg-gradient-to-br from-indigo-100 to-purple-200 px-6 py-8 rounded-3xl shadow-sm overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full opacity-50 transform translate-x-8 -translate-y-8"></div>
    <div className="relative z-10">
      <div className="text-3xl font-bold text-gray-800 mb-1">87%</div>
      <p className="text-sm text-gray-600 font-medium">Response Rate</p>
    </div>
  </div>
</div>
        </div>

        {/* Right Illustration */}
        <div className="flex-1 flex justify-center">
          <img 
            src="/hero-big.jpeg" 
            alt="Civic Engagement" 
            className="w-full max-w-lg h-64 sm:h-80 lg:h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </section>
  )
}
