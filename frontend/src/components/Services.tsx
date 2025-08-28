import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";

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
      <section className="py-10 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800">Parliamentary Bills</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-2">
              Loading latest bills...
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 justify-center max-w-7xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
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
    <section className="py-10 bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800">
            Parliamentary Bills
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-2">
            Explore active bills in Kenya's Parliament. Read, understand, and
            contribute your voice to shape legislation that affects our nation.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3 justify-center">
          {bills.length > 0 ? (
            bills.map((bill) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'draft': return 'bg-gray-100 text-gray-700';
                  case 'first_reading': return 'bg-blue-100 text-blue-700';
                  case 'committee_stage': return 'bg-yellow-100 text-yellow-700';
                  case 'second_reading': return 'bg-orange-100 text-orange-700';
                  case 'third_reading': return 'bg-purple-100 text-purple-700';
                  case 'presidential_assent': return 'bg-indigo-100 text-indigo-700';
                  case 'enacted': return 'bg-green-100 text-green-700';
                  case 'withdrawn': return 'bg-red-100 text-red-700';
                  default: return 'bg-gray-100 text-gray-700';
                }
              };

              return (
                <div
                  key={bill.id}
                  className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center px-4 pt-4">
                    <h3 className="font-bold text-lg text-gray-800">{bill.bill_number}</h3>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(bill.status)}`}>
                      {bill.status_display}
                    </span>
                  </div>

                  {/* Image */}
                  {bill.image && (
                    <div className="mt-2">
                      <img
                        src={`http://127.0.0.1:8000${bill.image}`}
                        alt={bill.title}
                        className="w-full h-36 object-cover rounded-md px-4"
                      />
                    </div>
                  )}

                  {/* Title and Description */}
                  <div className="px-4 mt-2">
                    <h4 className="font-semibold text-gray-900 mb-1">{bill.title}</h4>
                    <p className="text-gray-600 text-sm">{bill.summary || bill.description}</p>
                  </div>

                  {/* Sponsor + Committee */}
                  <div className="px-4 mt-3 text-sm text-gray-700">
                    <div className="flex items-center gap-1 mb-1">
                      <Users size={16} />
                      <span>Sponsor: {bill.sponsor}</span>
                    </div>
                    {bill.committee && (
                      <div className="text-xs text-gray-500">
                        Committee: {bill.committee}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/bill/${bill.id}`)}
                      className="text-blue-600 hover:underline font-medium flex items-center gap-1 mt-2"
                    >
                      View Full Details →
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-4">
                    <div className="text-center">
                      {isAuthenticated ? (
                        <button 
                          onClick={() => navigate(`/bill/${bill.id}`)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
                        >
                          View Details
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate('/login')}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
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
              <p className="text-gray-600">No bills available at the moment.</p>
            </div>
          )}
        </div>

        {/* View More Bills Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/bills')}
            className="bg-[#0D3C43] text-white px-6 py-3 rounded-lg hover:bg-[#0D3C43]/90 transition-colors font-medium"
          >
            View All Bills
          </button>
        </div>
      </div>
    </section>
  );
};

export default Bills;
