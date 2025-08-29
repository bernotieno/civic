import React from 'react';

interface BillTabsProps {
  activeTab: 'description' | 'ai-summary' | 'ai-chat' | 'feedback';
  onTabChange: (tab: 'description' | 'ai-summary' | 'ai-chat' | 'feedback') => void;
}

const BillTabs: React.FC<BillTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'description' as const, name: 'Description', description: 'Full bill text' },
    { id: 'ai-summary' as const, name: 'AI Summary', description: 'Key points & overview' },
    { id: 'ai-chat' as const, name: 'AI Chat', description: 'Ask questions about this bill' },
    { id: 'feedback' as const, name: 'Feedback', description: 'Submit your feedback' }
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <span>{tab.name}</span>
              <span className="text-xs text-gray-400 mt-1">{tab.description}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BillTabs;