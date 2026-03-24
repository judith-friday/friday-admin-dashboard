'use client';

import { useState, useEffect } from 'react';

interface DashboardAnalytics {
  pending_messages: number;
  resolved_today: number;
  average_response_time: string;
  guest_satisfaction: string;
  last_updated: string;
}

interface DashboardStatsProps {
  backendUrl?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001' 
}) => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${backendUrl}/api/analytics/dashboard`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('[Analytics Error] Failed to fetch dashboard analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Set fallback data on error
      setAnalytics({
        pending_messages: 0,
        resolved_today: 0,
        average_response_time: '0m',
        guest_satisfaction: '0%',
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="text-red-800 font-semibold">Analytics Error</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    {
      title: 'Pending Messages',
      value: analytics.pending_messages,
      icon: '📥',
      color: analytics.pending_messages > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: analytics.pending_messages > 0 ? 'bg-orange-50' : 'bg-green-50'
    },
    {
      title: 'Resolved Today',
      value: analytics.resolved_today,
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg Response Time',
      value: analytics.average_response_time,
      icon: '⏱️',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Guest Satisfaction',
      value: analytics.guest_satisfaction,
      icon: '😊',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg shadow-lg p-6 border border-opacity-20`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="text-3xl opacity-80">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(analytics.last_updated).toLocaleString()}
          <button 
            onClick={fetchAnalytics}
            className="ml-2 text-blue-500 hover:text-blue-700 underline"
          >
            Refresh
          </button>
        </p>
      </div>
    </div>
  );
};

export default DashboardStats;