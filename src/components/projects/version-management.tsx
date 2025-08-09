"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns-jalali';
import { 
  GitBranch, 
  Check, 
  X, 
  Clock, 
  FileText, 
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  History,
  Tag,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { VersionDiffViewer } from './version-diff-viewer';
import { VersionDiffGenerator } from '@/lib/versioning-diff';
import { toast } from 'sonner';

interface ProjectVersion {
  id: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  releaseNotes?: string;
  changesSummary?: any;
  snapshotData: any;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  rejectedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface VersionManagementProps {
  projectId: string;
  isOwner: boolean;
  isLocked?: boolean;
  externalProjectStatus?: {
    hasChanges: boolean;
    hasPendingVersion: boolean;
    changeSummary: any;
    latestVersion: string;
  } | null;
}

export function VersionManagement({ projectId, isOwner, isLocked = false, externalProjectStatus }: VersionManagementProps) {
  const { data: session } = useSession();
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalMessage, setApprovalMessage] = useState('');
  const [showRejectionDetails, setShowRejectionDetails] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  // Use external project status if provided, otherwise fetch internally
  const [internalProjectStatus, setInternalProjectStatus] = useState<{
    hasChanges: boolean;
    hasPendingVersion: boolean;
    changeSummary: any;
    latestVersion: string;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const projectStatus = externalProjectStatus || internalProjectStatus;
  
  // Calculate pagination
  const totalItems = versions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVersions = versions.slice(startIndex, endIndex);

  const fetchVersionsCallback = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/versions`);
      const data = await response.json();
      
      if (response.ok) {
        setVersions(data.versions);
        setCurrentPage(1); // Reset to first page when data changes
      } else {
                        toast.error(data.error || 'خطا در دریافت فهرست نسخه‌ها');
      }
    } catch (error) {
      toast.error('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchProjectStatus = useCallback(async () => {
    // Don't fetch if external status is provided
    if (externalProjectStatus) return;
    
    try {
      setStatusLoading(true);
      const response = await fetch(`/api/projects/${projectId}/status`);
      const data = await response.json();
      
      if (response.ok) {
        setInternalProjectStatus(data);
      } else {
        console.error('Error fetching project status:', data.error);
      }
    } catch (error) {
      console.error('Error fetching project status:', error);
    } finally {
      setStatusLoading(false);
    }
  }, [projectId, externalProjectStatus]);

  useEffect(() => {
    fetchVersionsCallback();
    fetchProjectStatus();
  }, [fetchVersionsCallback, fetchProjectStatus]);

  const publishProject = async () => {
    setPublishLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show detailed success message with longer duration
        toast.success(result.message, {
          duration: 6000,
          description: "✨ نسخه جدید آماده تایید QA Manager است",
          action: {
            label: "✓ متوجه شدم",
            onClick: () => {}
          }
        });
        
                 fetchVersionsCallback();
         fetchProjectStatus();
         
         // Delayed reload to give user time to read the message
         setTimeout(() => {
           window.location.reload();
         }, 3000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'خطا در انتشار پروژه', {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('خطا در انتشار پروژه:', error);
      toast.error('خطا در انتشار پروژه', {
        duration: 5000
      });
    } finally {
      setPublishLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedVersion) return;
    
    if (approvalAction === 'reject' && !approvalMessage.trim()) {
      toast.error('لطفاً دلیل رد کردن را وارد کنید');
      return;
    }

    try {
      setApprovalLoading(selectedVersion.id);
      const response = await fetch(
        `/api/projects/${projectId}/versions/${selectedVersion.id}/${approvalAction}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: approvalMessage }),
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(approvalAction === 'approve' ? 'نسخه تایید شد' : 'نسخه رد شد');
        setApprovalDialogOpen(false);
        setApprovalMessage('');
                 setSelectedVersion(null);
         fetchVersionsCallback();
         fetchProjectStatus();
         
         // Reload page to update project locked status
         setTimeout(() => {
           window.location.reload();
         }, 1000);
      } else {
        console.error('خطا در عملیات تایید/رد:', data.error);
        toast.error(data.error || 'خطا در عملیات تایید یا رد نسخه');
      }
    } catch (error) {
      console.error('خطا در شبکه:', error);
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setApprovalLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 ml-1" />
            تایید شده
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 ml-1" />
            رد شده
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 ml-1" />
            در انتظار بررسی
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 ml-1" />
            نامشخص
          </Badge>
        );
    }
  };

  const getUserDisplayName = (user: ProjectVersion['createdBy']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const openNotesDialog = (version: ProjectVersion) => {
    setSelectedVersion(version);
    setNotesDialogOpen(true);
  };

  const openApprovalDialog = (version: ProjectVersion, action: 'approve' | 'reject') => {
    setSelectedVersion(version);
    setApprovalAction(action);
    setApprovalDialogOpen(true);
  };

  const getVersionTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <Zap className="h-4 w-4 text-red-500" />;
      case 'minor':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'patch':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      default:
        return <Tag className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVersionTypeDescription = (version: ProjectVersion) => {
    // Special label for first imported pending version
    if (version.status === 'PENDING' && version.major === 1 && version.minor === 0 && version.patch === 0) {
      return 'پروژه ایمپورت شده';
    }
    if (version.major > 0 && version.minor === 0 && version.patch === 0) {
      return 'تغییرات نیازمندی کارفرما';
    } else if (version.minor > 0 && version.patch === 0) {
      return 'افزودن تست‌های جدید';
    } else {
      return 'بهبود تست‌های موجود';
    }
  };



  // Get latest approved version
  const latestApprovedVersion = versions.find(v => v.status === 'APPROVED');

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end">
                <GitBranch className="h-5 w-5" />
                مدیریت نسخه‌ها
              </CardTitle>
              <CardDescription>
                کنترل نسخه‌گذاری مجموعه تست‌ها با معیارهای تست‌محور
              </CardDescription>
            </div>
                        {isOwner && (
              <div className="flex gap-2">
                {isLocked ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-medium">در انتظار تایید QA Manager</span>
                  </div>
                                 ) : (
                   <Button 
                     onClick={publishProject} 
                     disabled={publishLoading || !projectStatus?.hasChanges || projectStatus?.hasPendingVersion}
                     className="flex items-center gap-2"
                     title={
                       !projectStatus?.hasChanges ? 'هیچ تغییری برای انتشار وجود ندارد' :
                       projectStatus?.hasPendingVersion ? 'نسخه‌ای در انتظار تایید وجود دارد' : ''
                     }
                   >
                     {publishLoading ? (
                       <>
                         <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                         در حال انتشار...
                       </>
                     ) : (
                       <>
                         <Tag className="h-4 w-4" />
                         انتشار نسخه
                       </>
                     )}
                   </Button>
                 )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Project Status Indicator */}
          {statusLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              در حال بررسی وضعیت...
            </div>
          ) : projectStatus ? (
            <div className="space-y-3">
              {/* Git-like Status */}
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <div className={`w-3 h-3 rounded-full ${projectStatus.hasChanges ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {projectStatus.hasChanges ? 'تغییرات آماده انتشار' : 'بدون تغییر'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    آخرین نسخه: {projectStatus.latestVersion}
                  </div>
                </div>
                {projectStatus.hasPendingVersion && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    در انتظار تایید
                  </Badge>
                )}
              </div>

              {/* Change Summary */}
              {projectStatus.hasChanges && projectStatus.changeSummary && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex gap-4">
                    {projectStatus.changeSummary.addedFeatures > 0 && (
                      <span className="text-green-600">+{projectStatus.changeSummary.addedFeatures} ویژگی</span>
                    )}
                    {projectStatus.changeSummary.removedFeatures > 0 && (
                      <span className="text-red-600">-{projectStatus.changeSummary.removedFeatures} ویژگی</span>
                    )}
                    {projectStatus.changeSummary.modifiedFeatures > 0 && (
                      <span className="text-blue-600">~{projectStatus.changeSummary.modifiedFeatures} ویژگی</span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    {projectStatus.changeSummary.addedScenarios > 0 && (
                      <span className="text-green-600">+{projectStatus.changeSummary.addedScenarios} سناریو</span>
                    )}
                    {projectStatus.changeSummary.removedScenarios > 0 && (
                      <span className="text-red-600">-{projectStatus.changeSummary.removedScenarios} سناریو</span>
                    )}
                    {projectStatus.changeSummary.modifiedScenarios > 0 && (
                      <span className="text-blue-600">~{projectStatus.changeSummary.modifiedScenarios} سناریو</span>
                    )}
                  </div>
                </div>
              )}

              {/* Current Status */}
              {latestApprovedVersion ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    آخرین نسخه تست تایید شده: <span className="font-mono font-bold">{latestApprovedVersion.version}</span>
                    {latestApprovedVersion.approvedAt && (
                      <span className="text-sm text-muted-foreground mr-2">
                        ({format(new Date(latestApprovedVersion.approvedAt), 'yyyy/MM/dd')})
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    هنوز هیچ نسخه تست تایید شده‌ای وجود ندارد
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                خطا در بارگذاری وضعیت پروژه
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Versions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-row-reverse justify-end">
            <History className="h-5 w-5" />
            تاریخچه نسخه‌ها ({versions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && versions.length === 0 ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">هنوز هیچ نسخه تستی ایجاد نشده است</h3>
              <p className="text-sm">اولین نسخه از مجموعه تست‌های خود را ایجاد کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedVersions.map((version) => (
                <Card key={version.id} className={`
                  ${version.status === 'APPROVED' ? 'border-green-200 bg-green-50/50' : ''}
                  ${version.status === 'REJECTED' ? 'border-red-200 bg-red-50/50' : ''}
                  ${version.status === 'PENDING' ? 'border-yellow-200 bg-yellow-50/50' : ''}
                `}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getVersionTypeIcon(version.patch > 0 ? 'patch' : version.minor > 0 ? 'minor' : 'major')}
                          <span className="font-mono font-bold text-lg">{version.version}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            {getVersionTypeDescription(version)}
                          </span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getUserDisplayName(version.createdBy)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(version.createdAt), 'yyyy/MM/dd HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(version.status)}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openNotesDialog(version)}
                            title="مشاهده Release Notes"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          
                          {(() => {
                            const originalIndex = versions.findIndex(v => v.id === version.id);
                            return originalIndex < versions.length - 1 && (
                              <VersionDiffViewer
                                diff={VersionDiffGenerator.generateDiff(
                                  versions[originalIndex + 1].snapshotData,
                                  version.snapshotData
                                )}
                                oldVersionName={versions[originalIndex + 1].version}
                                newVersionName={version.version}
                              />
                            );
                          })()}
                          
                          {session?.user?.isSuper && version.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => openApprovalDialog(version, 'approve')}
                                disabled={approvalLoading === version.id}
                                title="تایید نسخه"
                              >
                                {approvalLoading === version.id ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openApprovalDialog(version, 'reject')}
                                disabled={approvalLoading === version.id}
                                title="رد نسخه"
                              >
                                {approvalLoading === version.id ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Show approval/rejection details */}
                    {version.status === 'APPROVED' && version.approvedAt && (
                      <div className="mt-3 p-3 bg-green-100 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <div className="text-right" dir="rtl">
                            {version.approvedBy && (
                              <span>{getUserDisplayName(version.approvedBy)} توسط </span>
                            )}
                            <span>{format(new Date(version.approvedAt), 'yyyy/MM/dd HH:mm')} در شده تایید</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {version.status === 'REJECTED' && version.rejectedAt && (
                      <div className="mt-3">
                        <div className="p-3 bg-red-100 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-800 text-sm flex-row-reverse">
                              <div className="text-right">
                                <span>رد شده در {format(new Date(version.rejectedAt), 'yyyy/MM/dd HH:mm')}</span>
                                {version.rejectedBy && (
                                  <span> توسط {getUserDisplayName(version.rejectedBy)}</span>
                                )}
                              </div>
                              <XCircle className="h-4 w-4" />
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowRejectionDetails(showRejectionDetails === version.id ? null : version.id)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          {showRejectionDetails === version.id && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <p className="text-sm text-red-700">
                                دلیل رد: {version.rejectionReason || 'دلیل رد مشخص نشده است'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  نمایش {startIndex + 1} تا {Math.min(endIndex, totalItems)} از {totalItems} نسخه
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">در صفحه</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isVisible = 
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                    
                    if (!isVisible) {
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="text-muted-foreground">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Release Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="release-notes-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Release Notes - نسخه {selectedVersion?.version}
            </DialogTitle>
            <div id="release-notes-description" className="sr-only">
              یادداشت‌های انتشار و تغییرات مربوط به این نسخه
            </div>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {selectedVersion?.releaseNotes ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                  {selectedVersion.releaseNotes}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Release Notes برای این نسخه موجود نیست</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl" aria-describedby="approval-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  تایید نسخه {selectedVersion?.version}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  رد نسخه {selectedVersion?.version}
                </>
              )}
            </DialogTitle>
            <div id="approval-dialog-description" className="sr-only">
              فرم تایید یا رد نسخه با امکان افزودن توضیحات
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedVersion && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="font-medium">نسخه:</span>
                  <span className="font-mono ml-2">{selectedVersion.version}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">سازنده:</span>
                  <span className="ml-2">{getUserDisplayName(selectedVersion.createdBy)}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">تاریخ ایجاد:</span>
                  <span className="ml-2">{format(new Date(selectedVersion.createdAt), 'yyyy/MM/dd HH:mm')}</span>
                </div>
              </div>
            )}
            
            <div>
              <Label className="flex items-center gap-2">
                {approvalAction === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">یادداشت تایید (اختیاری)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-700">دلیل رد کردن (اجباری)</span>
                  </>
                )}
              </Label>
              <Textarea 
                value={approvalMessage}
                onChange={(e) => setApprovalMessage(e.target.value)}
                placeholder={
                  approvalAction === 'approve' 
                    ? 'یادداشت یا نکات مربوط به تایید این نسخه...'
                    : 'لطفاً دلیل رد کردن نسخه را به طور واضح بنویسید تا سازنده بتواند مشکل را برطرف کند...'
                }
                rows={4}
                required={approvalAction === 'reject'}
                className={
                  approvalAction === 'approve' 
                    ? 'border-green-200 focus:border-green-500' 
                    : 'border-red-200 focus:border-red-500'
                }
              />
              {approvalAction === 'reject' && !approvalMessage.trim() && (
                <p className="text-xs text-red-600 mt-1">دلیل رد کردن اجباری است</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex-row-reverse">
            <Button 
              onClick={handleApproval}
              disabled={approvalLoading !== null || (approvalAction === 'reject' && !approvalMessage.trim())}
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {approvalLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  در حال پردازش...
                </>
              ) : (
                <>
                  {approvalAction === 'approve' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      تایید نسخه
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      رد نسخه
                    </>
                  )}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setApprovalDialogOpen(false);
                setApprovalMessage('');
              }}
              disabled={approvalLoading !== null}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}