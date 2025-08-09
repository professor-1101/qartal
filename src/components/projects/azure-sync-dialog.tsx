"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, CheckCircle, AlertTriangle, Info, RefreshCcw, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description?: string;
  latestApprovedVersion?: {
    id: string;
    version: string;
    releaseNotes?: string;
    approvedAt: string;
  };
}

interface ProjectVersion {
  id: string;
  version: string;
  status: string;
  releaseNotes?: string;
  createdAt: string;
  approvedAt?: string;
}

interface AzureSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSyncStarted: (projectId: string, versionId: string) => void;
}

export function AzureSyncDialog({ open, onOpenChange, project, onSyncStarted }: AzureSyncDialogProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [azureProjectName, setAzureProjectName] = useState<string>("");
  const [statusChecking, setStatusChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [checkingJobId, setCheckingJobId] = useState<string | null>(null);

  const loadApprovedVersions = useCallback(async () => {
    if (!project?.id) return;
    
    setLoadingVersions(true);
    try {
      // If project has latestApprovedVersion, use it directly
      if (project.latestApprovedVersion) {
        setVersions([{
          id: project.latestApprovedVersion.id,
          version: project.latestApprovedVersion.version,
          status: 'APPROVED',
          releaseNotes: project.latestApprovedVersion.releaseNotes,
          createdAt: project.latestApprovedVersion.approvedAt,
          approvedAt: project.latestApprovedVersion.approvedAt
        }]);
        setSelectedVersionId(project.latestApprovedVersion.id);
        setLoadingVersions(false);
        return;
      }

      // Otherwise fetch from API
      const response = await fetch(`/api/projects/${project.id}/versions`);
      if (response.ok) {
        const data = await response.json();
        // Filter only approved versions
        const approvedVersions = data.filter((v: ProjectVersion) => v.status === 'APPROVED');
        setVersions(approvedVersions);
        
        // Auto-select latest approved version
        if (approvedVersions.length > 0) {
          setSelectedVersionId(approvedVersions[0].id);
        }
      } else {
        toast.error("خطا در بارگذاری نسخه‌های تایید شده");
      }
    } catch (error) {
      console.error("Error loading versions:", error);
      toast.error("خطا در بارگذاری نسخه‌های تایید شده");
    } finally {
      setLoadingVersions(false);
    }
  }, [project?.id, project?.latestApprovedVersion]);

  // Load approved versions when dialog opens
  useEffect(() => {
    if (open && project?.id) {
      setAzureProjectName(project?.name || "");
      loadApprovedVersions();
      // Load previous sync jobs
      (async () => {
        setJobsLoading(true);
        try {
          const res = await fetch(`/api/projects/${project.id}/azure-sync`);
          if (res.ok) {
            const data = await res.json();
            setJobs(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          // ignore
        } finally {
          setJobsLoading(false);
        }
      })();
    }
  }, [open, project?.id, project?.name, loadApprovedVersions]);

  const handleSync = async () => {
    if (!project?.id || !selectedVersionId) {
      toast.error("لطفاً نسخه‌ای را انتخاب کنید");
      return;
    }
    if (!azureProjectName || azureProjectName.trim().length === 0) {
      toast.error("لطفاً نام پروژه در Azure را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/azure-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionId: selectedVersionId,
          azureProjectName: azureProjectName.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در همگام‌سازی');
      }

      const result = await response.json();
      toast.success(result.message || 'همگام‌سازی شروع شد');
      onSyncStarted(project.id, selectedVersionId);
      // Start polling status optimistically. If API restarts or task missing, we surface a hint.
      if (result?.syncJob?.projectId || result?.azureResponse?.task_id) {
        setStatusChecking(true);
        setStatusMessage('در حال بررسی وضعیت همگام‌سازی...');
        try {
          const statusRes = await fetch(`/api/projects/${project.id}/azure-sync/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const st = statusData?.syncJob?.status;
            if (st === 'COMPLETED') {
              toast.success('همگام‌سازی با موفقیت تکمیل شد');
            } else if (st === 'FAILED' || st === 'TIMEOUT') {
              toast.error('همگام‌سازی ناموفق/منقضی شد');
            } else {
              toast.message('همگام‌سازی در حال اجراست. بعداً دوباره وضعیت را بررسی کنید.');
            }
          } else {
            // If server restarted and no job found, inform user
            setStatusMessage('وضعیت همگام‌سازی فعلاً قابل دریافت نیست (احتمالاً سرور وضعیت ری‌استارت شده). بعداً دوباره تلاش کنید.');
          }
        } catch {
          setStatusMessage('مشکل ارتباط با وضعیت همگام‌سازی. بعداً دوباره تلاش کنید.');
        } finally {
          setStatusChecking(false);
        }
      }
      onOpenChange(false);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در همگام‌سازی');
    } finally {
      setLoading(false);
    }
  };

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Cloud className="h-5 w-5" />
            همگام‌سازی با Azure DevOps
          </DialogTitle>
          <DialogDescription className="text-right">
            ارسال نسخه تایید شده پروژه &quot;{project?.name}&quot; به Azure DevOps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Azure Project Name */}
          <div className="space-y-2">
            <Label className="text-right block">نام پروژه در Azure DevOps</Label>
            <Input
              value={azureProjectName}
              onChange={(e) => setAzureProjectName(e.target.value)}
              placeholder="مثلاً: Cartal-QA"
              className="text-right"
            />
          </div>

          {/* Project Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1 text-right">پروژه انتخاب شده</h4>
            <p className="text-sm text-muted-foreground text-right">{project?.name}</p>
            {project?.description && (
              <p className="text-xs text-muted-foreground text-right mt-1">{project.description}</p>
            )}
          </div>

          {/* Version Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-right block">
              انتخاب نسخه تایید شده
            </label>
            
            {loadingVersions ? (
              <div className="text-sm text-muted-foreground text-right">
                در حال بارگذاری نسخه‌ها...
              </div>
            ) : versions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    هیچ نسخه تایید شده‌ای برای این پروژه یافت نشد
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  ابتدا باید پروژه را برای بررسی ارسال کنید و توسط QA تایید شود.
                </p>
              </div>
            ) : (
              <>
                <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="انتخاب نسخه..." />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        <div className="text-right">
                          <span className="font-medium">نسخه {version.version}</span>
                          <span className="text-xs text-muted-foreground mr-2">
                            {new Date(version.approvedAt || version.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Version Details */}
                {selectedVersion && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        نسخه {selectedVersion.version}
                      </span>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        تایید شده
                      </Badge>
                    </div>
                    {selectedVersion.releaseNotes && (
                      <p className="text-xs text-green-700">
                        {selectedVersion.releaseNotes}
                      </p>
                    )}
                    <p className="text-xs text-green-600 mt-1">
                      تایید شده در: {new Date(selectedVersion.approvedAt || selectedVersion.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">نکات مهم:</p>
                <ul className="space-y-1">
                  <li>• فقط نسخه‌های تایید شده قابل ارسال هستند</li>
                  <li>• فایل JSON نسخه انتخاب شده ارسال می‌شود</li>
                  <li>• وضعیت همگام‌سازی قابل ردیابی است</li>
                  {statusChecking && <li>• در حال بررسی وضعیت همگام‌سازی...</li>}
                  {statusMessage && <li>• {statusMessage}</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Jobs history */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-right">درخواست‌های همگام‌سازی قبلی</h4>
            {jobsLoading ? (
              <p className="text-xs text-muted-foreground text-right">در حال بارگذاری...</p>
            ) : jobs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-right">درخواستی ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{job.status}</Badge>
                      <span className="text-muted-foreground">نسخه: {job.version || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 hover:underline"
                        title={job.taskId}
                        onClick={() => {
                          if (job.taskId) navigator.clipboard.writeText(job.taskId);
                        }}
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate max-w-[140px]">{job.taskId || '—'}</span>
                      </button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!job.taskId || checkingJobId === job.id}
                        onClick={async () => {
                          try {
                            setCheckingJobId(job.id);
                            const res = await fetch(`/api/projects/${project!.id}/azure-sync/status${job.taskId ? `?taskId=${encodeURIComponent(job.taskId)}` : ''}`);
                            if (!res.ok) {
                              toast.error('وضعیت یافت نشد');
                              return;
                            }
                            const data = await res.json();
                            const updated = data?.syncJob;
                            if (updated) {
                              setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
                              if (updated.status === 'COMPLETED') toast.success('تکمیل شد');
                              else if (updated.status === 'FAILED' || updated.status === 'TIMEOUT') toast.error('ناموفق/منقضی شد');
                              else toast.message('در حال اجرا');
                            } else {
                              toast.error('چیزی دریافت نشد');
                            }
                          } catch (e) {
                            toast.error('خطا در بررسی وضعیت');
                          } finally {
                            setCheckingJobId(null);
                          }
                        }}
                      >
                        <RefreshCcw className={`h-3.5 w-3.5 ${checkingJobId === job.id ? 'animate-spin' : ''}`} />
                        <span className="mr-1">بررسی</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            انصراف
          </Button>
          <Button
            onClick={handleSync}
            disabled={loading || !selectedVersionId || versions.length === 0}
          >
            {loading ? "در حال ارسال..." : "شروع همگام‌سازی"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
