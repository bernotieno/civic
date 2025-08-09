/**
 * Feedback Overview Cards Component
 * Dashboard cards showing user's feedback statistics
 */

import React from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus
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
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    }
  };

  const classes = colorClasses[color];

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`${classes.bg} border ${classes.borderColor} rounded-xl p-6 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${classes.iconBg} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${classes.iconColor}`} />
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-xs font-medium ${getTrendColor()}`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
        {trend && (
          <p className="text-xs text-gray-400 mt-2">{trend.label}</p>
        )}
      </div>
    </div>
  );
};

const FeedbackOverviewCards: React.FC<FeedbackOverviewCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Feedback',
      value: stats.totalFeedback,
      subtitle: 'Submissions made',
      icon: MessageSquare,
      color: 'blue' as const,
      trend: {
        value: 12,
        direction: 'up' as const,
        label: 'vs last month'
      }
    },
    {
      title: 'Pending Responses',
      value: stats.pendingResponses,
      subtitle: 'Awaiting government action',
      icon: Clock,
      color: 'yellow' as const,
      trend: {
        value: -8,
        direction: 'down' as const,
        label: 'vs last month'
      }
    },
    {
      title: 'Resolved Issues',
      value: stats.resolvedIssues,
      subtitle: 'Successfully addressed',
      icon: CheckCircle,
      color: 'green' as const,
      trend: {
        value: 25,
        direction: 'up' as const,
        label: 'vs last month'
      }
    },
    {
      title: 'Avg Response Time',
      value: `${stats.averageResponseTime} days`,
      subtitle: 'Government response speed',
      icon: TrendingUp,
      color: 'purple' as const,
      trend: {
        value: -15,
        direction: 'down' as const,
        label: 'faster than average'
      }
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Feedback Overview</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View detailed analytics →
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
          />
        ))}
      </div>

      {/* Quick Insights */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Great Response Rate</p>
              <p className="text-sm text-gray-600">
                {Math.round((stats.resolvedIssues / stats.totalFeedback) * 100)}% of your feedback has been resolved
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Engagement</p>
              <p className="text-sm text-gray-600">
                You're helping improve {stats.pendingResponses + stats.resolvedIssues} community issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackOverviewCards;
