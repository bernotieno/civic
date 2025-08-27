const WhyChooseUs = () => {
  const features = [
    {
      number: "01",
      title: "Secure & Anonymous",
      description: "Your data is protected with end-to-end encryption and anonymous participation options.",
    },
    {
      number: "02",
      title: "Fast Response Times",
      description: "Get quick responses and see real-time updates on legislative matters that matter to you.",
    },
    {
      number: "03",
      title: "Full Transparency",
      description: "Complete visibility into the legislative process and how your voice contributes to change.",
    },
    {
      number: "04",
      title: "Direct Government Access",
      description: "Your feedback goes directly to decision-makers and legislative representatives.",
    },
    {
      number: "05",
      title: "Community Impact",
      description: "Real-time connection with government officials and policy makers for immediate impact.",
    },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Why Choose Us?</h2>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Top Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 justify-items-center">
            {/* Card 01 */}
            <div className="w-full max-w-80 p-6 rounded-3xl text-white shadow-lg" style={{backgroundColor: '#5C8985'}}>
              <div className="flex items-center mb-3">
                <span className="text-2xl font-bold mr-3">{features[0].number}</span>
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold mb-2">{features[0].title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{features[0].description}</p>
            </div>

            {/* Card 03 */}
            <div className="w-full max-w-80 p-6 rounded-3xl text-gray-900 shadow-lg" style={{backgroundColor: '#E2FCF7'}}>
              <div className="flex items-center mb-3">
                <span className="text-2xl font-bold mr-3">{features[2].number}</span>
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold mb-2">{features[2].title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{features[2].description}</p>
            </div>
          </div>

          {/* Middle Row */}
          <div className="flex justify-center mb-12">
            {/* Card 05 */}
            <div className="w-full max-w-80 p-6 rounded-3xl text-gray-900 shadow-lg" style={{background: 'linear-gradient(to bottom left, #5C8985, #E2FCF7)'}}>
              <div className="flex items-center mb-3">
                <span className="text-2xl font-bold mr-3">{features[4].number}</span>
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99l-2.54 3.38c-.36.48-.85.63-1.45.63s-1.09-.15-1.45-.63L6.01 8.99C5.54 8.37 4.8 8 4 8H1.46c-.8 0-1.3.63-1.42 1.37L2.5 16H5v6h2v-6h2v6h2v-6h2v6h3z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold mb-2">{features[4].title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{features[4].description}</p>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
            {/* Card 02 */}
            <div className="w-full max-w-80 p-6 rounded-3xl text-gray-900 shadow-lg" style={{backgroundColor: '#E2FCF7'}}>
              <div className="flex items-center mb-3">
                <span className="text-2xl font-bold mr-3">{features[1].number}</span>
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold mb-2">{features[1].title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{features[1].description}</p>
            </div>

            {/* Card 04 */}
            <div className="w-full max-w-80 p-6 rounded-3xl text-white shadow-lg" style={{backgroundColor: '#5C8985'}}>
              <div className="flex items-center mb-3">
                <span className="text-2xl font-bold mr-3">{features[3].number}</span>
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold mb-2">{features[3].title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{features[3].description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs
