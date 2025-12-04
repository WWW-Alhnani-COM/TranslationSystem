// app/api/[[...route]]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://samali1-001-site1.stempurl.com/api';

// تعريف أنواع لـ params
interface RouteParams {
  route?: string[];
}

// GET مع params كـ Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.route || []);
}

// POST مع params كـ Promise
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.route || []);
}

// PUT مع params كـ Promise
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.route || []);
}

// DELETE مع params كـ Promise
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.route || []);
}

// PATCH مع params كـ Promise
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const resolvedParams = await params;
  return handleProxy(request, resolvedParams.route || []);
}

// OPTIONS لـ CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// دالة Proxy الرئيسية
async function handleProxy(request: NextRequest, routeSegments: string[]) {
  const path = routeSegments.join('/');
  const targetUrl = `${API_BASE_URL}/${path}${request.nextUrl.search}`;
  
  console.log(`Proxying: ${request.method} ${targetUrl}`);
  
  try {
    // إعداد headers للطلب
    const headers = new Headers();
    
    // نسخ headers من الطلب الأصلي
    request.headers.forEach((value, key) => {
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
    
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    
    // جلب body إذا كان موجودًا
    let body: any = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      body = await request.text();
    }
    
    // إجراء الطلب إلى الـ Backend
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'follow',
    });
    
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
    
    // إعداد CORS headers للاستجابة
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': contentType || 'application/json',
    });
    
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
