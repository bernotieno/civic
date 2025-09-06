import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="w-full container-responsive py-8 sm:py-12 lg:py-16 mt-16">
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Left Content */}
        <div className="flex-1 space-y-6 lg:space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mobile-text-adjust">
              Your Voice in
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Civic Decisions
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Engage with the legislative process. Read bills, vote on issues, and submit feedback to make the voice of
              our nation heard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
            <Link
              to="/login"
              className="bg-[#0D3C43] hover:bg-[#0D3C43]/90 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-medium transition-colors text-center btn-responsive touch-target"
            >
              Create an Account
            </Link>
            <Link
              to="/bills"
              className="border border-teal-700 text-teal-700 hover:bg-teal-50 px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-medium transition-colors text-center btn-responsive touch-target"
            >
              Explore Bills
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="relative bg-gradient-to-br from-lime-100 to-lime-200 px-4 sm:px-6 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden card-mobile">
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-lime-200 rounded-full opacity-50 transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8"></div>
              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">12,847</div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Feedback Received</p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-teal-100 to-cyan-200 px-4 sm:px-6 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden card-mobile">
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-cyan-200 rounded-full opacity-50 transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8"></div>
              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">9,234</div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Issues Resolved</p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-indigo-100 to-purple-200 px-4 sm:px-6 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden card-mobile sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-purple-200 rounded-full opacity-50 transform translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8"></div>
              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">87%</div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Response Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="flex-1 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
            <img
              src="/hero-big.jpeg"
              alt="Civic Engagement"
              className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-xl sm:rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
