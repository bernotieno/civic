import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { getBillStatusColor, getBillStatusStyle } from '../constants/billStatuses';

interface Bill {
  id: string;
  bill_number: string;
  title: string;
  description: string;
  summary: string;
  sponsor: string;
  committee?: string;
  status: string;
  status_display: string;
  introduced_date?: string;
  first_reading_date?: string;
  committee_deadline?: string;
  public_participation_open: boolean;
  participation_deadline?: string;
  document?: string;
  image?: string;
  created_at: string;
}



const Bills: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthentication = () => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    checkAuthentication();
    
    const fetchBills = async () => {
      setLoading(true);
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('http://127.0.0.1:8000/api/public/bills/', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const allBills = data.data || [];
          // Get only the latest 3 bills
          setBills(allBills.slice(0, 3));
        } else {
          console.error('Failed to fetch bills');
          setBills([]);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Request timed out');
        } else {
          console.error('Error fetching bills:', error);
        }
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  if (loading) {
    return (
      <section className="py-8 sm:py-10 lg:py-12 bg-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-8 sm:mb-10 mobile-text-adjust">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Parliamentary Bills</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-2 text-sm sm:text-base">
              Loading latest bills...
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-center max-w-7xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 sm:p-6 animate-pulse card-mobile">
                <div className="h-32 sm:h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-10 lg:py-12 bg-gray-50">
      <div className="container-responsive">
        {/* Section Title */}
        <div className="text-center mb-8 sm:mb-10 mobile-text-adjust">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            Parliamentary Bills
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-2 text-sm sm:text-base leading-relaxed">
            Explore active bills in Kenya's Parliament. Read, understand, and
            contribute your voice to shape legislation that affects our nation.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-center max-w-7xl mx-auto">
          {bills.length > 0 ? (
            bills.map((bill) => {


              return (
                <div
                  key={bill.id}
                  className="bg-white shadow-md rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 w-full card-mobile"
                >
                  {/* Bill Title */}
                  <div className="px-3 sm:px-4 pt-3 sm:pt-4">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2 line-clamp-2">{bill.title}</h3>
                  </div>

                  {/* Bill Status */}
                  <div className="px-3 sm:px-4 mb-3">
                    <span
                      className={`text-xs font-medium px-2 sm:px-3 py-1 rounded-full ${getBillStatusColor(bill.status)}`}
                      style={getBillStatusStyle(bill.status)}
                    >
                      {bill.status_display}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="px-3 sm:px-4 mb-4">
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                      {bill.description.length > 120
                        ? `${bill.description.substring(0, 120)}...`
                        : bill.description
                      }
                    </p>
                  </div>

                  {/* Sponsor */}
                  <div className="px-3 sm:px-4 mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <Users size={14} className="text-gray-500 flex-shrink-0" />
                      <span className="font-medium">Sponsor:</span>
                      <span className="truncate">{bill.sponsor}</span>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <div className="px-3 sm:px-4 pb-2">
                    <button
                      onClick={() => navigate(`/bill/${bill.id}`)}
                      className="font-medium transition-colors hover:underline flex items-center gap-1 text-xs sm:text-sm touch-target"
                      style={{ color: '#0D3C43' }}
                    >
                      View Details →
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="px-3 sm:px-4 py-3 sm:py-4">
                    <div className="text-center">
                      {isAuthenticated ? (
                        <button
                          onClick={() => navigate(`/bill/${bill.id}`)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out btn-mobile touch-target"
                        >
                          View Details
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/login')}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out btn-mobile touch-target"
                        >
                          Login to Engage
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600 text-sm sm:text-base">No bills available at the moment.</p>
            </div>
          )}
        </div>

        {/* View More Bills Button */}
        <div className="text-center mt-6 sm:mt-8">
          <button
            onClick={() => navigate('/bills')}
            className="bg-[#0D3C43] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#0D3C43]/90 transition-colors font-medium text-sm sm:text-base btn-responsive touch-target"
          >
            View All Bills
          </button>
        </div>
      </div>
    </section>
  );
};

export default Bills;
