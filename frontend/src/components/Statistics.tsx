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
            <div className="w-full max-w-sm px-6 py-4 text-white shadow-lg" style={{backgroundColor: '#5C8985', borderRadius: '100px'}}>
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10.5C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10.5V11.5H13.5V10.5C13.5,8.7 12.8,8.2 12,8.2Z"/>
                  </svg>
                </div>
                <span className="text-3xl font-light text-white opacity-80">01</span>
              </div>
              <h4 className="text-sm font-bold mb-1">Secure & Anonymous</h4>
              <p className="text-xs text-white opacity-90 leading-tight">Your privacy is protected with secure data handling and anonymous submission options.</p>
            </div>

            {/* Card 03 */}
            <div className="w-full max-w-sm px-6 py-4 text-gray-900 shadow-lg" style={{backgroundColor: '#E2FCF7', borderRadius: '100px'}}>
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-gray-800 bg-opacity-80 rounded-full flex items-center justify-center mr-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
                <span className="text-3xl font-light text-gray-600">03</span>
              </div>
              <h4 className="text-sm font-bold mb-1">Full Transparency</h4>
              <p className="text-xs text-gray-700 leading-tight">Access public statistics and see how your community feedback is being addressed.</p>
            </div>
          </div>

          {/* Middle Row */}
          <div className="flex justify-center mb-12">
            {/* Card 05 */}
            <div className="w-full max-w-sm px-6 py-4 text-gray-900 shadow-lg" style={{backgroundColor: '#5C8985', borderRadius: '100px'}}>
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 9.5V11.5L21 9ZM3 9L9 11.5V9.5L3 7V9ZM15 12C15.6 12 16 12.4 16 13V16C16 16.6 15.6 17 15 17H9C8.4 17 8 16.6 8 16V13C8 12.4 8.4 12 9 12H15ZM5 13.5L8.5 15.2L8 16L3 14V13.5ZM16 16L19 13.5V14L16 16Z"/>
                  </svg>
                </div>
                <span className="text-3xl font-light text-white opacity-80">05</span>
              </div>
              <h4 className="text-sm font-bold mb-1 text-white">Direct Government Access</h4>
              <p className="text-xs text-white opacity-90 leading-tight">Your feedback reaches the right government departments and officials directly.</p>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
            {/* Card 02 */}
            <div className="w-full max-w-sm px-6 py-4 text-gray-900 shadow-lg" style={{backgroundColor: '#E2FCF7', borderRadius: '100px'}}>
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-gray-800 bg-opacity-80 rounded-full flex items-center justify-center mr-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
                <span className="text-3xl font-light text-gray-600">02</span>
              </div>
              <h4 className="text-sm font-bold mb-1">Fast Response Times</h4>
              <p className="text-xs text-gray-700 leading-tight">Government officials respond to feedback within 3-5 business days with regular status updates.</p>
            </div>

            {/* Card 04 */}
            <div className="w-full max-w-sm px-6 py-4 text-white shadow-lg" style={{backgroundColor: '#5C8985', borderRadius: '100px'}}>
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 9.5V11.5L21 9ZM3 9L9 11.5V9.5L3 7V9ZM15 12C15.6 12 16 12.4 16 13V16C16 16.6 15.6 17 15 17H9C8.4 17 8 16.6 8 16V13C8 12.4 8.4 12 9 12H15Z"/>
                  </svg>
                </div>
                <span className="text-3xl font-light text-white opacity-80">04</span>
              </div>
              <h4 className="text-sm font-bold mb-1">Direct Government Access</h4>
              <p className="text-xs text-white opacity-90 leading-tight">Your feedback reaches the right government departments and officials directly.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs