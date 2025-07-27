'use client';

import React, { useState, useEffect } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker';
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

const activityIcons = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  IMPORT: Upload,
  EXPORT: Download,
  REORDER: ArrowUpDown,
  LOGIN: User,
  LOGOUT: User,
};

const activityColors = {
  CREATE: 'bg-green-100 text-green-800 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  IMPORT: 'bg-purple-100 text-purple-800 border-purple-200',
  EXPORT: 'bg-orange-100 text-orange-800 border-orange-200',
  REORDER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOGIN: 'bg-gray-100 text-gray-800 border-gray-200',
  LOGOUT: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Remove hardcoded labels - will use translations instead

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

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filterType !== 'ALL' && { type: filterType }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterDate && filterDate !== 'all' && { date: filterDate }),
        ...(selectedDate && { exactDate: selectedDate.toISOString().split('T')[0] }),
      });

      const url = projectId
        ? `/api/projects/${projectId}/activities?${params}`
        : `/api/activities?${params}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, filterType, searchTerm, filterDate, selectedDate, projectId]);

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

  const getActivityIcon = (type: string) => {
    const IconComponent =
      activityIcons[type as keyof typeof activityIcons] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const getActivityColor = (type: string) => {
    return (
      activityColors[type as keyof typeof activityColors] ||
      'bg-gray-100 text-gray-800 border-gray-200'
    );
  };

  const getActivityLabel = (type: string) => {
    return t(`activities.activityTypes.${type}`) || type;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title || t('activities.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('activities.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('activities.filterType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('activities.filterAll')}</SelectItem>
                <SelectItem value="CREATE">{t('activities.filterCreate')}</SelectItem>
                <SelectItem value="UPDATE">{t('activities.filterUpdate')}</SelectItem>
                <SelectItem value="DELETE">{t('activities.filterDelete')}</SelectItem>
                <SelectItem value="IMPORT">{t('activities.filterImport')}</SelectItem>
                <SelectItem value="EXPORT">{t('activities.filterExport')}</SelectItem>
                <SelectItem value="REORDER">{t('activities.filterReorder')}</SelectItem>
                <SelectItem value="LOGIN">{t('activities.filterLogin')}</SelectItem>
                <SelectItem value="LOGOUT">{t('activities.filterLogout')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDate} onValueChange={(value) => {
              setFilterDate(value);
              if (value !== 'exact') {
                setSelectedDate(undefined);
              }
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('activities.filterDate')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('activities.filterAll')}</SelectItem>
                <SelectItem value="today">{t('activities.filterToday')}</SelectItem>
                <SelectItem value="week">{t('activities.filterThisWeek')}</SelectItem>
                <SelectItem value="month">{t('activities.filterThisMonth')}</SelectItem>
                <SelectItem value="exact">{t('activities.filterExactDate')}</SelectItem>
              </SelectContent>
            </Select>
            {filterDate === 'exact' && (
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                placeholder={t('activities.selectExactDate')}
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
            <p>{t('activities.noActivities')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`p-2 rounded-full ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={getActivityColor(activity.type)}
                    >
                      {getActivityLabel(activity.type)}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {activity.description}
                  </p>
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
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {t('activities.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('activities.pageInfo').replace('{current}', page.toString()).replace('{total}', totalPages.toString())}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  {t('activities.next')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
