"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Eye, 
  FileText, 
  Users,
  Calendar,
  Cloud
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";
import { AzureSyncDialog } from "@/components/projects/azure-sync-dialog";
// Azure sync dialog removed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApprovedProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  latestApprovedVersion: {
    id: string;
    version: string;
    releaseNotes: string;
    approvedAt: string;
    approvedBy: string;
  };
}

export default function ApprovedVersionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ApprovedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Azure sync removed
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncProject, setSyncProject] = useState<ApprovedProject | null>(null);

  const fetchApprovedVersions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: "20",
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/approved-versions?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        if (response.status === 403) {
          router.push("/");
          return;
        }
        throw new Error("خطا در دریافت نسخه‌های تایید شده");
      }

      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching approved versions:", error);
      toast.error("خطا در بارگذاری نسخه‌های تایید شده");
    } finally {
      setLoading(false);
    }
  }, [search, page, router, statusFilter]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    // Check if user is super user
    if (!(session?.user as any)?.isSuper) {
      router.push("/");
      return;
    }

    fetchApprovedVersions();
  }, [session, status, router, fetchApprovedVersions]);



  // Azure sync removed

  if (status === "loading" || loading) {
  return (
    <div className="container-fluid " dir="rtl">
        <DashboardPageHeader
          title="نسخه‌های تایید شده"
          description="مدیریت و مشاهده آخرین نسخه‌های تایید شده پروژه‌ها"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" dir="rtl">
      <DashboardPageHeader
        title="نسخه‌های تایید شده"
        description="مدیریت و مشاهده آخرین نسخه‌های تایید شده پروژه‌ها"
      />

      {/* Reverted layout: filters on top, list below */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">فیلترها</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="جستجو در پروژه‌ها..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-right"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="فیلتر وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="approved">تایید شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div>
        {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
        )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">هیچ نسخه تایید شده‌ای وجود ندارد</h3>
              <p className="text-sm">وقتی پروژه‌ای تایید شود، اینجا نمایش داده می‌شود</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-emerald-50/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-right mb-2 text-gray-900 group-hover:text-emerald-800 transition-colors">
                          {project.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 text-right leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        نسخه {project.latestApprovedVersion.version}
                      </Badge>
                    </div>
                    
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>مالک پروژه:</span>
                        <span className="font-medium text-gray-700">{project.user.firstName} {project.user.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>تاریخ تایید:</span>
                        <span className="font-medium text-gray-700">{format(new Date(project.latestApprovedVersion.approvedAt), "yyyy/MM/dd HH:mm", { locale: faIR })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span>نسخه:</span>
                        <span className="font-medium text-gray-700">{project.latestApprovedVersion.version}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {project.latestApprovedVersion.releaseNotes && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:bg-emerald-100 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-800 text-sm">
                          یادداشت‌های انتشار
                        </span>
                      </div>
                      <p className="text-sm text-emerald-700 text-right leading-relaxed">
                        {project.latestApprovedVersion.releaseNotes}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-100">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/projects/${project.id}/view`)}
                      variant="outline"
                      className="text-xs px-3 py-2 h-8 hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3 ml-1" />
                      نمایش پروژه
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs px-3 py-2 h-8"
                      onClick={() => { setSyncProject(project); setSyncOpen(true); }}
                    >
                      <Cloud className="h-3 w-3 ml-1" />
                      همگام‌سازی Azure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحه {page} از {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            بعدی
          </Button>
        </div>
      )}
        </div>
      </div>

      <AzureSyncDialog
        open={syncOpen}
        onOpenChange={(o) => { setSyncOpen(o); if (!o) setSyncProject(null); }}
        project={syncProject as any}
        onSyncStarted={() => {
          toast.success("همگام‌سازی شروع شد");
        }}
      />
    </div>
  );
}
