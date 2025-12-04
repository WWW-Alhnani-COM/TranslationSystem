// app/api/[[...slug]]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'http://samali1-001-site1.stempurl.com/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  return handleProxy(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  return handleProxy(request, await params);
}

async function handleProxy(
  request: NextRequest,
  params: { slug?: string[] }
) {
  const path = params.slug?.join('/') || '';
  const url = `${API_BASE}/${path}${request.nextUrl.search}`;
  
  console.log(`Proxying to: ${url}`);
  
  try {
    // إعداد headers
    const headers = new Headers();
    
    // إضافة headers الأساسية
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    // نسخ headers من الطلب الأصلي
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
    
    // جلب body
    let body: string | null = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      body = await request.text();
    }
    
    // إرسال الطلب
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      // ⚠️ مهم: no-cors mode للتغلب على Mixed Content
      mode: 'no-cors',
    });
    
    // محاولة قراءة الاستجابة
    let responseData;
    try {
      responseData = await response.text();
      try {
        responseData = JSON.parse(responseData);
      } catch {
        // يبقى كنص
      }
    } catch {
      responseData = null;
    }
    
    // إرجاع الاستجابة مع CORS headers
    return new NextResponse(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      {
        status: response.status || 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
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
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
