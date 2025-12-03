// components/layout/SidebarNavItems.tsx

import { 
  Home, 
  FileText, 
  Languages, 
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';

/**
 * Returns navigation menu items based on user type.
 * Items are organized with titles, hrefs, icons, and optional subitems.
 * 
 * @param {string} userType - The type of user (e.g., 'Translator', 'DataEntry')
 * @returns {Array} Array of menu items
 */
export function getMenuItems(userType: string) {
  switch (userType) {
    case 'Translator':
      return [
        { title: 'لوحة التحكم', href: '/translator', icon: Home },
        { title: 'المهام الموكلة', href: '/translator/assignments', icon: FileText },
        { title: 'المسودات', href: '/translator/drafts', icon: Clock },
        { title: 'الترجمات', href: '/translator/translations', icon: Languages },
        { title: 'الإعدادات', href: '/translator/settings', icon: Settings },
      ];
    case 'DataEntry':
      return [
        { title: 'لوحة التحكم', href: '/data-entry', icon: Home },
        { title: 'المشاريع', href: '/data-entry/projects', icon: FileText },
        { title: 'الفقرات', href: '/data-entry/all-paragraphs', icon: Languages },
        { title: 'التعيينات', href: '/data-entry/assignments', icon: CheckCircle },
        { title: 'التقارير', href: '/data-entry/reports', icon: AlertCircle },
      ];
    case 'Reviewer':
      return [
        { title: 'لوحة التحكم', href: '/reviewer', icon: Home },
        { title: 'المراجعات', href: '/reviewer/reviews', icon: FileText },
        { title: 'التعيينات', href: '/reviewer/assignments', icon: CheckCircle },
        { title: 'التقارير', href: '/reviewer/reports', icon: AlertCircle },
      ];
    case 'Supervisor':
      return [
        { title: 'لوحة التحكم', href: '/supervisor', icon: Home },
        { title: 'الاعتمادات', href: '/supervisor/approvals', icon: FileText },
        { title: 'المشاريع', href: '/supervisor/projects', icon: CheckCircle },
        { title: 'الجودة', href: '/supervisor/quality', icon: AlertCircle },
        { title: 'الفريق', href: '/supervisor/team', icon: Users },
      ];
    case 'Manager':
      return [
        { title: 'لوحة التحكم', href: '/manager', icon: Home },
        { title: 'المستخدمين', href: '/manager/users', icon: Users },
        { title: 'المشاريع', href: '/manager/projects', icon: CheckCircle },
        { title: 'اللغات', href: '/manager/languages', icon: Languages },
        { title: 'التقارير', href: '/manager/reports', icon: AlertCircle },
      ];
    default:
      return [];
  }
}