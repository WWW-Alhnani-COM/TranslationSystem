// src/lib/api-client.ts
import { toast } from "@/components/ui/use-toast";

const API_BASE_URL = "http://samali1-001-site1.stempurl.com/api";

// دالة آمنة للحصول على التوكن (فقط في بيئة المتصفح)
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("token");
  }
  return null;
};

// معالجة الاستجابة من الـ API
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `خطأ في الطلب (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {}
    }
    throw new Error(errorMessage);
  }

  // استجابة فارغة (مثل DELETE)
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();

    // إذا كانت الاستجابة على شكل ApiResponse<T>
    if (typeof data === "object" && data !== null && "success" in data) {
      if (!data.success) {
        throw new Error(data.message || "فشلت العملية");
      }
      return data.data; // نُعيد فقط الحمولة الفعلية
    }

    // إذا كانت استجابة مباشرة (نادر، لكن ممكن في بعض الـ endpoints)
    return data;
  }

  // نص عادي
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
    const url = new URL(`${API_BASE_URL}/${endpoint}`);
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    // ✅ هنا يأتي التعديل الأساسي:
    // لا نستخدم localStorage إلا في بيئة المتصفح
    const token = getToken(); // ← آمن على الخادم والعميل

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
    };

    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url.toString(), options);
    return await handleResponse(response);
  } catch (error: any) {
    console.error(`API Error [${method} ${endpoint}]:`, error);

    // عرض رسالة خطأ للمستخدم (فقط في بيئة المتصفح)
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

// تعريف الـ client
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