// Bill Status Constants and Utilities
// Centralized configuration for bill statuses across the application

export interface BillStatus {
  value: string;
  display: string;
  description: string;
  color: string;
  textColor: string;
  backgroundColor?: string;
  order: number;
}

export const BILL_STATUSES: BillStatus[] = [
  {
    value: 'draft',
    display: 'Draft',
    description: 'Bill is being drafted and not yet introduced',
    color: 'bg-gray-100 text-gray-700',
    textColor: 'text-gray-700',
    backgroundColor: '#F3F4F6',
    order: 1
  },
  {
    value: 'first_reading',
    display: 'First Reading',
    description: 'Bill has been introduced and read for the first time',
    color: 'text-white',
    textColor: 'text-white',
    backgroundColor: '#0D3C43',
    order: 2
  },
  {
    value: 'committee_stage',
    display: 'Committee Stage',
    description: 'Bill is being reviewed by parliamentary committee',
    color: 'bg-yellow-100 text-yellow-700',
    textColor: 'text-yellow-700',
    backgroundColor: '#FEF3C7',
    order: 3
  },
  {
    value: 'second_reading',
    display: 'Second Reading',
    description: 'Bill is being debated in parliament',
    color: 'bg-teal-100 text-teal-700',
    textColor: 'text-teal-700',
    backgroundColor: '#CCFBF1',
    order: 4
  },
  {
    value: 'third_reading',
    display: 'Third Reading',
    description: 'Final parliamentary debate and voting',
    color: 'bg-teal-200 text-teal-800',
    textColor: 'text-teal-800',
    backgroundColor: '#99F6E4',
    order: 5
  },
  {
    value: 'presidential_assent',
    display: 'Presidential Assent',
    description: 'Bill awaiting presidential signature',
    color: 'text-white',
    textColor: 'text-white',
    backgroundColor: '#0D3C43',
    order: 6
  },
  {
    value: 'enacted',
    display: 'Enacted',
    description: 'Bill has become law',
    color: 'bg-green-100 text-green-700',
    textColor: 'text-green-700',
    backgroundColor: '#D1FAE5',
    order: 7
  },
  {
    value: 'withdrawn',
    display: 'Withdrawn',
    description: 'Bill has been withdrawn from consideration',
    color: 'bg-red-100 text-red-700',
    textColor: 'text-red-700',
    backgroundColor: '#FEE2E2',
    order: 8
  }
];

// Utility functions
export const getBillStatusByValue = (value: string): BillStatus | undefined => {
  return BILL_STATUSES.find(status => status.value === value);
};

export const getBillStatusColor = (status: string): string => {
  const statusConfig = getBillStatusByValue(status);
  return statusConfig?.color || 'bg-gray-100 text-gray-700';
};

export const getBillStatusStyle = (status: string): React.CSSProperties => {
  const statusConfig = getBillStatusByValue(status);
  if (statusConfig?.backgroundColor && (status === 'first_reading' || status === 'presidential_assent')) {
    return { backgroundColor: statusConfig.backgroundColor };
  }
  return {};
};

export const getBillStatusDisplay = (status: string): string => {
  const statusConfig = getBillStatusByValue(status);
  return statusConfig?.display || status.replace('_', ' ');
};

export const getBillStatusDescription = (status: string): string => {
  const statusConfig = getBillStatusByValue(status);
  return statusConfig?.description || '';
};

// Get statuses sorted by order
export const getSortedBillStatuses = (): BillStatus[] => {
  return [...BILL_STATUSES].sort((a, b) => a.order - b.order);
};

// Get statuses for dropdown/filter options
export const getBillStatusOptions = () => {
  return getSortedBillStatuses().map(status => ({
    value: status.value,
    label: status.display,
    description: status.description
  }));
};

// Check if status is active (not draft or withdrawn)
export const isActiveStatus = (status: string): boolean => {
  return !['draft', 'withdrawn'].includes(status);
};

// Check if status allows public participation
export const allowsPublicParticipation = (status: string): boolean => {
  return ['first_reading', 'committee_stage', 'second_reading'].includes(status);
};

// Get status progress percentage (for progress bars)
export const getStatusProgress = (status: string): number => {
  const statusConfig = getBillStatusByValue(status);
  if (!statusConfig) return 0;
  
  const progressMap: Record<string, number> = {
    'draft': 10,
    'first_reading': 25,
    'committee_stage': 40,
    'second_reading': 60,
    'third_reading': 80,
    'presidential_assent': 90,
    'enacted': 100,
    'withdrawn': 0
  };
  
  return progressMap[status] || 0;
};

// Get next possible statuses for workflow
export const getNextPossibleStatuses = (currentStatus: string): BillStatus[] => {
  const workflows: Record<string, string[]> = {
    'draft': ['first_reading', 'withdrawn'],
    'first_reading': ['committee_stage', 'second_reading', 'withdrawn'],
    'committee_stage': ['second_reading', 'first_reading', 'withdrawn'],
    'second_reading': ['third_reading', 'committee_stage', 'withdrawn'],
    'third_reading': ['presidential_assent', 'second_reading', 'withdrawn'],
    'presidential_assent': ['enacted', 'third_reading'],
    'enacted': [], // Final state
    'withdrawn': ['draft'] // Can be reintroduced
  };
  
  const nextStatusValues = workflows[currentStatus] || [];
  return BILL_STATUSES.filter(status => nextStatusValues.includes(status.value));
};
