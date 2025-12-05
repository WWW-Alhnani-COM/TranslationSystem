// src/lib/api-client.ts
import { toast } from "@/components/ui/use-toast";

// استخدم Proxy على Vercel
const API_BASE_URL = 'https://samali1-001-site1.stempurl.com/api';
// دالة للحصول على التوكن
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("token");
  }
  return null;
};

// معالجة الاستجابة
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `خطأ في الطلب (${response.status})`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {}
    }
    
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?session_expired=true';
    }
    
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    
    if (typeof data === "object" && data !== null && "success" in data) {
      if (!data.success) {
        throw new Error(data.message || "فشلت العملية");
      }
      return data.data;
    }
    
    return data;
  }

  return await response.text();
};

// تنفيذ الطلب
const apiRequest = async (
  endpoint: string,
  method: string,
  data?: any,
  params?: Record<string, any>
) => {
  try {
    // تنظيف الـ endpoint
    endpoint = endpoint.replace(/^\/+/, '');
    
    // بناء URL
    const url = new URL(`${API_BASE_URL}/${endpoint}`, window.location.origin);
    
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
    }
    
    const token = getToken();
    
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      credentials: 'include', // مهم لـ CORS مع cookies
    };

    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }

    console.log(`API Request: ${method} ${url.toString()}`);
    
    const response = await fetch(url.toString(), options);
    return await handleResponse(response);
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);

    if (typeof window !== 'undefined') {
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: error.message || "تعذر الاتصال بالخادم",
      });
    }

    throw error;
  }
};

export const apiClient = {
  get: (endpoint: string, params?: Record<string, any>) =>
    apiRequest(endpoint, "GET", undefined, params),

  post: (endpoint: string, data?: any) =>
    apiRequest(endpoint, "POST", data),

  put: (endpoint: string, data?: any) =>
    apiRequest(endpoint, "PUT", data),

  delete: (endpoint: string, params?: Record<string, any>) =>
    apiRequest(endpoint, "DELETE", undefined, params),

  patch: (endpoint: string, data?: any) =>
    apiRequest(endpoint, "PATCH", data),
};

export default apiClient;
