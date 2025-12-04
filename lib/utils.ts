import { UserResponseDto } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { cookies } from "next/dist/server/request/cookies";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getSupervisorId(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    throw new Error('غير مُصادق عليه');
  }

  try {
    // ⬅️ تغيير من http إلى https
    const response = await fetch('https://samali1-001-site1.stempurl.com/api/Users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // معالجة خطأ 401 (غير مصرح)
      if (response.status === 401) {
        throw new Error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في التحقق من المستخدم');
    }

    const user: UserResponseDto = await response.json();

    if (user.userType !== 'Supervisor') {
      throw new Error('غير مصرح به - ليس مشرفًا');
    }

    return user.userId;
  } catch (error) {
    console.error("Error in getSupervisorId:", error);
    throw error;
  }
}

// دالة جديدة للتحقق من حالة المستخدم
export async function getCurrentUser(): Promise<UserResponseDto | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const response = await fetch('https://samali1-001-site1.stempurl.com/api/Users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
