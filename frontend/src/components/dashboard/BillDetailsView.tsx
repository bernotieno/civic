import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Bill } from '../../types';

interface BillDetailsViewProps {
  billId: string;
  onBack: () => void;
}

const BillDetailsView: React.FC<BillDetailsViewProps> = ({ billId, onBack }) => {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'original' | 'summary' | 'chat'>('original');

  useEffect(() => {
    fetchBill();
  }, [billId]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/public/bills/');
      if (response.ok) {
        const data = await response.json();
        const foundBill = data.data.find((b: Bill) => b.id === billId);
        setBill(foundBill || null);
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-600 mb-4">The requested bill could not be found.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Bills
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 sm:gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
          >
            <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back to Bills</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">{bill.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>Sponsor: {bill.sponsor}</span>
          {bill.participation_deadline && (
            <span>Deadline: {new Date(bill.participation_deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-4 sm:px-6 overflow-x-auto">
            {[
              { id: 'original' as const, name: 'Description', shortName: 'Details', description: 'Full bill details' },
              { id: 'summary' as const, name: 'AI Summary', shortName: 'Summary', description: 'Key points & overview' },
              { id: 'chat' as const, name: 'AI Chat', shortName: 'Chat', description: 'Ask questions about this bill' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.shortName}</span>
                  <span className="text-xs text-gray-400 mt-1 hidden sm:block">{tab.description}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'original' && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Bill Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">{bill.description}</p>
                {bill.document && (
                  <div className="mt-4 sm:mt-6">
                    <h4 className="text-base sm:text-lg font-semibold mb-2">Bill Document</h4>
                    <a 
                      href={`http://127.0.0.1:8000${bill.document}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
                    >
                      📄 <span className="ml-2">Download Bill Document</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">AI-Generated Summary</h3>
              {bill.summary ? (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{bill.summary}</p>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-gray-500 text-sm sm:text-base">AI summary not available for this bill.</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">Summary is generated when a document is uploaded.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">AI Chat Assistant</h3>
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Chat with AI about this bill to get answers to your questions.</p>
                <p className="text-xs sm:text-sm text-gray-500">AI Chat feature coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetailsView;