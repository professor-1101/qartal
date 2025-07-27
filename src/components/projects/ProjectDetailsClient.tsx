"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Edit,  FileCode, CheckSquare, Layers, EllipsisVertical, Share2, Trash2, Download, GripVertical } from "lucide-react";
import { Feature, Project } from '@/types/index';
import { CreateFeatureSheet } from "@/components/projects/create-feature-sheet";
import { ShareProjectDialog } from "@/components/projects/share-project-dialog";
import { 
    createGherkinFromFeature, 
    createProjectInfo,
    createBeautifulHTML
} from "@/lib/export-utils";
import { toast } from "sonner";

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
    project: Project;
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
        const newFeatures = arrayMove(features, oldIndex, newIndex).map((f, idx) => ({ ...f, order: idx + 1 }));
        setFeatures(newFeatures);
        await fetch(`/api/projects/${project.id}/features/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features: newFeatures.map(f => ({ id: f.id, order: f.order })) })
        });
      }
    };

    // --- Export Handlers ---
    
    const handleExportZIP = async () => {
        try {
            setExporting(true);
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            
            // Add project info file
            const projectInfo = createProjectInfo(project, features);
            zip.file('project-info.txt', projectInfo);
            
            // Add project JSON file for import
            const projectWithFeatures = {
                ...project,
                features: features
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
            
            toast.success('ZIP export completed successfully!');
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
                    <div>
                        {/* Modified: Breadcrumb/Page Title */}
                        <h1 className="text-3xl font-semibold mb-2">{project.name}</h1>
                        {/* Modified: Project Description */}
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={() => setIsSheetOpen(true)}>
                            <Plus className="h-4 w-4 ml-2" />
                            ویژگی جدید
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShareDialogOpen(true)}
                        >
                            <Share2 className="h-4 w-4 ml-1" />
                            اشتراک‌گذاری
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={exporting}>
                                    <Download className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
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
                                        <Download className="w-4 h-4 ml-2" />
                                        {exporting ? 'در حال دانلود...' : 'دانلود ZIP'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                {/* Project Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{features.reduce((acc, feature) => acc + (feature.background?.steps?.length || 0) + (feature.scenarios?.reduce((scenarioAcc, scenario) => scenarioAcc + (scenario.steps?.length || 0), 0) || 0), 0)}</span>
                        <span>مراحل</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{features.length}</span>
                        <span>ویژگی‌ها</span>
                    </div>
                </div>
            </div>

            {/* Features Timeline */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                                        <button
                                            type="button"
                                            aria-label="جابجایی ویژگی"
                                            style={{ position: 'absolute', top: 12, right: -22, background: 'none', border: 'none', cursor: 'grab', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                                            {...listeners}
                                        >
                                            <GripVertical className="w-4 h-4 text-gray-300 hover:text-gray-500 transition" />
                                        </button>
                                        <div className="flex items-center flex-row-reverse justify-end gap-2 mb-3 text-right">
                                            <span className="font-bold text-lg truncate max-w-xs" title={feature.name}>{feature.name}</span>
                                            {/* منو */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" aria-label="Feature Actions">
                                                        <EllipsisVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-40 text-right p-2" align="end">
                                                    <div dir="rtl">
                                                        <DropdownMenuItem onSelect={() => window.location.href = `/projects/${project.id}/features/${feature.id}/edit`}>
                                                            <Edit className="h-4 w-4 ml-2" />
                                                            ویرایش
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => setFeatureToDelete(feature)}
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                        >
                                                            <span className="flex items-center">
                                                                <Trash2 className="h-4 w-4 ml-2" />
                                                                حذف
                                                            </span>
                                                        </DropdownMenuItem>
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {feature.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
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
                        <Plus className="h-4 w-4 ml-2" />
                        افزودن اولین ویژگی
                    </Button>
                </div>
            )}

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