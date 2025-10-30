'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">出现错误</h1>
        <p className="text-gray-600 mb-6">
          抱歉，页面遇到了意外错误。请尝试刷新页面或联系技术支持。
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            重试
          </button>
          <a
            href="/"
            className="w-full block border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
          >
            返回首页
          </a>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-500 mt-4">
            错误代码: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}