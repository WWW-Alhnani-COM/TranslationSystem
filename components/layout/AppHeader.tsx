// src/components/layout/AppHeader.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Settings, User, LogOut, Moon, Sun, Menu, AlertTriangle, RefreshCw, FileText, Folder, ClipboardList, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface AppHeaderProps {
  user: any;
  onMenuToggle?: () => void;
  isSidebarCollapsed?: boolean;
  logout: () => void;
}

export function AppHeader({ user, onMenuToggle, isSidebarCollapsed, logout }: AppHeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // جلب الإشعارات غير المقروءة
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user?.userId) return;
    
    try {
      setNotificationsError(null);
      const response = await fetch(`http://localhost:5296/api/Notifications/user/${user.userId}/unread`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        router.push('/login?session_expired=true');
        return;
      }
      
      if (!response.ok) {
        console.warn(`فشل في تحميل الإشعارات: ${response.status} ${response.statusText}`);
        setNotificationsError(`فشل في تحميل الإشعارات (${response.status})`);
        return;
      }
      
      const data = await response.json();
      if (data?.data && Array.isArray(data.data)) {
        const safeNotifications = data.data.map((notif: any) => ({
          ...notif,
          type: notif.relatedType || 'general'
        }));
        
        setNotifications(safeNotifications);
        setNotificationCount(safeNotifications.length);
      } else {
        setNotifications([]);
        setNotificationCount(0);
      }
    } catch (error: any) {
      console.warn('فشل في تحميل الإشعارات:', error.message || error);
      setNotificationsError('فشل في الاتصال بخادم الإشعارات');
    }
  }, [user?.userId, router]);

  // تحديث الإشعارات كل 30 ثانية
  useEffect(() => {
    if (user?.userId) {
      fetchUnreadNotifications();
      const interval = setInterval(fetchUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.userId, fetchUnreadNotifications]);

  // وضع الوضع الليلي/النهاري
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login?logged_out=true');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/data-entry/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const retryFetchNotifications = () => {
    setNotificationsError(null);
    fetchUnreadNotifications();
  };

  const getUserRoleLabel = (userType: string) => {
    switch (userType) {
      case 'DataEntry': return 'مدخل البيانات';
      case 'Translator': return 'مترجم';
      case 'Reviewer': return 'مراجع';
      case 'Supervisor': return 'مشرف';
      case 'Manager': return 'مدير';
      default: return 'مستخدم';
    }
  };

  // إذا لم يكن هناك مستخدم، لا تعرض الهيدر الأساسي
  if (!user) {
    return (
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>
    );
  }

  const showSettings = user?.userType !== 'Translator';
  const showTeamMenu = user?.userType === 'Supervisor' || user?.userType === 'Manager';

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={onMenuToggle}
          aria-label={isSidebarCollapsed ? "فتح القائمة" : "إغلاق القائمة"}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-foreground">
            {pathname.startsWith('/data-entry/projects') && 'إدارة المشاريع'}
            {pathname.startsWith('/data-entry/assignments') && 'مهام المشروع'}
            {pathname.startsWith('/data-entry/paragraphs') && 'فقرات المشروع'}
            {pathname.startsWith('/data-entry/notifications') && 'الإشعارات'}
            {pathname.startsWith('/data-entry/reports') && 'التقارير'}
            {pathname.startsWith('/data-entry/settings') && 'الإعدادات'}
            {!pathname.startsWith('/data-entry/') && 'لوحة تحكم المُدخل'}
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
            <Input 
              placeholder="البحث في المشاريع..." 
              className="pl-10 pr-4 rtl:pr-10 rtl:pl-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
              {notificationsError && (
                <Badge
                  variant="destructive"
                  className="absolute -bottom-1 -right-1 w-2 h-2 p-0"
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">الإشعارات</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="h-7 px-2 text-xs hover:bg-accent"
                >
                  <Link href="/data-entry/notifications">
                    عرض الكل ({notificationCount})
                  </Link>
                </Button>
              </div>
              
              {notificationsError ? (
                <div className="p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <p className="text-sm text-muted-foreground">{notificationsError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={retryFetchNotifications}
                      className="text-xs mt-2 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      إعادة المحاولة
                    </Button>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  لا توجد إشعارات جديدة
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.notificationId}
                      className="p-3 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => {
                        if(notification.relatedType === 'Project' && notification.relatedId) {
                          router.push(`/data-entry/projects/${notification.relatedId}`);
                        } else {
                          router.push('/data-entry/notifications');
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 rounded-full bg-primary/10 text-primary">
                          {notification.relatedType?.includes('Project') && <Folder className="h-4 w-4" />}
                          {notification.relatedType?.includes('Assignment') && <ClipboardList className="h-4 w-4" />}
                          {notification.relatedType?.includes('Paragraph') && <FileText className="h-4 w-4" />}
                          {!notification.relatedType && <Bell className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.createdAt ?
                              `${new Date(notification.createdAt).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} • ${new Date(notification.createdAt).toLocaleDateString('ar-SA')}` : 
                              'بدون تاريخ'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {showSettings && (
          <Button variant="ghost" size="icon" asChild>
            <Link href="/data-entry/settings">
              <Settings className="w-5 h-5" />
            </Link>
          </Button>
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          aria-label={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 hover:bg-accent/50"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <span className="hidden md:inline text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {getUserRoleLabel(user.userType)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/data-entry/settings" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  <span>الملف الشخصي</span>
                </Link>
              </DropdownMenuItem>
              
              {showTeamMenu && (
                <DropdownMenuItem asChild>
                  <Link href="/data-entry/team" className="flex items-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4" />
                    <span>الفريق</span>
                  </Link>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem asChild>
                <Link href="/data-entry/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  <span>الإعدادات</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}