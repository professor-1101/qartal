"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { ShareProjectDialog } from "@/components/projects/share-project-dialog";
import { useI18n } from "@/i18n";
import { FolderOpen, Upload } from "lucide-react";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";
import { toast } from "sonner";

interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    gherkinFiles: any[];
    _count: {
        gherkinFiles: number;
        features: number;
    };
    features?: any[]; // Allow features for imported projects
}

export default function ProjectsContent() {
    const { t } = useI18n();
    const router = useRouter();
    const {  status } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

    // Fetch projects from API
    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if user is authenticated
            if (status === "loading") {
                return; // Wait for session to load
            }

            if (status === "unauthenticated") {
                router.push("/sign-in");
                return;
            }

            const response = await fetch("/api/projects");

            if (!response.ok) {
                if (response.status === 401) {
                    router.push("/sign-in");
                    return;
                }
                throw new Error("Failed to fetch projects");
            }

            const data = await response.json();
            console.log('Fetched projects:', data);
            setProjects(data);
        } catch (err) {
            setError("خطا در بارگذاری پروژه‌ها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [status]);

    const handleCreateProject = async (projectData: { name: string; description?: string }) => {
        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(projectData),
            });

            if (!response.ok) {
                throw new Error("Failed to create project");
            }

            const newProject = await response.json();
            setProjects(prev => [newProject, ...prev]);
            setIsCreateDialogOpen(false);
        } catch (err) {
            // Handle error (show toast, etc.)
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete project");
            }

            setProjects(prev => prev.filter(p => p.id !== projectId));
            setIsDeleteDialogOpen(false);
            setSelectedProject(null);
        } catch (err) {
            // Handle error (show toast, etc.)
        }
    };

    const handleEditProject = async (projectId: string, projectData: { name: string; description?: string }) => {
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(projectData),
            });

            if (!response.ok) {
                throw new Error("Failed to update project");
            }

            // Instead of using the response, fetch fresh data
            await fetchProjects();
            setIsEditDialogOpen(false);
            setSelectedProject(null);
        } catch (err) {
            // Handle error (show toast, etc.)
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.log('Invalid date string:', dateString);
                return 'تاریخ نامعتبر';
            }
            console.log('Formatting date:', dateString, 'to:', date.toLocaleDateString("fa-IR", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));
            return date.toLocaleDateString("fa-IR", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.log('Error formatting date:', error);
            return 'تاریخ نامعتبر';
        }
    };

    // --- Import JSON Handler ---
    const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            let importedProjects = [];
            if (Array.isArray(imported)) {
                importedProjects = imported;
            } else {
                importedProjects = [imported];
            }
            // Validate and normalize all imported projects
            for (const proj of importedProjects) {
                if (!proj) {
                    toast.error('ساختار فایل JSON معتبر نیست.');
                    return;
                }
                if (!Array.isArray(proj.features)) {
                    proj.features = [];
                }
            }
            // Send each project to the import API
            let allSuccess = true;
            for (const proj of importedProjects) {
                const res = await fetch('/api/projects/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(proj)
                });
                if (!res.ok) {
                    const err = await res.json();
                    toast.error(`ایمپورت پروژه ${proj.name || proj.id} شکست خورد: ${err.error || 'خطای سرور'}`);
                    console.error('Import error:', err);
                    allSuccess = false;
                }
            }
            await fetchProjects(); // Refetch from server
            if (allSuccess) {
                toast.success('پروژه(ها) با موفقیت ایمپورت شد!');
            } else {
                toast.error('برخی پروژه‌ها ایمپورت نشدند.');
            }
        } catch (e) {
            toast.error('خطا در ایمپورت فایل JSON');
        }
    };

    // Show loading while session is loading
    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Redirect to sign-in if not authenticated
    if (status === "unauthenticated") {
        router.replace("/sign-in");
        return null;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={fetchProjects}>تلاش مجدد</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title={t("projects.title")}
                description={t("projects.description")}
                actions={
                    <div className="flex gap-2">
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Icons.plus className="mr-2 h-4 w-4" />
                            {t("projects.createNew")}
                        </Button>
                        {/* Import JSON Button */}
                        <label htmlFor="import-json" className="inline-flex items-center cursor-pointer">
                            <input
                                id="import-json"
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={handleImportJSON}
                            />
                            <Button variant="outline" size="sm" asChild>
                                <span>
                                    <Upload className="w-4 h-4 ml-2" />
                                    ایمپورت JSON
                                </span>
                            </Button>
                        </label>
                    </div>
                }
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => {
                    const features = Array.isArray(project.features) ? project.features : [];
                    // Count features
                    const featureCount = features.length || project._count?.features || 0;
                    // Count steps (background + all scenario steps)
                    let stepCount = 0;
                    for (const feature of features) {
                        if (feature.background && Array.isArray(feature.background.steps)) {
                            stepCount += feature.background.steps.length;
                        }
                        if (Array.isArray(feature.scenarios)) {
                            for (const scenario of feature.scenarios) {
                                if (Array.isArray(scenario.steps)) {
                                    stepCount += scenario.steps.length;
                                }
                            }
                        }
                    }
                    return (
                        <Card key={project.id} className="group bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between min-h-[260px] p-4">
                            <CardHeader className="pb-2 px-0">
                                <CardTitle className="text-lg font-bold mb-1 text-right truncate" title={project.name}>{project.name}</CardTitle>
                                <CardDescription className="line-clamp-3 w-full mb-2 min-h-[66px] text-gray-500 text-sm text-right overflow-hidden text-ellipsis leading-6" style={{direction:'rtl'}}>{project.description || t("projects.noDescription")}</CardDescription>
                            </CardHeader>
                            <div className="flex items-center justify-end gap-2 px-0 pb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedProject(project);
                                        setIsEditDialogOpen(true);
                                    }}
                                >
                                    <Icons.edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedProject(project);
                                        setIsShareDialogOpen(true);
                                    }}
                                >
                                    <Icons.share className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedProject(project);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                >
                                    <Icons.trash className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardContent className="pt-0 mt-auto px-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{t("projects.features")}</span>
                                        <Badge variant="secondary">{featureCount}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{t("projects.steps")}</span>
                                        <Badge variant="secondary">{stepCount}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{t("projects.lastUpdated")}</span>
                                        <span>{formatDate(project.updatedAt)}</span>
                                    </div>
                                    <Button className="w-full mt-2" onClick={() => router.push(`/projects/${project.id}`)}>
                                        {t("projects.viewProject")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {projects.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("projects.noProjects")}</h3>
                    <p className="text-sm mb-4">{t("projects.noProjectsDescription")}</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Icons.plus className="mr-2 h-4 w-4" />
                        {t("projects.createFirst")}
                    </Button>
                </div>
            )}

            <CreateProjectDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onProjectCreated={handleCreateProject}
            />

            <DeleteProjectDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                project={selectedProject as any}
                onProjectDeleted={(projectId: string) => handleDeleteProject(projectId)}
            />

            <EditProjectDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                project={selectedProject as any}
                onProjectUpdated={(data: any) => selectedProject && handleEditProject(selectedProject.id, data)}
            />

            <ShareProjectDialog
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                project={selectedProject as any}
            />
        </div>
    );
}