"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns-jalali";
import { Eye, AlertCircle, FileText } from "lucide-react";
import { generateShortCode } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  slang: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  featuresCount: number;
  totalSteps: number;
  totalScenarios: number;
}

export default function AdminProjectsTable() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, [page, pageSize, search, statusFilter]);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/projects?${searchParams}`);
      if (!response.ok) {
        throw new Error(`خطای HTTP! وضعیت: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data.projects);
      setTotal(data.total);
    } catch (error) {
      console.error("خطا در دریافت پروژه‌ها:", error);
      setError("خطا در دریافت پروژه‌ها");
    } finally {
      setLoading(false);
    }
  }

  function getUserDisplayName(user: Project['user']) {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "فعال", variant: "default" },
      inactive: { label: "غیرفعال", variant: "secondary" },
      archived: { label: "آرشیو", variant: "outline" },
      deleted: { label: "حذف شده", variant: "destructive" }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-4" dir="rtl">
          <Input
            placeholder="جستجو در پروژه‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 text-right"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 text-right">
              <SelectValue placeholder="فیلتر وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="locked">قفل شده</SelectItem>
              <SelectItem value="pending">دارای نسخه در انتظار تایید</SelectItem>
              <SelectItem value="approved">دارای نسخه تایید شده</SelectItem>
              <SelectItem value="rejected">دارای نسخه رد شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">هیچ پروژه‌ای یافت نشد</p>
          </div>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام پروژه</TableHead>
                  <TableHead className="text-right">مالک</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">تاریخ ایجاد</TableHead>
                  <TableHead className="text-right">آمار</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium text-right">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground">{project.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {getUserDisplayName(project.user)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(project.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {format(new Date(project.createdAt), "yyyy/MM/dd")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        <div>ویژگی‌ها: {project.featuresCount}</div>
                        <div>سناریوها: {project.totalScenarios}</div>
                        <div>مراحل: {project.totalSteps}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => window.open(`/s/${generateShortCode(project.id)}`, '_blank')}
                          className="text-xs px-3 py-2 h-8"
                        >
                          <Eye className="h-3 w-3 ml-1" />
                          نمایش پروژه
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, total)} از {total} پروژه
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                قبلی
              </Button>
              <span className="text-sm">
                صفحه {page} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                بعدی
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}