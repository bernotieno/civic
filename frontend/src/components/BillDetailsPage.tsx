import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bill, BillSummary, ChatHistory } from '../types';
import BillTabs from './BillTabs';
import ChatTab from './ChatTab';

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
      const [billResponse, summaryResponse, chatResponse] = await Promise.all([
        fetch(`/api/bills/${billId}`),
        fetch(`/api/bills/${billId}/summary`),
        fetch(`/api/bills/${billId}/chat-history`)
      ]);

      if (billResponse.ok) {
        setBill(await billResponse.json());
      }
      if (summaryResponse.ok) {
        setBillSummary(await summaryResponse.json());
      }
      if (chatResponse.ok) {
        setChatHistory(await chatResponse.json());
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{bill.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Bill Number: {bill.bill_number}</span>
            <span>Status: {bill.status}</span>
            <span>Sponsor: {bill.sponsor}</span>
          </div>
        </div>

        {/* Tabs */}
        <BillTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'original' && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Original Bill Text</h3>
              <div className="whitespace-pre-wrap text-gray-700">
                {bill.content || bill.description}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Bill Summary</h3>
              {billSummary ? (
                <div>
                  <p className="text-gray-700 mb-4">{billSummary.summary}</p>
                  {billSummary.key_points.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Points:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        {billSummary.key_points.map((point, index) => (
                          <li key={index} className="text-gray-700">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Summary not available</p>
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