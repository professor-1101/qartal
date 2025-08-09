"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/ui/date-picker";
import { format } from "date-fns-jalali";
import { Activity, User, FolderOpen, FileText, GitBranch, LogIn, LogOut, Plus, Edit, Trash, Download, Upload, RotateCcw } from "lucide-react";

interface ActivityUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface ActivityProject {
  id: string;
  name: string;
}

interface ActivityFeature {
  id: string;
  name: string;
  project: {
    id: string;
    name: string;
  };
}

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
  user: ActivityUser;
  project?: ActivityProject;
  feature?: ActivityFeature;
}

interface FilterOptions {
  users: ActivityUser[];
  projects: ActivityProject[];
  features: ActivityFeature[];
  activityTypes: string[];
}

export default function AdminActivitiesTable() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [featureFilter, setFeatureFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [exactDate, setExactDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    users: [],
    projects: [],
    features: [],
    activityTypes: [],
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line
  }, [page, pageSize, search, typeFilter, userFilter, projectFilter, featureFilter, dateFilter, exactDate]);

  async function fetchFilterOptions() {
    try {
      const res = await fetch("/api/admin/activities", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFilterOptions(data);
      }
    } catch (e) {
      console.error("خطا در دریافت گزینه‌های فیلتر:", e);
    }
  }

  async function fetchActivities() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: search.trim(),
      });
      
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (userFilter !== "all") params.append("userId", userFilter);
      if (projectFilter !== "all") params.append("projectId", projectFilter);
      if (featureFilter !== "all") params.append("featureId", featureFilter);
      if (dateFilter !== "all") params.append("date", dateFilter);
      if (exactDate) params.append("exactDate", exactDate.toISOString().split('T')[0]);
      
      const res = await fetch(`/api/admin/activities?${params.toString()}`);
      if (!res.ok) throw new Error("خطا در دریافت فعالیت‌ها");
      const data = await res.json();
      setActivities(data.activities);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message || "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleFilterChange(filterType: string, value: string) {
    setPage(1);
    
    switch (filterType) {
      case "type":
        setTypeFilter(value);
        break;
      case "user":
        setUserFilter(value);
        break;
      case "project":
        setProjectFilter(value);
        // اگر پروژه تغییر کرد، فیلتر ویژگی را ریست کن
        if (value !== projectFilter) {
          setFeatureFilter("all");
        }
        break;
      case "feature":
        setFeatureFilter(value);
        break;
      case "date":
        setDateFilter(value);
        if (value !== "exact") {
          setExactDate(undefined);
        }
        break;
    }
  }

  function getActivityIcon(type: string, action: string) {
    switch (type) {
      case "CREATE":
        if (action.includes("project")) return <FolderOpen className="h-4 w-4 text-blue-500" />;
        if (action.includes("feature")) return <FileText className="h-4 w-4 text-green-500" />;
        if (action.includes("scenario")) return <GitBranch className="h-4 w-4 text-purple-500" />;
        if (action.includes("user")) return <User className="h-4 w-4 text-orange-500" />;
        return <Plus className="h-4 w-4 text-blue-500" />;
      case "UPDATE":
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case "DELETE":
        return <Trash className="h-4 w-4 text-red-500" />;
      case "IMPORT":
        return <Upload className="h-4 w-4 text-indigo-500" />;
      case "EXPORT":
        return <Download className="h-4 w-4 text-teal-500" />;
      case "REORDER":
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      case "LOGIN":
        return <LogIn className="h-4 w-4 text-green-600" />;
      case "LOGOUT":
        return <LogOut className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  }

  function getTypeBadge(type: string) {
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
    
    return <Badge variant={colorMap[type] as any || "outline"}>{type}</Badge>;
  }

  function getUserDisplayName(user: ActivityUser) {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  // فیلتر ویژگی‌ها بر اساس پروژه انتخاب شده
  const filteredFeatures = projectFilter === "all" 
    ? filterOptions.features 
    : filterOptions.features.filter(f => f.project.id === projectFilter);

  return (
    <div className="space-y-4">
      {/* فیلترها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        <Input
          placeholder="جستجو در فعالیت‌ها..."
          value={search}
          onChange={handleSearchChange}
          className="md:col-span-2"
        />
        
        <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
          <SelectTrigger className="text-right">
            <SelectValue placeholder="نوع فعالیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه انواع</SelectItem>
            {filterOptions.activityTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={userFilter} onValueChange={(value) => handleFilterChange("user", value)}>
          <SelectTrigger className="text-right">
            <SelectValue placeholder="کاربر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه کاربران</SelectItem>
            {filterOptions.users.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {getUserDisplayName(user)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={(value) => handleFilterChange("project", value)}>
          <SelectTrigger className="text-right">
            <SelectValue placeholder="پروژه" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه پروژه‌ها</SelectItem>
            {filterOptions.projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={featureFilter} onValueChange={(value) => handleFilterChange("feature", value)}>
          <SelectTrigger className="text-right">
            <SelectValue placeholder="ویژگی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه ویژگی‌ها</SelectItem>
            {filteredFeatures.map(feature => (
              <SelectItem key={feature.id} value={feature.id}>
                {feature.name} ({feature.project.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(value) => handleFilterChange("date", value)}>
          <SelectTrigger className="text-right">
            <SelectValue placeholder="بازه زمانی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه تاریخ‌ها</SelectItem>
            <SelectItem value="today">امروز</SelectItem>
            <SelectItem value="week">این هفته</SelectItem>
            <SelectItem value="month">این ماه</SelectItem>
            <SelectItem value="exact">تاریخ دقیق</SelectItem>
          </SelectContent>
        </Select>

        {dateFilter === "exact" && (
          <DatePicker
            date={exactDate}
            onDateChange={(date) => setExactDate(date || undefined)}
            placeholder="انتخاب تاریخ"
          />
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نوع</TableHead>
              <TableHead>توضیحات</TableHead>
              <TableHead>کاربر</TableHead>
              <TableHead>پروژه</TableHead>
              <TableHead>ویژگی</TableHead>
              <TableHead>زمان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">در حال بارگذاری...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-destructive">{error}</TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">فعالیتی یافت نشد</TableCell>
              </TableRow>
            ) : (
              activities.map(activity => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type, activity.action)}
                      {getTypeBadge(activity.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <div className="font-medium text-sm">{activity.description}</div>
                      {activity.metadata && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(activity.metadata, null, 0).substring(0, 100)}
                          {JSON.stringify(activity.metadata).length > 100 && "..."}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{getUserDisplayName(activity.user)}</div>
                      <div className="text-xs text-muted-foreground">{activity.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.project ? (
                      <div className="text-sm font-medium">{activity.project.name}</div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {activity.feature ? (
                      <div className="text-sm font-medium">{activity.feature.name}</div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(activity.createdAt), "yyyy/MM/dd HH:mm:ss")}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, total)} از {total} فعالیت
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1 || loading}
            variant="outline"
          >
            صفحه قبل
          </Button>
          <span className="text-sm">
            صفحه {page} از {Math.ceil(total / pageSize)}
          </span>
          <Button 
            size="sm" 
            onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))} 
            disabled={page * pageSize >= total || loading}
            variant="outline"
          >
            صفحه بعد
          </Button>
        </div>
      </div>
    </div>
  );
}