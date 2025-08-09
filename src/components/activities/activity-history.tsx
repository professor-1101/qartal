'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import JalaliDatePicker from "@/components/ui/date-picker";

import {
  Activity,
  FileText,
  Layers,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  ArrowUpDown,
  Clock,
  User,
  Search,
} from 'lucide-react';
import { useI18n } from '@/i18n';

interface ActivityItem {
  id: string;
  type:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'IMPORT'
    | 'EXPORT'
    | 'REORDER'
    | 'LOGIN'
    | 'LOGOUT';
  action: string;
  description: string;
  metadata: any;
  createdAt: string;
  project?: { name: string };
  feature?: { name: string };
}

interface ActivityHistoryProps {
  projectId?: string;
  featureId?: string;
  title?: string;
  className?: string;
}

// یکپارچه‌سازی با AdminActivitiesTable
const getActivityIcon = (type: string, action: string) => {
  switch (type) {
    case "CREATE":
      if (action.includes("project")) return <FileText className="h-4 w-4 text-blue-500" />;
      if (action.includes("feature")) return <Layers className="h-4 w-4 text-green-500" />;
      if (action.includes("scenario")) return <Layers className="h-4 w-4 text-purple-500" />;
      if (action.includes("user")) return <User className="h-4 w-4 text-orange-500" />;
      return <Plus className="h-4 w-4 text-blue-500" />;
    case "UPDATE":
      return <Edit className="h-4 w-4 text-yellow-500" />;
    case "DELETE":
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case "IMPORT":
      return <Upload className="h-4 w-4 text-indigo-500" />;
    case "EXPORT":
      return <Download className="h-4 w-4 text-teal-500" />;
    case "REORDER":
      return <ArrowUpDown className="h-4 w-4 text-gray-500" />;
    case "LOGIN":
      return <User className="h-4 w-4 text-green-600" />;
    case "LOGOUT":
      return <User className="h-4 w-4 text-red-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getTypeBadge = (type: string) => {
  const colorMap: Record<string, string> = {
    CREATE: "default",
    UPDATE: "secondary", 
    DELETE: "destructive",
    IMPORT: "outline",
    EXPORT: "outline",
    REORDER: "secondary",
    LOGIN: "default",
    LOGOUT: "outline",
  };
  
  return colorMap[type] || "outline";
};

export function ActivityHistory({
  projectId,
  title,
  className,
}: ActivityHistoryProps) {
  const { t } = useI18n();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // تابع بهبود یافته برای ترجمه با fallback
  const translate = (key: string, fallback: string) => {
    const translation = t(key);
    if (!translation || translation === key) {
      console.warn(`Translation missing for key: "${key}"`);
      return fallback;
    }
    return translation;
  };

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);

      // آماده‌سازی پارامترها
      const paramsObj: Record<string, string> = {
        page: page.toString(),
        limit: '10',
      };
      if (filterType !== 'ALL') paramsObj.type = filterType;
      if (searchTerm) paramsObj.search = searchTerm;
      if (filterDate && filterDate !== 'all' && filterDate !== 'exact')
        paramsObj.date = filterDate;
      if (filterDate === 'exact' && selectedDate)
        paramsObj.exactDate = selectedDate.toISOString().split('T')[0];

      const params = new URLSearchParams(paramsObj);

      const url = projectId
        ? `/api/projects/${projectId}/activities?${params}`
        : `/api/activities?${params}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched activities:', data);
        setActivities(data.activities || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error('خطا در دریافت با وضعیت:', response.status);
        setActivities([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('خطا در دریافت فعالیت‌ها:', error);
      setActivities([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, searchTerm, filterDate, selectedDate, projectId]);

  // واکنش به تغییرات فیلترها یا صفحه
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const formatDate = (dateString: string) => {  
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return 'کمتر از یک ساعت پیش';
    } else if (diffInHours < 24) {
      return `${diffInHours} ساعت پیش`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} روز پیش`;
      } else {
        return date.toLocaleDateString('fa-IR');
      }
    }
  };

  // حذف شد - توابع جابجا شدند به بالا

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title || translate('activities.title', 'تاریخچه فعالیت‌ها')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={translate('activities.searchPlaceholder', 'جستجو در فعالیت‌ها...')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10 w-64"
              />
            </div>

            <Select
              value={filterType}
              onValueChange={(value) => {
                setFilterType(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40 text-right">
                <SelectValue 
                  placeholder={translate('activities.filterTypeLabel', 'فیلتر بر اساس نوع')} 
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {translate('activities.filterTypes.all', 'همه')}
                </SelectItem>
                <SelectItem value="CREATE">
                  {translate('activities.filterTypes.create', 'ایجاد')}
                </SelectItem>
                <SelectItem value="UPDATE">
                  {translate('activities.filterTypes.update', 'به‌روزرسانی')}
                </SelectItem>
                <SelectItem value="DELETE">
                  {translate('activities.filterTypes.delete', 'حذف')}
                </SelectItem>
                <SelectItem value="IMPORT">
                  {translate('activities.filterTypes.import', 'وارد کردن')}
                </SelectItem>
                <SelectItem value="EXPORT">
                  {translate('activities.filterTypes.export', 'خارج کردن')}
                </SelectItem>
                <SelectItem value="REORDER">
                  {translate('activities.filterTypes.reorder', 'مرتب‌سازی مجدد')}
                </SelectItem>
                <SelectItem value="LOGIN">
                  {translate('activities.filterTypes.login', 'ورود')}
                </SelectItem>
                <SelectItem value="LOGOUT">
                  {translate('activities.filterTypes.logout', 'خروج')}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterDate}
              onValueChange={(value) => {
                setFilterDate(value);
                setPage(1);
                if (value !== 'exact') setSelectedDate(undefined);
              }}
            >
              <SelectTrigger className="w-40 text-right">
                <SelectValue 
                  placeholder={translate('activities.filterDateLabel', 'فیلتر بر اساس تاریخ')} 
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {translate('activities.dateFilters.all', 'همه تاریخ‌ها')}
                </SelectItem>
                <SelectItem value="today">
                  {translate('activities.dateFilters.today', 'امروز')}
                </SelectItem>
                <SelectItem value="week">
                  {translate('activities.dateFilters.week', 'این هفته')}
                </SelectItem>
                <SelectItem value="month">
                  {translate('activities.dateFilters.month', 'این ماه')}
                </SelectItem>
                <SelectItem value="exact">
                  {translate('activities.dateFilters.exact', 'تاریخ دقیق')}
                </SelectItem>
              </SelectContent>
            </Select>

            {filterDate === 'exact' && (
  <JalaliDatePicker
    date={selectedDate}
    onDateChange={(date) => {
      setSelectedDate(date || undefined);
      setPage(1);
    }}
    placeholder={translate('activities.selectExactDate', 'انتخاب تاریخ دقیق')}
    className="w-40"
  />
)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{translate('activities.noActivities', 'فعالیتی یافت نشد')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-background border">
                    {getActivityIcon(activity.type, activity.action)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getTypeBadge(activity.type) as any}>
                      {translate(
                        `activities.activityTypes.${activity.type}`,
                        activity.type
                      )}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">{activity.description}</p>
                  {(activity.project || activity.feature) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.project && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {activity.project.name}
                        </span>
                      )}
                      {activity.feature && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {activity.feature.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {translate('activities.previous', 'قبلی')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {translate('activities.pageInfo', 'صفحه {current} از {total}')
                    .replace('{current}', page.toString())
                    .replace('{total}', totalPages.toString())}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {translate('activities.next', 'بعدی')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}