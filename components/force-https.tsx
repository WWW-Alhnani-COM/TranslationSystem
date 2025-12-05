// // src/components/force-https.tsx
// "use client";

// import { useEffect } from 'react';

// export function ForceHTTPS() {
//   useEffect(() => {
//     // 1. تأكد من أن الصفحة تستخدم HTTPS
//     if (window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
//       window.location.href = window.location.href.replace('http:', 'https:');
//     }

//     // 2. أعد كتابة جميع طلبات fetch التي تستخدم http
//     const originalFetch = window.fetch;
    
//     window.fetch = function(...args) {
//       const [url, options] = args;
      
//       // إذا كان الرابط نصياً ويبدأ بـ http://
//       if (typeof url === 'string' && url.startsWith('http://')) {
//         const httpsUrl = url.replace('http://', 'https://');
//         console.warn(`[ForceHTTPS] Rewriting ${url} to ${httpsUrl}`);
//         return originalFetch(httpsUrl, options);
//       }
      
//       // إذا كان Request object
//       if (url instanceof Request && url.url.startsWith('http://')) {
//         const httpsUrl = url.url.replace('http://', 'https://');
//         const newRequest = new Request(httpsUrl, url);
//         console.warn(`[ForceHTTPS] Rewriting Request from ${url.url} to ${httpsUrl}`);
//         return originalFetch(newRequest, options);
//       }
      
//       return originalFetch(url, options);
//     };

//     // 3. تحويل جميع الروابط في DOM
//     const convertLinksToHTTPS = () => {
//       document.querySelectorAll('a[href^="http://"]').forEach(link => {
//         const href = link.getAttribute('href');
//         if (href && href.startsWith('http://samali1')) {
//           link.setAttribute('href', href.replace('http://', 'https://'));
//         }
//       });
//     };

//     // 4. مراقبة DOM للتغييرات
//     const observer = new MutationObserver(convertLinksToHTTPS);
//     observer.observe(document.body, {
//       childList: true,
//       subtree: true,
//     });

//     // 5. تشغيل التحويل فوراً
//     convertLinksToHTTPS();

//     return () => {
//       window.fetch = originalFetch;
//       observer.disconnect();
//     };
//   }, []);

//   return null;
// }
