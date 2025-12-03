// src/components/layout/AppSidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronRight,
  User,
  LogOut,
  LayoutDashboard,
  Folder,
  FileText,
  Users,
  ClipboardList,
  Bell,
  BarChart3,
  Settings,
  Languages,
  BookOpen,
  CheckSquare,
  Eye,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';

// تعريف أنواع المستخدمين
type UserRole = 'DataEntry' | 'Translator' | 'Reviewer' | 'Supervisor' | 'Manager';

// تعريف أيقونات العناصر
const iconMap: Record<string, React.ComponentType<any>> = {
  dashboard: LayoutDashboard,
  projects: Folder,
  paragraphs: FileText,
  assignments: ClipboardList,
  notifications: Bell,
  reports: BarChart3,
  settings: Settings,
  languages: Languages,
  translations: BookOpen,
  reviews: CheckSquare,
  approvals: Eye,
  team: Users,
  quality: Shield,
};

// تعريف العناصر المتوفرة لكل نوع مستخدم
const getNavItems = (userType: UserRole) => {
  const items: Record<UserRole, { label: string; href: string; icon: string }[]> = {
    DataEntry: [
      { label: 'لوحة التحكم', href: '/data-entry', icon: 'dashboard' },
      { label: 'المشاريع', href: '/data-entry/projects', icon: 'projects' },
      { label: 'المشاريع المعتمدة', href: '/data-entry/approved-projects', icon: 'approved' },
      { label: 'الفقرات', href: '/data-entry/paragraphs', icon: 'paragraphs' },
      { label: 'المهام', href: '/data-entry/assignments', icon: 'assignments' },
      { label: 'الإشعارات', href: '/data-entry/notifications', icon: 'notifications' },
      { label: 'التقارير', href: '/data-entry/reports', icon: 'reports' },
      { label: 'الإعدادات', href: '/data-entry/settings', icon: 'settings' },
    ],
    Translator: [
      { label: 'لوحة التحكم', href: '/translator', icon: 'dashboard' },
      { label: 'مهامي', href: '/translator/assignments', icon: 'assignments' },
      { label: 'المشاريع', href: '/translator/projects', icon: 'projects' },
      { label: 'الترجمات', href: '/translator/translations', icon: 'translations' },
      { label: 'المسودات', href: '/translator/drafts', icon: 'paragraphs' },
      { label: 'الإشعارات', href: '/translator/notifications', icon: 'notifications' },
      { label: 'الإعدادات', href: '/translator/settings', icon: 'settings' },
    ],
    Reviewer: [
      { label: 'لوحة التحكم', href: '/reviewer', icon: 'dashboard' },
      { label: 'المهام', href: '/reviewer/assignments', icon: 'assignments' },
      { label: 'المراجعات', href: '/reviewer/reviews', icon: 'reviews' },
      { label: 'الإشعارات', href: '/reviewer/notifications', icon: 'notifications' },
      { label: 'التقارير', href: '/reviewer/reports', icon: 'reports' },
      { label: 'الإعدادات', href: '/reviewer/settings', icon: 'settings' },
    ],
    Supervisor: [
      { label: 'لوحة التحكم', href: '/supervisor', icon: 'dashboard' },
      { label: 'المشاريع', href: '/supervisor/projects', icon: 'projects' },
      { label: 'الموافقات', href: '/supervisor/approvals', icon: 'approvals' },
      { label: 'الجودة', href: '/supervisor/quality', icon: 'quality' },
      { label: 'الفريق', href: '/supervisor/team', icon: 'team' },
      { label: 'التقارير', href: '/supervisor/reports', icon: 'reports' },
      { label: 'الإعدادات', href: '/supervisor/settings', icon: 'settings' },
    ],
    Manager: [
      { label: 'لوحة التحكم', href: '/manager', icon: 'dashboard' },
      { label: 'المشاريع', href: '/manager/projects', icon: 'projects' },
      { label: 'المهام', href: '/manager/tasks', icon: 'assignments' },
      { label: 'المستخدمون', href: '/manager/users', icon: 'users' },
      { label: 'اللغات', href: '/manager/languages', icon: 'languages' },
      { label: 'التقارير', href: '/manager/reports', icon: 'reports' },
      { label: 'الإعدادات', href: '/manager/settings', icon: 'settings' },
    ],
  };
  return items[userType] || [];
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  if (!user) return null;

  const navItems = getNavItems(user.userType as UserRole);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // دالة للحصول على تسمية نوع المستخدم
  const getUserRoleLabel = (userType: UserRole) => {
    switch (userType) {
      case 'DataEntry': return 'مدخل البيانات';
      case 'Translator': return 'مترجم';
      case 'Reviewer': return 'مراجع';
      case 'Supervisor': return 'مشرف';
      case 'Manager': return 'مدير';
      default: return 'مستخدم';
    }
  };

  return (
    <aside
      className={cn(
        'bg-background border-r border-border h-screen flex flex-col transition-all duration-300 sticky top-0',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* الهيدر */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">نظام الترجمة</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-shrink-0"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </Button>
      </div>

      {/* محتوى القائمة */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon] || Folder;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'text-foreground hover:bg-muted hover:text-foreground',
                  isActive 
                    ? 'bg-primary/10 text-primary border-r-2 border-primary font-medium' 
                    : 'text-muted-foreground',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={cn(
                  'flex-shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className="text-sm flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-primary" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* تذييل القائمة - معلومات المستخدم */}
      <div className="p-3 border-t border-border space-y-2">
        {/* بطاقة المستخدم */}
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg bg-muted/50 transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(`${user.firstName} ${user.lastName}`)}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {getUserRoleLabel(user.userType as UserRole)}
              </p>
              <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        {!isCollapsed && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 text-xs"
              asChild
            >
              <Link href="/data-entry/settings">
                <User className="w-3 h-3" />
                الملف الشخصي
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-destructive hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-3 h-3" />
              تسجيل خروج
            </Button>
          </div>
        )}

        {/* النسخة المصغرة */}
        {isCollapsed && (
          <div className="flex justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              asChild
            >
              <Link href="/data-entry/settings">
                <User className="w-3 h-3" />
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-destructive hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}