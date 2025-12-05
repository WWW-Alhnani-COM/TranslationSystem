// // src/components/https-fixer.tsx
// "use client";

// import { useEffect } from 'react';

// export function HTTPSFixer() {
//   useEffect(() => {
//     // تأكد من أن الصفحة تستخدم HTTPS
//     if (typeof window !== 'undefined') {
//       const forceHTTPS = () => {
//         // إذا كان موقعك على Vercel أو أي hosting يدعم HTTPS
//         if (window.location.protocol === 'http:' && 
//             !window.location.hostname.includes('localhost') &&
//             !window.location.hostname.includes('127.0.0.1')) {
//           window.location.href = window.location.href.replace('http:', 'https:');
//           return;
//         }

//         // تحويل جميع الطلبات من http إلى https
//         const interceptors = {
//           fetch: window.fetch,
//           XMLHttpRequest: window.XMLHttpRequest.prototype.open,
//         };

//         // تعديل fetch
//         window.fetch = function(...args) {
//           const [url, options] = args;
          
//           if (typeof url === 'string' && url.startsWith('http://samali1')) {
//             const httpsUrl = url.replace('http://', 'https://');
//             console.log(`[HTTPSFixer] Fixed URL: ${url} -> ${httpsUrl}`);
//             return interceptors.fetch(httpsUrl, options);
//           }
          
//           return interceptors.fetch(url, options);
//         };

//         // تعديل XMLHttpRequest
//         window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
//           if (typeof url === 'string' && url.startsWith('http://samali1')) {
//             url = url.replace('http://', 'https://');
//             console.log(`[HTTPSFixer] Fixed XMLHttpRequest: ${url}`);
//           }
//           return interceptors.XMLHttpRequest.call(this, method, url, ...args);
//         };
//       };

//       forceHTTPS();
//     }
//   }, []);

//   return null;
// }
