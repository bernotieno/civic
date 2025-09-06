import React from 'react';

interface BillTabsProps {
  activeTab: 'original' | 'summary' | 'chat';
  onTabChange: (tab: 'original' | 'summary' | 'chat') => void;
}

const BillTabs: React.FC<BillTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'original' as const, name: 'Original Bill', description: 'Full bill text' },
    { id: 'summary' as const, name: 'Summary', description: 'Key points & overview' },
    { id: 'chat' as const, name: 'AI Chat', description: 'Ask questions about this bill' }
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
                ? 'border-transparent'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={activeTab === tab.id ? {
              borderBottomColor: '#0D3C43',
              color: '#0D3C43'
            } : {}}
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