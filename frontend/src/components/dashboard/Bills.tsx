import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Search } from 'lucide-react';
import { Bill } from '../../types';

interface BillsProps {
  onFeedbackClick?: (billId?: string) => void;
  onBillExplore?: (billId: string) => void;
}

const Bills: React.FC<BillsProps> = ({ onFeedbackClick, onBillExplore }) => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');



  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const billsResponse = await fetch('http://127.0.0.1:8000/api/public/bills/', {
        headers
      });
      
      if (billsResponse.ok) {
        const billsData = await billsResponse.json();
        setBills(billsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      first_reading: 'bg-blue-100 text-blue-800',
      committee_stage: 'bg-yellow-100 text-yellow-800',
      second_reading: 'bg-orange-100 text-orange-800',
      third_reading: 'bg-purple-100 text-purple-800',
      presidential_assent: 'bg-indigo-100 text-indigo-800',
      enacted: 'bg-green-100 text-green-800',
      withdrawn: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });



  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Parliamentary Bills</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No bills found matching your criteria.</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{bill.title}</h3>
                    <p className="text-gray-700 mb-3">
                      {bill.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 flex-shrink-0 ${getStatusColor(bill.status)}`}>
                    {bill.status_display || bill.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Sponsor: <span className="font-medium">{bill.sponsor}</span></p>
                  </div>
                  <div>
                    {bill.participation_deadline && (
                      <p className="text-sm text-gray-600">
                        <Calendar className="inline-block w-4 h-4 mr-1" />
                        Participation Deadline: {formatDate(bill.participation_deadline)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Open for Public Participation
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => onBillExplore?.(bill.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Explore Bill
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>


    </div>
  );
};

export default Bills;