// app/ssl-status/page.tsx
"use client";

import { useState, useEffect } from 'react';

export default function SSLStatusPage() {
  const [sslStatus, setSslStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSSLStatus();
  }, []);

  const checkSSLStatus = async () => {
    setLoading(true);
    
    try {
      // اختبار HTTPS
      const httpsTest = await fetch('https://samali1-001-site1.stempurl.com/api/Users', {
        method: 'GET',
        mode: 'no-cors',
      }).then(() => '✅ يعمل').catch(() => '❌ لا يعمل');
      
      // اختبار HTTP
      const httpTest = await fetch('http://samali1-001-site1.stempurl.com/api/Users', {
        method: 'GET',
        mode: 'no-cors',
      }).then(() => '✅ يعمل').catch(() => '❌ لا يعمل');
      
      setSslStatus({
        https: httpsTest,
        http: httpTest,
        timestamp: new Date().toISOString(),
        message: 'SSL قيد التفعيل. قد يستغرق بضع ساعات.'
      });
    } catch (error: any) {
      setSslStatus({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">حالة شهادة SSL</h1>
          <p className="text-gray-600 mb-8">نظام إدارة الترجمة - تحديثات فورية</p>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">جاري فحص حالة SSL...</p>
            </div>
          ) : sslStatus?.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">❌ خطأ في الفحص</h2>
              <p className="text-red-600">{sslStatus.error}</p>
            </div>
          ) : (
            <>
              {/* بطاقة حالة SSL */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-blue-800">samali1-001-site1.stempurl.com</h2>
                    <p className="text-blue-600 text-sm mt-1">طلب SSL: 12-03-2025</p>
                  </div>
                  <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                    ⏳ قيد المعالجة
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border">
                    <h3 className="font-medium text-gray-700 mb-2">اتصال HTTPS</h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      sslStatus?.https?.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sslStatus?.https || 'جارٍ الفحص...'}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      https://samali1-001-site1.stempurl.com
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <h3 className="font-medium text-gray-700 mb-2">اتصال HTTP</h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      sslStatus?.http?.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sslStatus?.http || 'جارٍ الفحص...'}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      http://samali1-001-site1.stempurl.com
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">معلومات مهمة</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>شهادة SSL قيد المعالجة وتحتاج 1-2 ساعة إضافية</li>
                          <li>التطبيق يستخدم حلول مؤقتة للاتصال</li>
                          <li>جميع البيانات آمنة ومشفرة على Vercel</li>
                          <li>بعد تفعيل SSL، سيكون الاتصال 100% آمن</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* تعليمات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">💡 ماذا يحدث الآن؟</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="inline-block w-6">1.</span>
                      <span>شهادة SSL طلبت من Let's Encrypt</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-6">2.</span>
                      <span>جاري التحقق من ملكية النطاق</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-6">3.</span>
                      <span>سيتم التثبيت تلقائياً خلال ساعات</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">🔧 الحلول المؤقتة</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• التطبيق يستخدم Proxy آمن</li>
                    <li>• جميع الاتصالات مشفرة على Vercel</li>
                    <li>• يمكن استخدام التطبيق بشكل كامل</li>
                    <li>• سيتم الترقية التلقائية عند توفر SSL</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={checkSSLStatus}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🔄 تحديث الحالة
                </button>
                
                <a
                  href="/login"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
                >
                  🔐 تسجيل الدخول
                </a>
                
                <a
                  href="https://translation-system-r9y7.vercel.app/"
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
                >
                  🏠 الصفحة الرئيسية
                </a>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>آخر تحديث: {new Date(sslStatus?.timestamp).toLocaleString('ar-SA')}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
