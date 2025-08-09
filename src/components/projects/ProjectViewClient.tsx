"use client";
// @ts-nocheck

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    GitBranch, 
    CheckCircle, 
    Clock, 
    User, 
    Calendar,
    Eye,
    Download,
    Copy,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { createBeautifulHTML } from "@/lib/export-utils";
import { toast } from "sonner";

interface ProjectViewClientProps {
    project: any;
    features: any[];
    approvedFeatures: any[];
    latestApprovedVersion: any;
    compact?: boolean;
}

export default function ProjectViewClient({ project, features, approvedFeatures, latestApprovedVersion, compact = false }: ProjectViewClientProps) {
    const [activeTab, setActiveTab] = useState<'public' | 'latest'>('public');
    const [exporting, setExporting] = useState(false);

    const featureListForActiveTab = useMemo(() => {
        if (activeTab === 'public' && latestApprovedVersion) return approvedFeatures;
        return features;
    }, [activeTab, approvedFeatures, features, latestApprovedVersion]);

    const handleExportHTML = async () => {
        try {
            setExporting(true);
            const projectWithFeatures = {
                ...project,
                features: features
            };
            const htmlContent = createBeautifulHTML(projectWithFeatures, features);
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${project.name}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('خروجی HTML با موفقیت دانلود شد!');
        } catch (error) {
            console.error('خطا در export HTML:', error);
            toast.error('خطا در export HTML');
        } finally {
            setExporting(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            const url = `${window.location.origin}/projects/${project.id}/view`;
            await navigator.clipboard.writeText(url);
            toast.success('لینک کپی شد!');
        } catch (error) {
            toast.error('خطا در کپی لینک');
        }
    };

    const getStepTypeColor = (type: string) => {
        const t = (type || '').toString();
        const upper = t.toUpperCase();
        if (upper === 'GIVEN' || t === 'فرض' || t === 'با فرض') {
            return 'bg-purple-50 text-purple-700 border border-purple-200 rounded px-1 font-semibold';
        }
        if (upper === 'WHEN' || t === 'وقتی' || t === 'هنگامی که') {
            return 'bg-blue-50 text-blue-700 border border-blue-200 rounded px-1 font-semibold';
        }
        if (upper === 'THEN' || t === 'آنگاه') {
            return 'bg-green-50 text-green-700 border border-green-200 rounded px-1 font-semibold';
        }
        if (upper === 'AND' || t === 'و') {
            return 'bg-gray-50 text-gray-700 border border-gray-200 rounded px-1 font-semibold';
        }
        if (upper === 'BUT' || t === 'اما') {
            return 'bg-red-50 text-red-700 border border-red-200 rounded px-1 font-semibold';
        }
        return 'text-gray-600';
    };

    // remove circular icons for gherkin keywords in public view per request
    const getStepTypeIcon = (_type: string) => '';

    const formatFaDate = (value: any): string => {
        try {
            const d = new Date(value);
            if (isNaN(d.getTime())) return 'تاریخ نامعتبر';
            return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return 'تاریخ نامعتبر';
        }
    };

    return (
        <div className={`container ${compact ? 'py-6' : 'py-10'}`} dir="rtl">
            {/* Inline header removed per request; actions moved into info card grid */}

            {/* Project Info Card */}
            <Card className={compact ? 'mb-4' : 'mb-6'}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`bg-primary/10 rounded-lg ${compact ? 'p-1.5' : 'p-2'}`}>
                                <FileText className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
                            </div>
                            <div>
                                <CardTitle className={`${compact ? 'text-lg' : 'text-xl'}`}>{project.name}</CardTitle>
                                <p className={`text-muted-foreground mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>{project.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={project.isLocked ? "destructive" : "secondary"}>
                                {project.isLocked ? "قفل شده" : "آزاد"}
                            </Badge>
                            {latestApprovedVersion && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    نسخه {latestApprovedVersion.version}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                            <User className="h-4 w-4" />
                            <span>مالک پروژه:</span>
                            <span className="font-medium text-gray-700">
                                {project.user.firstName} {project.user.lastName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>تاریخ ایجاد:</span>
                            <span className="font-medium text-gray-700">
                                {formatFaDate(project.createdAt)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <GitBranch className="h-4 w-4" />
                            <span>تعداد ویژگی‌ها:</span>
                            <span className="font-medium text-gray-700">{features.length}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>آخرین بروزرسانی:</span>
                            <span className="font-medium text-gray-700">{formatFaDate(project.updatedAt)}</span>
                        </div>
                        {/* Actions moved here */}
                        <div className="md:col-span-3 flex flex-wrap items-center gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className="flex items-center gap-2"
                            >
                                <Copy className="h-4 w-4" />
                                کپی لینک
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportHTML}
                                disabled={exporting}
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                {exporting ? 'در حال دانلود...' : 'خروجی HTML'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs + TOC/Content grid */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'public' | 'latest')} className="space-y-6" dir="rtl">
                <TabsList className="grid w-full max-w-md grid-cols-2 ml-auto" dir="rtl">
                    <TabsTrigger value="public" className="flex items-center gap-2 text-sm flex-row-reverse">
                        <Eye className="h-4 w-4" />
                        نمایش عمومی
                    </TabsTrigger>
                    <TabsTrigger value="latest" className="flex items-center gap-2 text-sm flex-row-reverse">
                        <Clock className="h-4 w-4" />
                        آخرین تغییرات
                    </TabsTrigger>
                </TabsList>
                {/* Tabs body contains a grid: TOC + content */}
                <div className={`grid ${compact ? 'gap-4' : 'gap-6'} md:grid-cols-4`}>
                    {/* TOC */}
                    <aside className="md:col-span-1 order-2 md:order-1 lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle className={`text-right ${compact ? 'text-base' : ''}`}>فهرست ویژگی‌ها</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {featureListForActiveTab.length === 0 ? (
                                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground text-right`}>ویژگی‌ای برای نمایش موجود نیست.</p>
                                ) : (
                                    <nav className="space-y-1">
                                        {featureListForActiveTab.map((f) => (
                                            <button
                                                key={f.id}
                                                onClick={() => {
                                                    const el = document.getElementById(`feature-${f.id}`);
                                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }}
                                                className={`w-full text-right rounded hover:bg-accent ${compact ? 'px-3 py-2 text-[14px]' : 'px-3 py-2 text-sm'}`}
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                    </nav>
                                )}
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Content */}
                    <div className="md:col-span-3 order-1 md:order-2">
                        <TabsContent value="public" className={compact ? 'space-y-4' : 'space-y-6'} dir="rtl">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className={`flex items-center gap-2 ${compact ? 'text-base' : ''}`}>
                                            <CheckCircle className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-green-600`} />
                                            <span>نسخه تایید شده</span>
                                        </CardTitle>
                                        {latestApprovedVersion && (
                                            <Badge variant="outline">
                                                نسخه {latestApprovedVersion.version}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {latestApprovedVersion ? (
                                        <div className={compact ? 'space-y-3' : 'space-y-4'}>
                                            <div className={`bg-green-50 border border-green-200 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-green-600"`} />
                                                    <span className={`${compact ? 'text-sm' : ''} font-medium text-green-800`}>نسخه تایید شده</span>
                                                </div>
                                                <p className={`${compact ? 'text-xs' : 'text-sm'} text-green-700`}>
                                            {latestApprovedVersion?.approvedAt ? (
                                                <>این نسخه در تاریخ {new Date(latestApprovedVersion.approvedAt).toLocaleDateString('fa-IR')} </>
                                            ) : (
                                                <>این نسخه تایید شده است </>
                                            )}
                                            {latestApprovedVersion?.approvedBy ? (
                                                <>توسط {latestApprovedVersion.approvedBy.firstName} {latestApprovedVersion.approvedBy.lastName} تایید شده است.</>
                                            ) : (
                                                <>توسط ناظر تایید شده است.</>
                                            )}
                                        </p>
                                            </div>

                                            {/* Accordion of approved features */}
                                            <Accordion type="multiple" className="w-full">
                                                {approvedFeatures.map((feature) => (
                                                    <AccordionItem value={feature.id} key={feature.id}>
                                                        <div id={`feature-${feature.id}`} />
                                                        <AccordionTrigger className="text-right">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-green-600`} />
                                                                <span className="font-medium text-base md:text-lg">{feature.name}</span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            {feature.description && (
                                                                <p className={`text-[13px] md:text-sm text-muted-foreground mb-3 text-right`}>{feature.description}</p>
                                                            )}
                                                            <div className="space-y-4">
                                                                {feature.background && feature.background.steps.length > 0 && (
                                                                    <div className={`bg-gray-50 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
                                                                        <h4 className="font-medium mb-3 text-gray-700">پس‌زمینه</h4>
                                                                        <div className="space-y-2">
                                                                            {feature.background.steps.map((step: any) => (
                                                                                <div key={step.id} className="flex items-start gap-2 text-sm">
                                                                                     <span className={`font-medium min-w-[60px] ${getStepTypeColor(step.keyword || step.type)}`}>
                                                                                        {step.keyword || step.type}
                                                                                    </span>
                                                                                    <span className="text-gray-700">{step.text}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {feature.scenarios.map((scenario: any) => (
                                                                 <div key={scenario.id} className="border rounded-lg p-4 text-[13px] leading-6 md:text-sm">
                                                                        <h4 className="font-medium mb-3 text-gray-700">{scenario.name}</h4>
                                                                        {scenario.description && (
                                                                            <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                                                                        )}

                                                                        <div className="space-y-2">
                                                                            {scenario.steps.map((step: any) => (
                                                                                <div key={step.id} className="flex items-start gap-2 text-sm">
                                                                                     <span className={`font-medium min-w-[54px] ${getStepTypeColor(step.keyword || step.type)} text-[12px] md:text-xs`}>
                                                                                         {step.keyword || step.type}
                                                                                    </span>
                                                                                    <span className="text-gray-700">{step.text}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {scenario.examples.length > 0 && scenario.examples[0].rows.length > 0 && (
                                                                            <div className="mt-4">
                                                                                <h5 className="font-medium mb-2 text-gray-600">مثال‌ها</h5>
                                                                                <div className="overflow-x-auto">
                                                                        <table className={`min-w-full border border-gray-200 rounded-lg ${compact ? 'text-xs' : ''}`}>
                                                                                        <thead className="bg-gray-50">
                                                                                            <tr>
                                                                                                {scenario.examples[0].headers.map((header: any, idx: number) => (
                                                                                        <th key={idx} className={`px-3 py-2 text-right ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 border-b`}>
                                                                                                        {header}
                                                                                                    </th>
                                                                                                ))}
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {scenario.examples[0].rows.map((row: any, rowIdx: number) => (
                                                                                                <tr key={rowIdx} className="border-b">
                                                                                                    {row.values.map((value: any, colIdx: number) => (
                                                                                            <td key={colIdx} className={`px-3 py-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
                                                                                                            {value}
                                                                                                        </td>
                                                                                                    ))}
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">هنوز نسخه تایید شده‌ای برای این پروژه وجود ندارد.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="latest" className={compact ? 'space-y-4' : 'space-y-6'} dir="rtl">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className={`flex items-center gap-2 ${compact ? 'text-base' : ''}`}>
                                            <Clock className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600"`} />
                                            <span>آخرین تغییرات</span>
                                        </CardTitle>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <GitBranch className="h-3 w-3" />
                                            نسخه فعلی
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className={compact ? 'space-y-3' : 'space-y-4'}>
                                        <div className={`bg-blue-50 border border-blue-200 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-blue-600`} />
                                                <span className={`${compact ? 'text-sm' : ''} font-medium text-blue-800`}>آخرین تغییرات</span>
                                            </div>
                                            <div className={`${compact ? 'space-y-1 text-xs' : 'space-y-1.5 text-sm'} text-blue-700`}>
                                                <p>این نسخه شامل آخرین تغییرات اعمال شده در پروژه است که ممکن است هنوز تایید نشده باشد.</p>
                                                <div className="flex items-center gap-2 text-blue-800">
                                                    <Calendar className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                                                    <span>آخرین بروزرسانی: {formatFaDate(project.updatedAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accordion of current features */}
                                        <Accordion type="multiple" className="w-full">
                                            {features.map((feature) => (
                                                <AccordionItem value={feature.id} key={feature.id}>
                                                    <div id={`feature-${feature.id}`} />
                                                        <AccordionTrigger className="text-right">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
                                                                <span className="font-medium text-base md:text-lg">{feature.name}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        {feature.description && (
                                                            <p className={`text-[13px] md:text-sm text-muted-foreground mb-3 text-right`}>{feature.description}</p>
                                                        )}
                                                        <div className="space-y-4">
                                                            {feature.background && feature.background.steps.length > 0 && (
                                                                <div className={`bg-gray-50 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
                                                                    <h4 className="font-medium mb-3 text-gray-700">پس‌زمینه</h4>
                                                                    <div className="space-y-2">
                                                                        {feature.background.steps.map((step: any) => (
                                                                            <div key={step.id} className="flex items-start gap-2 text-sm">
                                                                                <span className={`font-medium min-w-[60px] ${getStepTypeColor(step.keyword || step.type)}`}>
                                                                                    {getStepTypeIcon(step.keyword || step.type)} {step.keyword || step.type}
                                                                                </span>
                                                                                <span className="text-gray-700">{step.text}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {feature.scenarios.map((scenario: any) => (
                                                                <div key={scenario.id} className="border rounded-lg p-4">
                                                                    <h4 className="font-medium mb-3 text-gray-700">{scenario.name}</h4>
                                                                    {scenario.description && (
                                                                        <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                                                                    )}

                                                                    <div className="space-y-2">
                                                                        {scenario.steps.map((step: any) => (
                                                                            <div key={step.id} className="flex items-start gap-2 text-sm">
                                                                                <span className={`font-medium min-w-[60px] ${getStepTypeColor(step.keyword || step.type)}`}>
                                                                                    {getStepTypeIcon(step.keyword || step.type)} {step.keyword || step.type}
                                                                                </span>
                                                                                <span className="text-gray-700">{step.text}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {scenario.examples.length > 0 && scenario.examples[0].rows.length > 0 && (
                                                                        <div className="mt-4">
                                                                            <h5 className="font-medium mb-2 text-gray-600">مثال‌ها</h5>
                                                                            <div className="overflow-x-auto">
                                                                <table className={`min-w-full border border-gray-200 rounded-lg ${compact ? 'text-xs' : ''}`}>
                                                                                    <thead className="bg-gray-50">
                                                                                        <tr>
                                                                                            {scenario.examples[0].headers.map((header: any, idx: number) => (
                                                                                <th key={idx} className={`px-3 py-2 text-right ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 border-b`}>
                                                                                                    {header}
                                                                                                </th>
                                                                                            ))}
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {scenario.examples[0].rows.map((row: any, rowIdx: number) => (
                                                                                            <tr key={rowIdx} className="border-b">
                                                                                                {row.values.map((value: any, colIdx: number) => (
                                                                                    <td key={colIdx} className={`px-3 py-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
                                                                                                        {value}
                                                                                                    </td>
                                                                                                ))}
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
