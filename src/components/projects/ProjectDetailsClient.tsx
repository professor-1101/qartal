"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Edit, ArrowRight, FileCode, CheckSquare, GitBranch, EllipsisVertical, Share2, Trash2 } from "lucide-react";
import { Feature, Project } from '@/types/index';
import { CreateFeatureSheet } from "@/components/projects/create-feature-sheet";
import { ShareProjectDialog } from "@/components/projects/share-project-dialog";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { JSONExportService } from "@/lib/json-export";
import { PDFExportService } from "@/lib/pdf-export";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectDetailsClientProps {
    project: Project;
    features: Feature[];
}

export default function ProjectDetailsClient({ project, features: initialFeatures }: ProjectDetailsClientProps) {
    const [features, setFeatures] = useState<Feature[]>(initialFeatures);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isShareDialogOpen, setShareDialogOpen] = React.useState(false);
    const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);

    const handleCreateFeature = async (data: { title: string; description: string }) => {
        try {
            const response = await fetch(`/api/projects/${project.id}/gherkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.title,
                    description: data.description,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create feature');
            }

            const newFeature = await response.json();
            setFeatures(prevFeatures => [...prevFeatures, newFeature]);
            setIsSheetOpen(false);
        } catch (error) {
            console.error("Error creating feature:", error);
        }
    };

    const handleDeleteFeature = async () => {
        if (!featureToDelete) return;

        try {
            const res = await fetch(`/api/projects/${project.id}/features/${featureToDelete.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            setFeatures(prev => prev.filter(f => f.id !== featureToDelete.id));
            toast.success("ویژگی با موفقیت حذف شد.");
        } catch {
            toast.error("حذف ویژگی با خطا مواجه شد.");
        } finally {
            setFeatureToDelete(null);
        }
    };

    // --- تغییر مهم: تابع sanitize با fallback ---
    const sanitize = (name: string, fallback: string) => {
        const sanitized = name?.trim().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
        return sanitized && sanitized.length > 0 ? sanitized : fallback;
    };

    const handleExportProject = async () => {
        const zip = new JSZip();
        const jsonExporter = new JSONExportService();
        const pdfExporter = new PDFExportService();

        const projectName = sanitize(project.name, `project-${project.id}`);

        // Project-wide PDF (all features)
        if (features.length > 0 && typeof pdfExporter.exportProjectAsPDF === 'function') {
            const projectPdfBlob = await pdfExporter.exportProjectAsPDF(features, { language: 'fa' });
            zip.file(`${projectName}.pdf`, projectPdfBlob, { binary: true });
        }

        for (const feature of features) {
            const featureName = sanitize(feature.name, `feature-${feature.id}`);
            const folder = zip.folder(featureName)!;

            // JSON export
            const json = jsonExporter.exportFeatureAsJSON(feature);
            folder.file(`${featureName}.json`, json, { binary: false });

            // Gherkin .feature export
            let gherkin = `Feature: ${feature.name}\n`;
            if (feature.description) gherkin += `  ${feature.description}\n\n`;
            if (feature.background && feature.background.steps.length > 0) {
                gherkin += `  Background:\n`;
                feature.background.steps.forEach(step => {
                    gherkin += `    ${step.keyword} ${step.text}\n`;
                });
                gherkin += `\n`;
            }
            feature.scenarios.forEach(scenario => {
                gherkin += `  ${scenario.type === 'scenario-outline' ? 'Scenario Outline' : 'Scenario'}: ${scenario.name}\n`;
                if (scenario.description) gherkin += `    ${scenario.description}\n`;
                scenario.steps.forEach(step => {
                    gherkin += `    ${step.keyword} ${step.text}\n`;
                });
                if (scenario.type === 'scenario-outline' && scenario.examples) {
                    gherkin += `    Examples:\n`;
                    gherkin += `      | ${scenario.examples.headers.join(' | ')} |\n`;
                    scenario.examples.rows.forEach(row => {
                        gherkin += `      | ${row.values.join(' | ')} |\n`;
                    });
                }
                gherkin += `\n`;
            });
            folder.file(`${featureName}.feature`, gherkin, { binary: false });
        }

        // Generate and save the zip
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${projectName}.zip`);
    };

    return (
        <div className="w-full px-4 sm:px-6 py-10">
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
                        <Button variant="outline" size="sm" onClick={handleExportProject}>
                            <FileCode className="h-4 w-4 ml-1" />
                            خروجی
                        </Button>
                    </div>
                </div>
                {/* Project Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{features.reduce((acc, feature) => acc + (feature.background?.steps?.length || 0) + (feature.scenarios?.reduce((scenarioAcc, scenario) => scenarioAcc + (scenario.steps?.length || 0), 0) || 0), 0)}</span>
                        <span>مراحل</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{features.length}</span>
                        <span>ویژگی‌ها</span>
                    </div>
                </div>
            </div>

            {/* Features Timeline */}
            <div className="space-y-10">
                {features.map((feature, index) => {
                    const featureSteps = (feature.background?.steps?.length || 0) +
                        (feature.scenarios?.reduce((acc, scenario) => acc + (scenario.steps?.length || 0), 0) || 0);
                    const featureScenarios = feature.scenarios?.length || 0;

                    return (
                        <div key={feature.id} className="relative">
                            {/* Timeline vertical line */}
                            {index !== features.length - 1 && (
                                <div className="absolute right-5 top-10 w-px h-full bg-border -mr-px" />
                            )}

                            <div className="flex gap-4 sm:gap-6">
                                <div className="flex-shrink-0 z-10">
                                    <div className="w-11 h-11 rounded-full bg-background border-2 flex items-center justify-center">
                                        <FileCode className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <h3 className="text-xl font-medium truncate">{feature.name}</h3>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" aria-label="Feature Actions">
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-40 text-right p-2" align="end">
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
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {feature.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">{featureSteps}</span>
                                            <span className="text-muted-foreground">مراحل</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4 text-green-500" />
                                            <span className="font-medium">{featureScenarios}</span>
                                            <span className="text-muted-foreground">سناریوها</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

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