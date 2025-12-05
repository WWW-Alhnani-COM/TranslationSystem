// src/lib/fix-http.ts
/**
 * هذه الدالة تعمل كـ polyfill لتحويل جميع http:// إلى https://
 */
export function fixHTTPInCode() {
  if (typeof window === 'undefined') return;

  // تخطي إذا كان localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }

  // 1. إصلاح fetch
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('http://')) {
      input = input.replace('http://', 'https://');
      console.log('[fixHTTP] Fixed fetch URL');
    }
    return originalFetch(input, init);
  };

  // 2. إصلاح XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string, async?: boolean, user?: string, password?: string) {
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
      console.log('[fixHTTP] Fixed XMLHttpRequest URL');
    }
    return originalXHROpen.call(this, method, url, !!async, user, password);
  };

  // 3. إصلاح EventSource (إذا كنت تستخدم SSE)
  const originalEventSource = window.EventSource;
  window.EventSource = class PatchedEventSource extends EventSource {
    constructor(url: string, eventSourceInitDict?: EventSourceInit) {
      if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
        console.log('[fixHTTP] Fixed EventSource URL');
      }
      super(url, eventSourceInitDict);
    }
  };
}

// تشغيل الإصلاح فوراً
if (typeof window !== 'undefined') {
  fixHTTPInCode();
}
