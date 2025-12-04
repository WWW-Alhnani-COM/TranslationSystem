// app/test-proxy/page.tsx
"use client";

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function TestProxyPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProxy = async () => {
    setLoading(true);
    try {
      // اختيار المسار المباشر
      const response = await apiClient.get('/Users');
      setResult({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      // تجربة تسجيل الدخول
      const response = await apiClient.post('/Auth/login', {
        email: 'M@O.ha',
        password: 'test123' // جرب كلمة المرور الصحيحة
      });
      setResult({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">اختبار Proxy System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={testProxy}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'جاري الاختبار...' : 'اختبار الاتصال بالـ Proxy'}
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'جاري التسجيل...' : 'اختبار تسجيل الدخول'}
        </button>
      </div>
      
      {result && (
        <div className="mt-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">نتيجة الاختبار</h2>
          <div className="mb-2">
            <span className="font-medium">الحالة: </span>
            <span className={`px-2 py-1 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.success ? '✅ ناجح' : '❌ فشل'}
            </span>
          </div>
          <div className="mb-2">
            <span className="font-medium">الوقت: </span>
            <span>{result.timestamp}</span>
          </div>
          {result.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <span className="font-medium">الخطأ: </span>
              <span className="text-red-600">{result.error}</span>
            </div>
          )}
          {result.data && (
            <div>
              <h3 className="font-medium mb-2">البيانات:</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
