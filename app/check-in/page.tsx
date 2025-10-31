'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface StatusData {
  status: 'success' | 'error' | 'expired' | 'unauthorized';
  message?: string;
  timestamp?: number;
  details?: any;
}

export default function CheckInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取查询参数
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    const timestamp = searchParams.get('timestamp');
    const expiresAt = searchParams.get('expiresAt');
    const currentTime = searchParams.get('currentTime');

    if (status && ['success', 'error', 'expired', 'unauthorized'].includes(status)) {
      const timestampNum = timestamp ? parseInt(timestamp) : undefined;
      
      if (status === 'expired' && expiresAt && currentTime) {
        setStatusData({
          status: 'expired',
          message: '此签到链接已失效',
          details: {
            expiresAt: parseInt(expiresAt),
            currentTime: parseInt(currentTime)
          }
        });
      } else {
        setStatusData({
          status: status as StatusData['status'],
          message: message || undefined,
          timestamp: timestampNum
        });
      }
    } else {
      setStatusData({
        status: 'error',
        message: '缺少状态信息'
      });
    }

    setLoading(false);
  }, [searchParams]);

  const getStatusConfig = () => {
    if (!statusData) return null;

    const configs = {
      success: {
        icon: '🎉',
        color: 'text-green-600'
      },
      error: {
        icon: '💥',
        color: 'text-red-600'
      },
      expired: {
        icon: '⏳',
        color: 'text-yellow-600'
      },
      unauthorized: {
        icon: '🔐',
        color: 'text-gray-600'
      }
    };

    return configs[statusData.status];
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">无效请求</p>
        </div>
      </div>
    );
  }

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className={`text-6xl mb-6 ${config.color}`}>
          {config.icon}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {statusData.status === 'success' && '签到成功'}
          {statusData.status === 'error' && '签到失败'}
          {statusData.status === 'expired' && '链接已过期'}
          {statusData.status === 'unauthorized' && '未授权'}
        </h1>
        
        {/* 显示错误信息 */}
        {statusData.message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{statusData.message}</p>
          </div>
        )}
        
        {/* 显示时间戳信息 */}
        {statusData.timestamp && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              最后活跃时间: {formatTimestamp(statusData.timestamp)}
            </p>
          </div>
        )}
        
        {/* 显示过期详细信息 */}
        {statusData.status === 'expired' && statusData.details && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm mb-2">过期时间: {formatTimestamp(statusData.details.expiresAt)}</p>
            <p className="text-yellow-700 text-sm">当前时间: {formatTimestamp(statusData.details.currentTime)}</p>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="space-y-4">
          {(statusData.status === 'error' || statusData.status === 'expired' || statusData.status === 'unauthorized') && (
            <button
              onClick={handleRefresh}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新尝试
            </button>
          )}
          <button
            onClick={handleBack}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}