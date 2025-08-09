"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Users,
  Calendar,
  User,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";

interface PendingProject {
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
  pendingVersion: {
    id: string;
    version: string;
    releaseNotes: string;
    createdAt: string;
  };
}

interface RecentApproval {
  id: string;
  projectId: string;
  projectName: string;
  projectDescription: string;
  version: string;
  status: 'APPROVED' | 'REJECTED';
  releaseNotes: string;
  rejectionReason: string;
  approvedAt: string;
  projectOwner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function QAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<RecentApproval[]>([]);
  const [rejectedProjects, setRejectedProjects] = useState<RecentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalMessage, setApprovalMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedPending, setSelectedPending] = useState<{ projectId: string; versionId: string; projectName: string; version: string } | null>(null);

  const fetchPendingProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/qa/pending-projects");
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        if (response.status === 403) {
          router.push("/");
          return;
        }
        throw new Error("خطا در دریافت پروژه‌های در انتظار");
      }

      const data = await response.json();
      setPendingProjects(data.projects);
    } catch (error) {
      console.error("Error fetching pending projects:", error);
      toast.error("خطا در بارگذاری پروژه‌های در انتظار");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchRecentApprovals = useCallback(async () => {
    try {
      const response = await fetch("/api/qa/recent-approvals");
      
      if (!response.ok) {
        console.error("خطا در دریافت تاییدهای اخیر");
        return;
      }

      const data = await response.json();
      const approvals = data.approvals || [];
      setRecentApprovals(approvals.filter((a: RecentApproval) => a.status === 'APPROVED'));
      setRejectedProjects(approvals.filter((a: RecentApproval) => a.status === 'REJECTED'));
    } catch (error) {
      console.error("Error fetching recent approvals:", error);
    }
  }, []);

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

    fetchPendingProjects();
    fetchRecentApprovals();
  }, [session, status, router, fetchPendingProjects, fetchRecentApprovals]);

  const openApprovalDialog = (project: PendingProject, action: 'approve' | 'reject') => {
    setSelectedPending({ projectId: project.id, versionId: project.pendingVersion.id, projectName: project.name, version: project.pendingVersion.version });
    setApprovalAction(action);
    setApprovalMessage('');
    setApprovalDialogOpen(true);
  };

  const handleApproval = async () => {
    if (!selectedPending) return;
    if (approvalAction === 'reject' && !approvalMessage.trim()) {
      toast.error('لطفاً دلیل رد کردن را وارد کنید');
      return;
    }
    try {
      setActionLoadingId(selectedPending.versionId);
      const res = await fetch(`/api/projects/${selectedPending.projectId}/versions/${selectedPending.versionId}/${approvalAction}` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: approvalMessage })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'خطا در عملیات');
        return;
      }
      toast.success(approvalAction === 'approve' ? 'نسخه تایید شد' : 'نسخه رد شد');
      setApprovalDialogOpen(false);
      setApprovalMessage('');
      setSelectedPending(null);
      await fetchPendingProjects();
      await fetchRecentApprovals();

      // Broadcast to other tabs/pages to refresh status instantly
      try {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const bc = new BroadcastChannel('qa-version-updated');
          bc.postMessage({ projectId: selectedPending.projectId, versionId: selectedPending.versionId, action: approvalAction, version: selectedPending.version });
          bc.close();
        }
      } catch {}
    } catch (e) {
      toast.error('اشکال در برقراری ارتباط با سرور');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 ml-1" />
            در انتظار
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle className="w-3 h-3 ml-1" />
            تایید شده
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 ml-1" />
            رد شده
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  // share short-code no longer used on this page

  if (status === "loading" || loading) {
    return (
      <div className="container-fluid" dir="rtl">
        <DashboardPageHeader
          title="بخش نظارت و تایید"
          description="بررسی و تایید پروژه‌های ارسال شده"
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
        title="بخش نظارت و تایید"
        description="بررسی و تایید پروژه‌های ارسال شده"
      />

      <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8" dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-3 ml-auto" dir="rtl">
          <TabsTrigger value="pending" className="flex items-center gap-2 text-sm flex-row-reverse" dir="rtl">
            <AlertCircle className="h-4 w-4" />
            در انتظار تایید
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2 text-sm flex-row-reverse" dir="rtl">
            <Clock className="h-4 w-4" />
            تاییدهای اخیر
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2 text-sm flex-row-reverse" dir="rtl">
            <XCircle className="h-4 w-4" />
            رد شده‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6" dir="rtl">
          {pendingProjects.length === 0 ? (
            <div className="text-center py-8 border rounded-md border-dashed">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">هیچ پروژه‌ای در انتظار تایید نیست.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-right">{project.name}</CardTitle>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 text-right">{project.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        نسخه {project.pendingVersion.version}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>ارسال کننده:</span>
                        <span className="font-medium text-gray-700">
                          {project.user.firstName} {project.user.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>تاریخ ارسال:</span>
                        <span className="font-medium text-gray-700">
                          {format(new Date(project.pendingVersion.createdAt), "yyyy/MM/dd HH:mm", { locale: faIR })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/projects/${project.id}/view`)}
                          className="text-xs px-3 py-2 h-8"
                        >
                          <Eye className="h-3 w-3 ml-1" />
                          نمایش پروژه
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-3 py-2 h-8 text-green-700 hover:bg-green-50"
                          onClick={() => openApprovalDialog(project, 'approve')}
                          disabled={actionLoadingId === project.pendingVersion.id}
                        >
                          {actionLoadingId === project.pendingVersion.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <CheckCircle className="h-3 w-3 ml-1" />
                          )}
                          تایید
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-3 py-2 h-8 text-red-700 hover:bg-red-50"
                          onClick={() => openApprovalDialog(project, 'reject')}
                          disabled={actionLoadingId === project.pendingVersion.id}
                        >
                          {actionLoadingId === project.pendingVersion.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <XCircle className="h-3 w-3 ml-1" />
                          )}
                          رد
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          {recentApprovals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">هیچ پروژه تایید شده‌ای وجود ندارد</h3>
                  <p className="text-sm">پروژه‌های تایید شده اینجا نمایش داده می‌شوند</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {recentApprovals.map((approval) => (
                <Card key={approval.id} className="group overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-emerald-50/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold text-right mb-2 text-gray-900 group-hover:text-emerald-800 transition-colors">
                              {approval.projectName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 text-right leading-relaxed">
                              {approval.projectDescription}
                            </p>
                          </div>
                          {getStatusBadge(approval.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>مالک پروژه:</span>
                            <span className="font-medium text-gray-700">{approval.projectOwner.firstName} {approval.projectOwner.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>تاریخ تایید:</span>
                            <span className="font-medium text-gray-700">{format(new Date(approval.approvedAt), "yyyy/MM/dd HH:mm", { locale: faIR })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <FileText className="w-4 h-4" />
                            <span>نسخه:</span>
                            <span className="font-medium text-gray-700">{approval.version}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {approval.releaseNotes && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:bg-emerald-100 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-800 text-sm">
                              یادداشت‌های انتشار
                            </span>
                          </div>
                          <p className="text-sm text-emerald-700 text-right leading-relaxed">
                            {approval.releaseNotes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-100">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/projects/${approval.projectId}/view`)}
                          variant="outline"
                          className="text-xs px-3 py-2 h-8 hover:bg-gray-50"
                        >
                          <Eye className="h-3 w-3 ml-1" />
                          نمایش پروژه
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-6">
          {rejectedProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">هیچ پروژه رد شده‌ای وجود ندارد</h3>
                  <p className="text-sm">پروژه‌های رد شده اینجا نمایش داده می‌شوند</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {rejectedProjects.map((rejection) => (
                <Card key={rejection.id} className="group overflow-hidden border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-red-50/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold text-right mb-2 text-gray-900 group-hover:text-red-800 transition-colors">
                              {rejection.projectName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 text-right leading-relaxed">
                              {rejection.projectDescription}
                            </p>
                          </div>
                          {getStatusBadge(rejection.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>مالک پروژه:</span>
                            <span className="font-medium text-gray-700">{rejection.projectOwner.firstName} {rejection.projectOwner.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>تاریخ رد:</span>
                            <span className="font-medium text-gray-700">{format(new Date(rejection.approvedAt), "yyyy/MM/dd HH:mm", { locale: faIR })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <FileText className="w-4 h-4" />
                            <span>نسخه:</span>
                            <span className="font-medium text-gray-700">{rejection.version}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {rejection.releaseNotes && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-red-800 text-sm">
                              یادداشت‌های انتشار
                            </span>
                          </div>
                          <p className="text-sm text-red-700 text-right leading-relaxed">
                            {rejection.releaseNotes}
                          </p>
                        </div>
                      )}
                      
                      {rejection.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-red-800 text-sm">دلیل رد</span>
                          </div>
                          <p className="text-sm text-red-700 text-right leading-relaxed">
                            {rejection.rejectionReason}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-100">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/projects/${rejection.projectId}/view`)}
                          variant="outline"
                          className="text-xs px-3 py-2 h-8 hover:bg-gray-50"
                        >
                          <Eye className="h-3 w-3 ml-1" />
                          نمایش پروژه
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>

      {/* Approval/Reject Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  تایید نسخه {selectedPending?.version} - {selectedPending?.projectName}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  رد نسخه {selectedPending?.version} - {selectedPending?.projectName}
                </>
              )}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div className="space-y-3">
            <Label className="text-right block">
              {approvalAction === 'approve' ? 'یادداشت تایید (اختیاری)' : 'دلیل رد (اجباری)'}
            </Label>
            <Textarea
              value={approvalMessage}
              onChange={(e) => setApprovalMessage(e.target.value)}
              rows={4}
              placeholder={approvalAction === 'approve' ? 'نکات تایید...' : 'دلیل رد را بنویسید...'}
              required={approvalAction === 'reject'}
              className={approvalAction === 'approve' ? 'border-green-200 focus:border-green-500' : 'border-red-200 focus:border-red-500'}
            />
            {approvalAction === 'reject' && !approvalMessage.trim() && (
              <p className="text-xs text-red-600">دلیل رد کردن اجباری است</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)} disabled={actionLoadingId !== null}>انصراف</Button>
            <Button onClick={handleApproval} disabled={actionLoadingId !== null || (approvalAction === 'reject' && !approvalMessage.trim())} className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {actionLoadingId ? 'در حال پردازش...' : approvalAction === 'approve' ? 'تایید' : 'رد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
