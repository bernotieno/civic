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


              return (
                <div
                  key={bill.id}
                  className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm"
                >
                  {/* Bill Title */}
                  <div className="px-4 pt-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{bill.title}</h3>
                  </div>

                  {/* Bill Status */}
                  <div className="px-4 mb-3">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${getBillStatusColor(bill.status)}`}
                      style={getBillStatusStyle(bill.status)}
                    >
                      {bill.status_display}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="px-4 mb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {bill.description.length > 150
                        ? `${bill.description.substring(0, 150)}...`
                        : bill.description
                      }
                    </p>
                  </div>

                  {/* Sponsor */}
                  <div className="px-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users size={16} className="text-gray-500" />
                      <span className="font-medium">Sponsor:</span>
                      <span>{bill.sponsor}</span>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => navigate(`/bill/${bill.id}`)}
                      className="font-medium transition-colors hover:underline flex items-center gap-1"
                      style={{ color: '#0D3C43' }}
                    >
                      View Details →
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
