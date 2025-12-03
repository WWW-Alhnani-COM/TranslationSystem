'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Languages, Plus, Search, Filter, ChevronDown, ChevronUp, CheckCircle, Ban } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Interfaces based on API documentation ---
interface Language {
  languageId: number;
  name: string;
  code: string;
  isActive: boolean;
  direction?: 'LTR' | 'RTL';
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

const getStatusBadgeVariant = (isActive: boolean) => {
  return isActive ? 'default' : 'destructive';
};

const getStatusIcon = (isActive: boolean) => {
  return isActive ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />;
};

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'code' | 'isActive'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('http://samali1-001-site1.stempurl.com/api/Languages');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const languagesResult: ApiResponse<Language[]> = await response.json();
        if (languagesResult.success && languagesResult.data) {
          setLanguages(languagesResult.data);
          setFilteredLanguages(languagesResult.data);
        } else {
          throw new Error(languagesResult.message || 'Failed to fetch languages.');
        }
      } catch (err: any) {
        console.error('Error fetching languages:', err);
        setError(err.message || 'An unexpected error occurred while fetching languages.');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // Apply filters and sorting whenever filters or languages change
  useEffect(() => {
    let result = [...languages];

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(language => language.isActive === isActive);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(language => 
        language.name.toLowerCase().includes(query) ||
        language.code.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortField === 'code') {
        const codeA = a.code.toLowerCase();
        const codeB = b.code.toLowerCase();
        return sortDirection === 'asc' ? codeA.localeCompare(codeB) : codeB.localeCompare(codeA);
      } else if (sortField === 'isActive') {
        return sortDirection === 'asc' ? (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0) : (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
      }
      return 0;
    });

    setFilteredLanguages(result);
  }, [languages, statusFilter, searchQuery, sortField, sortDirection]);

  const toggleLanguageStatus = async (languageId: number, isActive: boolean) => {
    try {
      const response = await fetch(`http://samali1-001-site1.stempurl.com/api/Languages/${languageId}/${isActive ? 'deactivate' : 'activate'}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'خطأ في الخادم' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Update local state
      setLanguages(prev => 
        prev.map(lang => 
          lang.languageId === languageId ? { ...lang, isActive: !isActive } : lang
        )
      );

      // Update filtered list as well
      setFilteredLanguages(prev => 
        prev.map(lang => 
          lang.languageId === languageId ? { ...lang, isActive: !isActive } : lang
        )
      );
    } catch (err: any) {
      console.error('Error toggling language status:', err);
      setError(err.message || 'حدث خطأ أثناء تغيير حالة اللغة.');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">إدارة اللغات</h1>
        <p className="text-muted-foreground">
          إدارة اللغات المدعومة في النظام.
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية وبحث
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="بحث في أسماء اللغات أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Languages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>قائمة اللغات</span>
            <Button asChild variant="default">
              <Link href="/dashboard/manager/languages/new">
                <Plus className="w-4 h-4 mr-2" />
                إضافة لغة جديدة
              </Link>
            </Button>
          </CardTitle>
          <CardDescription>
            اللغات المدعومة في نظام الترجمة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, idx) => (
                <Skeleton key={idx} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLanguages.length === 0 ? (
            <div className="text-center py-8">
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لا توجد لغات تطابق الفلاتر المختارة.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اللغة</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>الاتجاه</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLanguages.map((language) => (
                  <TableRow key={language.languageId}>
                    <TableCell className="font-medium">{language.name}</TableCell>
                    <TableCell>{language.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {language.direction === 'RTL' ? 'من اليمين إلى اليسار' : 'من اليسار إلى اليمين'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(language.isActive)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(language.isActive)}
                          {language.isActive ? 'نشط' : 'غير نشط'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleLanguageStatus(language.languageId, language.isActive)}
                        >
                          {language.isActive ? 'تعطيل' : 'تفعيل'}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/manager/languages/${language.languageId}`}>
                            تعديل
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}