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
  const [activeTab, setActiveTab] = useState<'description' | 'ai-summary' | 'ai-chat' | 'feedback'>('description');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBillData(id);
    }
  }, [id]);

  const fetchBillData = async (billId: string) => {
    try {
      setLoading(true);
      const billResponse = await fetch(`http://127.0.0.1:8000/api/public/bills/${billId}/`);
      
      if (billResponse.ok) {
        const data = await billResponse.json();
        const foundBill = data.bill;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{bill.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Sponsor: {bill.sponsor}</span>
            {bill.participation_deadline && (
              <span>Participation Deadline: {new Date(bill.participation_deadline).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <BillTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Bill Description</h3>
              <div className="whitespace-pre-wrap text-gray-700 mb-6">
                {bill.description}
              </div>
              {(bill.document || bill.document_url) && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">Bill Document</h4>
                  <a 
                    href={bill.document_url || `http://127.0.0.1:8000${bill.document}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    📄 Download Bill Document
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-summary' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Bill Summary</h3>
              {(bill.summary || bill.summary_markdown || bill.summary_html) ? (
                <div>
                  <div className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {bill.summary_html ? (
                      <div dangerouslySetInnerHTML={{ __html: bill.summary_html }} />
                    ) : (
                      bill.summary_markdown || bill.summary
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Summary not available</p>
              )}
            </div>
          )}

          {activeTab === 'ai-chat' && (
            <ChatTab 
              billId={id!} 
              initialHistory={chatHistory} 
              onHistoryUpdate={setChatHistory}
            />
          )}

          {activeTab === 'feedback' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Submit Feedback on This Bill</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Tip:</strong> Your feedback will be specifically linked to this bill and sent to the relevant parliamentary committee.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief title for your feedback..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your thoughts, concerns, or suggestions about this bill..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="low">Low - General comment</option>
                    <option value="medium">Medium - Important concern</option>
                    <option value="high">High - Significant impact</option>
                    <option value="urgent">Urgent - Critical issue</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Submit Feedback
                  </button>
                  <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetailsPage;