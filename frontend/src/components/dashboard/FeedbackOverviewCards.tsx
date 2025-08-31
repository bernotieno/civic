/**
 * Feedback Overview Cards Component
 * Dashboard cards showing user's feedback statistics
 */

import React from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  TrendingUp
} from 'lucide-react';

interface FeedbackStats {
  totalFeedback: number;
  pendingResponses: number;
  resolvedIssues: number;
  averageResponseTime: number;
}

interface FeedbackOverviewCardsProps {
  stats: FeedbackStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} border ${classes.borderColor} rounded-xl p-4 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center mb-3">
        <div className={`${classes.iconBg} p-2 rounded-lg mr-3`}>
          <Icon className={`h-5 w-5 ${classes.iconColor}`} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};}

const FeedbackOverviewCards: React.FC<FeedbackOverviewCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Feedback',
      value: stats.totalFeedback,
      subtitle: 'Submissions made',
      icon: MessageSquare,
      color: 'blue' as const
    },
    {
      title: 'Pending Responses',
      value: stats.pendingResponses,
      subtitle: 'Awaiting action',
      icon: Clock,
      color: 'yellow' as const
    },
    {
      title: 'Resolved Issues',
      value: stats.resolvedIssues,
      subtitle: 'Successfully addressed',
      icon: CheckCircle,
      color: 'green' as const
    },
    {
      title: 'Avg Response Time',
      value: `${stats.averageResponseTime} days`,
      subtitle: 'Response speed',
      icon: TrendingUp,
      color: 'purple' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
      {cards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
};}

export default FeedbackOverviewCards;
