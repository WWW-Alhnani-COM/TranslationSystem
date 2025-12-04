// app/api/[[...route]]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://samali1-001-site1.stempurl.com/api';

export async function GET(
  request: NextRequest,
  context: { params: { route: string[] } }
) {
  return handleProxy(request, context.params.route);
}

export async function POST(
  request: NextRequest,
  context: { params: { route: string[] } }
) {
  return handleProxy(request, context.params.route);
}

export async function PUT(
  request: NextRequest,
  context: { params: { route: string[] } }
) {
  return handleProxy(request, context.params.route);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { route: string[] } }
) {
  return handleProxy(request, context.params.route);
}

export async function PATCH(
  request: NextRequest,
  context: { params: { route: string[] } }
) {
  return handleProxy(request, context.params.route);
}

async function handleProxy(request: NextRequest, routeSegments: string[] = []) {
  const path = routeSegments.join('/');
  const targetUrl = `${API_BASE_URL}/${path}${request.nextUrl.search}`;
  
  console.log(`Proxying: ${request.method} ${targetUrl}`);
  
  try {
    // إعداد headers للطلب
    const headers = new Headers();
    
    // نسخ headers من الطلب الأصلي (باستثناء بعض headers)
    request.headers.forEach((value, key) => {
      // لا ننسخ هذه headers لأنها خاصة بالمتصفح
      if (![
        'host',
        'origin',
        'referer',
        'user-agent',
        'accept-encoding',
        'connection'
      ].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    
    // إضافة Content-Type إذا لم يكن موجودًا
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // إضافة Accept إذا لم يكن موجودًا
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    
    // جلب body إذا كان موجودًا
    let body: any = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        body = await request.text();
      } catch {
        body = null;
      }
    }
    
    // إجراء الطلب إلى الـ Backend
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // إعادة التوجيه
      redirect: 'follow',
    });
    
    // نسخ headers من الاستجابة
    const responseHeaders = new Headers(response.headers);
    
    // إضافة CORS headers للسماح للـ Frontend بالوصول
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // الحصول على body من الاستجابة
    let responseBody;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      responseBody = await response.json();
    } else if (contentType?.includes('text/')) {
      responseBody = await response.text();
    } else {
      responseBody = await response.blob();
    }
    
    return new NextResponse(
      typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      }
    );
    
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'فشل في الاتصال بالخادم الخلفي',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// معالجة طلبات OPTIONS لـ CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
