import { UserResponseDto } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { cookies } from "next/dist/server/request/cookies";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getSupervisorId(): Promise<number> {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    throw new Error('غير مُصادق عليه');
  }

  try {
    const response = await fetch('http://samali1-001-site1.stempurl.com/api/Users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
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