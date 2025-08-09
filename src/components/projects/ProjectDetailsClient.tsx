"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, FileCode, CheckSquare, Layers, EllipsisVertical, Share2, Trash2, Download, GripVertical, GitBranch, Clock } from "lucide-react";
import { VersionManagement } from "./version-management";
import { Feature, Project } from '@/types/index';
import { CreateFeatureSheet } from "@/components/projects/create-feature-sheet";
import { ShareProjectDialog } from "@/components/projects/share-project-dialog";


import { 
    createGherkinFromFeature, 
    createProjectInfo,
    createBeautifulHTML
} from "@/lib/export-utils";
import { toast } from "sonner";
import { useAutoSave } from '@/components/providers/autosave-context';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectDetailsClientProps {
    project: Project & { isLocked?: boolean };
    features: Feature[];
}

// Sortable Feature Item
function SortableFeature({ feature, children }: { feature: Feature; children: (props: { listeners: any }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: feature.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
      }}
      {...attributes}
    >
      {children({ listeners })}
    </div>
  );
}

export default function ProjectDetailsClient({ project, features: initialFeatures }: ProjectDetailsClientProps) {
    const [features, setFeatures] = useState<Feature[]>(initialFeatures);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isShareDialogOpen, setShareDialogOpen] = React.useState(false);
    const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<'features' | 'versions'>('features');
    const [projectStatus, setProjectStatus] = useState<{
        hasChanges: boolean;
        hasPendingVersion: boolean;
        changeSummary: any;
        latestVersion: string;
    } | null>(null);
    const isLockedComputed = (projectStatus?.hasPendingVersion ?? false) || (project.isLocked ?? false);
    const [statusLoading, setStatusLoading] = useState(false);
    const { setOnSaveSuccess } = useAutoSave();

    // Fetch project status
    const fetchProjectStatus = React.useCallback(async () => {
        try {
            setStatusLoading(true);
            const response = await fetch(`/api/projects/${project.id}/status`);
            const data = await response.json();
            
            if (response.ok) {
                setProjectStatus(data);
            } else {
                console.error('Error fetching project status:', data.error);
            }
        } catch (error) {
            console.error('Error fetching project status:', error);
        } finally {
            setStatusLoading(false);
        }
    }, [project.id]);

    React.useEffect(() => {
        fetchProjectStatus();
    }, [fetchProjectStatus]);

    // Set up callback for when autosave completes
    React.useEffect(() => {
        const handleSaveSuccess = (projectId: string) => {
            if (projectId === project.id) {
                // Refresh project status after successful save
                fetchProjectStatus();
            }
        };
        
        setOnSaveSuccess(handleSaveSuccess);
        
        // Cleanup
        return () => {
            setOnSaveSuccess(() => {});
        };
    }, [project.id, fetchProjectStatus, setOnSaveSuccess]);

    // Listen to QA approval/rejection events to refresh status immediately across pages/tabs
    React.useEffect(() => {
        let channel: BroadcastChannel | null = null;
        try {
            // @ts-ignore - BroadcastChannel may not exist in some environments
            if (typeof window !== 'undefined' && window.BroadcastChannel) {
                channel = new BroadcastChannel('qa-version-updated');
                channel.onmessage = (event: MessageEvent) => {
                    try {
                        const data = event.data || {};
                        if (data.projectId === project.id) {
                            fetchProjectStatus();
                        }
                    } catch {
                        // no-op
                    }
                };
            }
        } catch {
            // no-op if BroadcastChannel unsupported
        }
        return () => {
            try { channel?.close(); } catch {}
        };
    }, [project.id, fetchProjectStatus]);

    const handleDeleteFeature = async () => {
        if (!featureToDelete) return;

        try {
            const res = await fetch(`/api/projects/${project.id}/features/${featureToDelete.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            setFeatures(prev => prev.filter(f => f.id !== featureToDelete.id));
        } catch {
            console.error("حذف ویژگی با خطا مواجه شد.");
        } finally {
            setFeatureToDelete(null);
        }
    };

    const sensors = useSensors(useSensor(PointerSensor));
    const handleDragEnd = async (event: any) => {
      const { active, over } = event;
      if (active.id !== over.id) {
        const oldIndex = features.findIndex(f => f.id === active.id);
        const newIndex = features.findIndex(f => f.id === over.id);
        const movedFeature = features[oldIndex];
        const newFeatures = arrayMove(features, oldIndex, newIndex).map((f, idx) => ({ ...f, order: idx + 1 }));
        setFeatures(newFeatures);
        await fetch(`/api/projects/${project.id}/features/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            features: newFeatures.map(f => ({ id: f.id, order: f.order })),
            movedFeatureId: movedFeature.id,
            oldPosition: oldIndex + 1,
            newPosition: newIndex + 1
          })
        });
      }
    };

    // --- Export Handlers ---
    
    const handleExportZIP = async () => {
        try {
            setExporting(true);
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            
            // Get latest version info
            let versionInfo = null;
            try {
                const versionResponse = await fetch(`/api/projects/${project.id}/versions`);
                if (versionResponse.ok) {
                    const versions = await versionResponse.json();
                    versionInfo = versions.find((v: any) => v.status === 'APPROVED') || versions[0] || null;
                }
            } catch (error) {
                console.warn('Could not fetch version info for export:', error);
            }
            
            // Add project info file
            const projectInfo = createProjectInfo(project, features);
            zip.file('project-info.txt', projectInfo);
            
            // Add project JSON file for import (with version info)
            const projectWithFeatures = {
                ...project,
                features: features,
                // Include version information for re-import
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    version: versionInfo?.version || '1.0.0',
                    versionStatus: versionInfo?.status || 'UNKNOWN',
                    releaseNotes: versionInfo?.releaseNotes || 'اطلاعات نسخه موجود نیست'
                }
            };
            const projectJSON = JSON.stringify(projectWithFeatures, null, 2);
            zip.file(`${project.name}.json`, projectJSON);
            
            // Create and add HTML file
            const htmlContent = createBeautifulHTML(projectWithFeatures, features);
            zip.file(`${project.name}.html`, htmlContent);
            
            // Add each feature as a separate folder with .feature file
            if (Array.isArray(features)) {
                features.forEach((feature) => {
                    const folderName = feature.name.replace(/[<>:"/\\|?*]/g, '_').trim() || `feature-${feature.id}`;
                    const featureFolder = zip.folder(folderName);
                    if (featureFolder) {
                        const gherkin = createGherkinFromFeature(feature);
                        featureFolder.file(`${folderName}.feature`, gherkin);
                        // Add info.txt for each feature
                        // const featureInfo = createFeatureInfo(feature);
                        // featureFolder.file('info.txt', featureInfo);
                    }
                });
            }
            
            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${project.name}-features.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success('خروجی ZIP با موفقیت تکمیل شد!');
        } catch (error) {
            console.error('خطا در export ZIP:', error);
            toast.error('خطا در export ZIP');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6">


            {/* Project Header */}
            <div className="mb-12">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
                    <div className="flex-1">
                        {/* Project Title and Status */}
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-semibold">{project.name}</h1>
                            
                            {/* Elegant Git-like Status Indicator */}
                            {statusLoading ? (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                                    <div className="h-2 w-2 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                                    بررسی...
                                </div>
                            ) : projectStatus ? (
                                <div className="flex items-center gap-2">
                                    {projectStatus.hasChanges ? (
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                                            <div className="relative">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
                                            </div>
                                            <span className="text-xs font-medium text-green-700">آماده انتشار</span>
                                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 border-green-200 px-1.5 py-0">
                                                v{projectStatus.latestVersion}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                            <span className="text-xs text-gray-600">همگام</span>
                                            <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300 px-1.5 py-0">
                                                v{projectStatus.latestVersion}
                                            </Badge>
                                        </div>
                                    )}
                                    
                                    {projectStatus.hasPendingVersion && (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200">
                                            <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                                            <span className="text-[10px] text-amber-700 font-medium">در انتظار تایید</span>
                                        </div>
                                    )}
                                    
                                    {/* Detailed Changes Tooltip */}
                                    {projectStatus.hasChanges && projectStatus.changeSummary && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-200 cursor-help">
                                                        <GitBranch className="h-3 w-3 text-blue-600" />
                                                        <span className="text-[10px] text-blue-700 font-medium">
                                                            {(projectStatus.changeSummary.addedFeatures || 0) + 
                                                             (projectStatus.changeSummary.removedFeatures || 0) + 
                                                             (projectStatus.changeSummary.modifiedFeatures || 0) +
                                                             (projectStatus.changeSummary.addedScenarios || 0) +
                                                             (projectStatus.changeSummary.removedScenarios || 0) +
                                                             (projectStatus.changeSummary.modifiedScenarios || 0)} تغییر
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent 
                                                    side="bottom" 
                                                    className="max-w-sm p-4 bg-white border border-gray-200 shadow-lg rounded-lg"
                                                    sideOffset={8}
                                                >
                                                    <div className="space-y-3 text-sm">
                                                        <div className="font-semibold text-gray-900 pb-1 border-b border-gray-100">
                                                            📊 خلاصه تغییرات
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <div className="font-medium text-gray-800 text-xs flex items-center gap-1">
                                                                    🎯 ویژگی‌ها
                                                                </div>
                                                                <div className="space-y-1 pr-2">
                                                                    {projectStatus.changeSummary.addedFeatures > 0 && (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="w-4 h-4 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-[10px]">+</span>
                                                                            <span className="text-green-700 font-medium">{projectStatus.changeSummary.addedFeatures} اضافه</span>
                                                                        </div>
                                                                    )}
                                                                    {projectStatus.changeSummary.modifiedFeatures > 0 && (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-[10px]">~</span>
                                                                            <span className="text-blue-700 font-medium">{projectStatus.changeSummary.modifiedFeatures} تغییر</span>
                                                                        </div>
                                                                    )}
                                                                    {projectStatus.changeSummary.removedFeatures > 0 && (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="w-4 h-4 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-[10px]">-</span>
                                                                            <span className="text-red-700 font-medium">{projectStatus.changeSummary.removedFeatures} حذف</span>
                                                                        </div>
                                                                    )}
                                                                    {!projectStatus.changeSummary.addedFeatures && !projectStatus.changeSummary.modifiedFeatures && !projectStatus.changeSummary.removedFeatures && (
                                                                        <div className="text-xs text-gray-500">بدون تغییر</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="font-medium text-gray-800 text-xs flex items-center gap-1">
                                                                    📝 سناریوها
                                                                </div>
                                                                <div className="space-y-1 pr-2">
                                                                    {projectStatus.changeSummary.addedScenarios > 0 && (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="w-4 h-4 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-[10px]">+</span>
                                                                            <span className="text-green-700 font-medium">{projectStatus.changeSummary.addedScenarios} اضافه</span>
                                                                        </div>
                                                                    )}
                                                                    {projectStatus.changeSummary.modifiedScenarios > 0 && (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-[10px]">~</span>
                                                                            <span className="text-blue-700 font-medium">{projectStatus.changeSummary.modifiedScenarios} تغییر</span>
                                                                        </div>
                                                                    )}
                                                                    {projectStatus.changeSummary.removedScenarios > 0 && (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="w-4 h-4 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-[10px]">-</span>
                                                                            <span className="text-red-700 font-medium">{projectStatus.changeSummary.removedScenarios} حذف</span>
                                                                        </div>
                                                                    )}
                                                                    {!projectStatus.changeSummary.addedScenarios && !projectStatus.changeSummary.modifiedScenarios && !projectStatus.changeSummary.removedScenarios && (
                                                                        <div className="text-xs text-gray-500">بدون تغییر</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            ) : null}
                        </div>
                        
                        {/* Project Description */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="text-muted-foreground max-w-2xl line-clamp-2 cursor-help">
                                        {project.description}
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                    <p>{project.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
                        <Button 
                            onClick={() => setIsSheetOpen(true)}
                            disabled={isLockedComputed}
                        >
                                                                            <Plus className="h-4 w-4 ml-2" />
                                                ویژگی جدید
                        </Button>
                        {isLockedComputed && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                                <Clock className="h-4 w-4 animate-pulse" />
                                <span className="text-sm font-medium">در انتظار تایید QA Manager</span>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShareDialogOpen(true)}
                        >
                                                                    <Share2 className="h-4 w-4 mr-1" />
                                        اشتراک‌گذاری
                        </Button>
                        

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={exporting}>
                                                                            <Download className="w-4 h-4 ml-2" />
                                    {exporting ? 'در حال export...' : 'خروجی ZIP'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md" dir="rtl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Download className="w-5 h-5" />
                                        دانلود پروژه (ZIP)
                                    </DialogTitle>
                                    <DialogDescription>
                                        فایل ZIP شامل تمام ویژگی‌ها، گزارش HTML و فایل‌های .feature دانلود خواهد شد
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 py-4">
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Download className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">فایل ZIP کامل</div>
                                            <div className="text-sm text-muted-foreground">
                                                شامل HTML، فایل‌های .feature و اطلاعات پروژه
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleExportZIP} 
                                        className="w-full"
                                        disabled={exporting}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {exporting ? 'در حال دانلود...' : 'دانلود ZIP'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                {/* Project Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 flex-row-reverse">
                        <span>مراحل</span>
                        <span className="font-medium">{features.reduce((acc, feature) => acc + (feature.background?.steps?.length || 0) + (feature.scenarios?.reduce((scenarioAcc, scenario) => scenarioAcc + (scenario.steps?.length || 0), 0) || 0), 0)}</span>
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-2 flex-row-reverse">
                        <span>ویژگی‌ها</span>
                        <span className="font-medium">{features.length}</span>
                        <Layers className="h-4 w-4 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Enhanced Tabs for Features and Versions */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'features' | 'versions')} className="space-y-6" dir="rtl">
                <TabsList className="grid w-full max-w-md grid-cols-2 ml-auto" dir="rtl">
                    <TabsTrigger value="features" className="flex items-center gap-2 text-sm flex-row-reverse">
                        <Badge variant="secondary" className="mr-1 text-xs">{features.length}</Badge>
                        ویژگی‌ها
                        <FileCode className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="versions" className="flex items-center gap-2 text-sm flex-row-reverse">
                        نسخه‌گذاری
                        <GitBranch className="h-4 w-4" />
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="space-y-6" dir="rtl">
                    {/* Features Timeline */}
                    <DndContext 
                        sensors={isLockedComputed ? [] : sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={isLockedComputed ? () => {} : handleDragEnd}
                    >
                      <SortableContext items={features.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-10">
                          {features.map((feature, index) => (
                            <SortableFeature key={feature.id} feature={feature}>
                                {({ listeners }) => (
                                    <div key={feature.id} className="relative">
                                        {/* Timeline vertical line */}
                                        {index !== features.length - 1 && (
                                            <div className="absolute right-5 top-10 w-px h-full bg-border -mr-px" />
                                        )}
                                        <div className="flex gap-4 sm:gap-6 items-start">
                                            <div className="flex-shrink-0 z-10">
                                                <div className="w-11 h-11 rounded-full bg-background border-2 flex items-center justify-center">
                                                    <FileCode className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1.5">
                                                {/* Drag handle در گوشه بالا سمت راست کارت */}
                                                {!project.isLocked && (
                                                    <button
                                                        type="button"
                                                        aria-label="جابجایی ویژگی"
                                                        style={{ position: 'absolute', top: 12, right: -22, background: 'none', border: 'none', cursor: 'grab', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                                                        {...listeners}
                                                    >
                                                        <GripVertical className="w-4 h-4 text-gray-300 hover:text-gray-500 transition" />
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-2 mb-3" dir="rtl">
                                                    <div className="flex items-center gap-2">
                                                        {/* منو */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" aria-label="Feature Actions">
                                                                    <EllipsisVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-40" align="start">
                                                                <DropdownMenuItem 
                                                                    onSelect={() => window.location.href = `/projects/${project.id}/features/${feature.id}/edit`}
                                                                    disabled={project.isLocked}
                                                                    className="flex items-center justify-end gap-2 text-right"
                                                                >
                                                                    <span>ویرایش</span>
                                                                    <Edit className="h-4 w-4" />
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() => setFeatureToDelete(feature)}
                                                                    disabled={project.isLocked}
                                                                    className="flex items-center justify-end gap-2 text-right text-red-600 focus:text-red-700 focus:bg-red-50"
                                                                >
                                                                    <span>حذف</span>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <span className="font-bold text-lg truncate max-w-xs" title={feature.name}>{feature.name}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4 text-right">
                                                    {feature.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm justify-start">
                                                    <div className="flex items-center gap-2">
                                                        <CheckSquare className="h-4 w-4 text-blue-500" />
                                                        <span className="font-medium">
                                                            {(() => {
                                                                const backgroundSteps = feature.background?.steps?.length || 0;
                                                                const scenarioSteps = feature.scenarios?.reduce((acc, scenario) => acc + (scenario.steps?.length || 0), 0) || 0;
                                                                const totalSteps = backgroundSteps + scenarioSteps;
                                                                return totalSteps;
                                                            })()}
                                                        </span>
                                                        <span className="text-muted-foreground">مراحل</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Layers className="h-4 w-4 text-green-500" />
                                                        <span className="font-medium">{feature.scenarios?.length || 0}</span>
                                                        <span className="text-muted-foreground">سناریوها</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </SortableFeature>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {/* Empty State */}
                    {features.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <FileCode className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">هنوز ویژگی‌ای وجود ندارد</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                اولین ویژگی خود را ایجاد کنید تا شروع به نوشتن سناریوها و مراحل تست کنید.
                            </p>
                            <Button onClick={() => setIsSheetOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                افزودن اولین ویژگی
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="versions" className="space-y-6" dir="rtl">
                    <VersionManagement 
                        projectId={project.id} 
                        isOwner={true}
                        isLocked={project.isLocked || false}
                        externalProjectStatus={projectStatus}
                    />
                </TabsContent>
            </Tabs>



            {/* Dialogs that are controlled by this component */}
            <CreateFeatureSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onFeatureCreated={feature => setFeatures(prev => [feature, ...prev])}
                projectId={project.id}
            />
            <ShareProjectDialog
                open={isShareDialogOpen}
                onOpenChange={setShareDialogOpen}
                project={project}
                features={features}
            />



            <AlertDialog open={!!featureToDelete} onOpenChange={(open) => !open && setFeatureToDelete(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>آیا از حذف این ویژگی مطمئن هستید؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            این عمل قابل بازگشت نیست. با این کار ویژگی «{featureToDelete?.name}» و تمام سناریوهای آن برای همیشه حذف خواهند شد.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFeature} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            حذف کن
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}