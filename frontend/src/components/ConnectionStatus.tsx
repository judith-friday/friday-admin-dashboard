'use client';

import { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  backendUrl?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  connectedClients: number;
  gms_connection: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001' 
}) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkHealth = async () => {
    try {
      const response = await fetch(`${backendUrl}/health`);
      const data = await response.json();
      
      setHealth(data);
      setIsOnline(data.status === 'ok');
      setLastCheck(new Date());
    } catch (err) {
      console.error('[Health Check] Failed to check backend health:', err);
      setIsOnline(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusBg = () => {
    if (!isOnline) return 'bg-red-50 border-red-200';
    return 'bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '🔴';
    return '🟢';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    return 'Online';
  };

  return (
    <div className={`border rounded-lg p-3 mb-4 ${getStatusBg()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-semibold ${getStatusColor()}`}>
                GMS Integration: {getStatusText()}
              </span>
              {health && (
                <span className="text-sm text-gray-500">
                  • {health.connectedClients} client{health.connectedClients !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {health && (
              <div className="text-xs text-gray-600 mt-1">
                <span>Backend: {health.gms_connection}</span>
                <span className="mx-2">•</span>
                <span>Last check: {lastCheck.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={checkHealth}
          className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {!isOnline && (
        <div className="mt-3 text-sm text-red-700">
          <p>⚠️ Dashboard is offline. Check your connection or try refreshing the page.</p>
          <p className="text-xs mt-1">
            If the issue persists, contact the technical team or check the backend server status.
          </p>
        </div>
      )}

      {isOnline && health && (
        <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">WebSocket Status:</span>
            <span className="block text-green-600">Connected</span>
          </div>
          <div>
            <span className="font-medium">Polling Interval:</span>
            <span className="block">30 seconds</span>
          </div>
          <div>
            <span className="font-medium">Real-time Updates:</span>
            <span className="block text-green-600">Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;