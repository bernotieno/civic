import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 mt-16">
      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Left Content */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Your Voice in
              <br />
              Civic Decisions
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              Engage with the legislative process. Read bills, vote on issues, and submit feedback to make the voice of
              our nation heard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/projects" className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center">
              Explore Projects
            </Link>
            <Link to="/anonymous-feedback" className="border border-teal-700 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-lg font-medium transition-colors text-center">
              Anonymous Feedback
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-yellow-100 px-4 py-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">12,847</div>
              <p>Feedback Received</p>
            </div>
            <div className="bg-teal-100 px-4 py-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">9,234</div>
              <p>Issues Resolved</p>
            </div>
            <div className="bg-purple-100 px-4 py-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">94%</div>
              <p>Response Rate</p>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="flex-1 flex justify-center">
          <img 
            src="/hero-big.jpeg" 
            alt="Civic Engagement" 
            className="w-full max-w-md h-64 object-cover rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </section>
  )
}
