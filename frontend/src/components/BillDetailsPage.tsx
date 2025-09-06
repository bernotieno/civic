import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bill, BillSummary, ChatHistory } from '../types';
import BillTabs from './BillTabs';
import ChatTab from './ChatTab';
import { getBillStatusColor, getBillStatusStyle } from '../constants/billStatuses';

const BillDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'summary' | 'chat'>('original');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBillData(id);
    }
  }, [id]);

  const fetchBillData = async (billId: string) => {
    try {
      setLoading(true);
      const billResponse = await fetch('http://127.0.0.1:8000/api/public/bills/');
      
      if (billResponse.ok) {
        const data = await billResponse.json();
        const foundBill = data.data.find((b: Bill) => b.id === billId);
        if (foundBill) {
          setBill(foundBill);
          if (foundBill.summary) {
            setBillSummary({
              id: foundBill.id,
              summary: foundBill.summary,
              key_points: []
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching bill data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-600">The requested bill could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Bill Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{bill.title}</h1>

          {/* Bill Status */}
          <div className="mb-4">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getBillStatusColor(bill.status || '')}`}
              style={getBillStatusStyle(bill.status || '')}
            >
              {bill.status_display || 'Active'}
            </span>
          </div>

          {/* Key Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium" style={{ color: '#0D3C43' }}>Sponsor:</span>
              <span className="text-gray-700">{bill.sponsor}</span>
            </div>
            {bill.participation_deadline && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium" style={{ color: '#0D3C43' }}>Participation Deadline:</span>
                <span className="text-gray-700">{new Date(bill.participation_deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <BillTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'original' && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#0D3C43' }}>Description</h3>
              <div className="text-gray-700 leading-relaxed mb-6 text-base">
                {bill.description}
              </div>
              {bill.document && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2" style={{ color: '#0D3C43' }}>Bill Document</h4>
                  <a
                    href={`http://127.0.0.1:8000${bill.document}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#0D3C43' }}
                  >
                    📄 Download Bill Document
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#0D3C43' }}>AI Summary</h3>
              {billSummary ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-gray-700 leading-relaxed mb-4 text-base">{billSummary.summary}</div>
                  {billSummary.key_points.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3" style={{ color: '#0D3C43' }}>Key Points:</h4>
                      <ul className="list-disc pl-6 space-y-2">
                        {billSummary.key_points.map((point, index) => (
                          <li key={index} className="text-gray-700 leading-relaxed">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-500">AI Summary not available for this bill</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <ChatTab 
              billId={id!} 
              initialHistory={chatHistory} 
              onHistoryUpdate={setChatHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetailsPage;