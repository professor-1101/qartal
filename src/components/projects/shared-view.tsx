"use client";
import React, { useState } from 'react';

// Import types
import { Project, Feature, Scenario, Step, Rule, StepType } from '@/types/index';

// Import UI components from shadcn/ui
import { Card, CardContent} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    FileText, GitBranch,  Tag, Layers3, Combine, Users, Calendar,
     BookText, ChevronsUpDown} from 'lucide-react';
import { cn } from '@/lib/utils';


// --- Helper Functions for Visual Dynamics ---

const getKeywordColor = (keyword: StepType) => {
    switch (keyword) {
        case 'فرض': return 'text-blue-600 font-semibold';
        case 'وقتی': return 'text-green-600 font-semibold';
        case 'آنگاه': return 'text-purple-600 font-semibold';
        case 'و': case 'اما': return 'text-orange-600 font-semibold';
        default: return 'text-muted-foreground';
    }
};

// --- Content Display Components ---

function StepContent({ step }: { step: Step }) {
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2">
                <span className={cn("text-sm font-medium", getKeywordColor(step.keyword))}>{step.keyword}</span>
                <span className="text-sm text-muted-foreground">{step.text}</span>
            </div>
            {step.dataTable && (
                <div className="pr-8">
                    <Table className="bg-background/50 rounded-md">
                        <TableHeader>
                            <TableRow>
                                {step.dataTable.headers.map((header, idx) => <TableHead key={idx}>{header}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {step.dataTable.rows.map((row, idx) => (
                                <TableRow key={row.id || idx}>
                                    {row.values.map((cell, cidx) => <TableCell key={cidx}>{cell}</TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            {step.docString && (
                <div className="pr-8">
                    <pre className="p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap text-muted-foreground border">{step.docString.content}</pre>
                </div>
            )}
        </div>
    );
}

function ScenarioContent({ scenario }: { scenario: Scenario }) {
    return (
        <div className="border-t border-dashed border-muted pt-4 mt-4">
            <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-base">{scenario.name}</span>
                <Badge variant={scenario.type === 'scenario-outline' ? 'secondary' : 'outline'} className="text-xs font-normal">
                    {scenario.type === 'scenario-outline' ? 'Scenario Outline' : 'Scenario'}
                </Badge>
                {scenario.tags?.length > 0 && scenario.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs font-normal"><Tag className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />{tag}</Badge>
                ))}
            </div>
            {scenario.description && <div className="text-sm text-muted-foreground mb-3">{scenario.description}</div>}
            <div className="space-y-3">
                {scenario.steps.map((step) => <StepContent key={step.id} step={step} />)}
            </div>
            {scenario.examples && (
                <div className="space-y-2 pt-3 mt-3">
                    <span className="text-sm font-bold text-gray-800">مثال‌ها:</span>
                    <div className="overflow-x-auto">
                        <table className="w-auto min-w-max border-separate border-spacing-0 text-sm" style={{ borderCollapse: 'separate' }}>
                            <thead>
                                <tr>
                                    {(scenario.examples?.headers || []).map((h, i) => (
                                        <th key={i} className="bg-gray-100 font-bold text-gray-800 border border-gray-300 px-4 py-2 text-right whitespace-nowrap" style={{ borderTopRightRadius: i === 0 ? 8 : 0, borderTopLeftRadius: i === (scenario.examples?.headers?.length || 0) - 1 ? 8 : 0 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(scenario.examples?.rows || []).map((row, idx) => (
                                    <tr key={row.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        {(row.values || []).map((cell, cidx) => (
                                            <td key={cidx} className="border border-gray-200 px-4 py-2 text-right whitespace-nowrap">{cell}</td>
                                        ))}
                                    </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {scenario.type === 'scenario-outline' && !scenario.examples && (
                <div className="text-sm text-red-500 mt-2">⚠️ جدول مثال‌ها برای این سناریو تعریف نشده است.</div>
            )}
        </div>
    );
}

function RuleContent({ rule }: { rule: Rule }) {
    return (
        <div className="border rounded-lg p-4 bg-muted/40 my-4">
            <div className="flex items-center gap-2 mb-1">
                <Combine className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-lg">{rule.name}</span>
                {rule.tags?.length > 0 && rule.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline"><Tag className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />{tag}</Badge>
                ))}
            </div>
            {rule.description && <div className="text-sm text-muted-foreground mb-3">{rule.description}</div>}
            <div className="space-y-4">
                {rule.scenarios.map((scenario) => <ScenarioContent key={scenario.id} scenario={scenario} />)}
            </div>
        </div>
    );
}

function BackgroundContent({ background }: { background: Feature['background'] }) {
    if (!background || !background.steps || background.steps.length === 0) return null;
    return (
        <div className="border-t border-b border-dashed border-muted py-4 my-4">
            <div className="flex items-center gap-2 mb-2">
                <Layers3 className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-lg">پس‌زمینه</span>
            </div>
            <div className="space-y-3 pl-2">
                {background.steps.map((step) => <StepContent key={step.id} step={step} />)}
            </div>
        </div>
    );
}


// --- New Table of Contents Component ---

function TableOfContents({ features, scrollTo }: { features: Feature[], scrollTo: (id: string) => void }) {
    const [openFeatures, setOpenFeatures] = useState<Record<string, boolean>>({});

    const toggleFeature = (featureId: string) => {
        setOpenFeatures(prev => ({ ...prev, [featureId]: !prev[featureId] }));
    };

    return (
        <aside className="lg:col-span-1 lg:sticky top-28 h-[calc(100vh-8rem)]">
            <div className="bg-card border rounded-lg h-full flex flex-col">
                <div className="p-3 border-b">
                    <h3 className="text-sm font-semibold">فهرست مطالب</h3>
                </div>
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {features.map((feature) => (
                        <div key={feature.id}>
                            <div className="group flex items-center w-full rounded-md hover:bg-muted">
                                <button
                                    onClick={() => scrollTo(`feature-${feature.id}`)}
                                    className="flex-1 flex items-center gap-2 text-right p-2 text-sm font-medium truncate"
                                >
                                    <BookText className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span>{feature.name}</span>
                                </button>
                                <button onClick={() => toggleFeature(feature.id)} className="p-2 text-muted-foreground hover:text-foreground">
                                    <ChevronsUpDown className="w-4 h-4 shrink-0" />
                                </button>
                            </div>

                            {openFeatures[feature.id] && (
                                <ul className="border-r border-dashed mr-4 pr-3 my-1 space-y-1">
                                    {feature.rules?.map(rule => (
                                        <li key={rule.id}>
                                            <button
                                                onClick={() => scrollTo(`rule-${rule.id}`)}
                                                className="w-full flex items-center gap-2 text-right p-1.5 pr-2 rounded hover:bg-muted transition-colors text-xs"
                                            >
                                                <Combine className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                                                <span className="truncate">{rule.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                    {feature.scenarios?.map(scenario => (
                                        <li key={scenario.id}>
                                            <button
                                                onClick={() => scrollTo(`scenario-${scenario.id}`)}
                                                className="w-full flex items-center gap-2 text-right p-1.5 pr-2 rounded hover:bg-muted transition-colors text-xs"
                                            >
                                                <GitBranch className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                                                <span className="truncate">{scenario.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}


// --- Main Page Component ---

interface SharedProjectViewProps {
    project: Project;
    features?: Feature[];
}

export function SharedProjectView({ project, features = [] }: SharedProjectViewProps) {
    // If features are not provided, we'll use an empty array
    // This maintains backward compatibility with existing usage

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="min-h-screen bg-muted/20">
            {/* Fixed Header */}
            <header className="border-b ">
                <div className="container mx-auto px-4 py-4">
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <h1 className="text-2xl font-bold">{project.name}</h1>
                                    <p className="text-muted-foreground">{project.description}</p>
                                </div>
                            </div>
                            <Separator className="my-3" />
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>{features.length} ویژگی</span></div>
                                <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>نویسنده: {project.authorName}</span></div>
                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>آخرین بروزرسانی: {new Date(project.updatedAt).toLocaleDateString('fa-IR')}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                    {/* Table of Contents Sidebar */}
                    <TableOfContents features={features} scrollTo={scrollTo} />


                    {/* Features Content */}
                    <div className="lg:col-span-3">
                        <Accordion type="multiple" className="space-y-6">
                            {features.map((feature) => (
                                <AccordionItem value={feature.id} key={feature.id} id={`feature-${feature.id}`} className="scroll-mt-24 bg-card border rounded-xl overflow-hidden">
                                    <AccordionTrigger className="p-5 text-lg font-semibold hover:no-underline">
                                        <div className="flex items-center gap-3 w-full">
                                            <BookText className="h-6 w-6 text-muted-foreground" />
                                            <div className="flex-1 text-right">
                                                <div className="flex items-center gap-2">
                                                    <span>{feature.name}</span>
                                                    {feature.tags?.length > 0 && feature.tags.map((tag, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs font-normal"><Tag className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />{tag}</Badge>
                                                    ))}
                                                </div>
                                                {feature.description && <div className="text-sm text-muted-foreground font-normal mt-1 text-right">{feature.description}</div>}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-5 pt-0">

                                        <BackgroundContent background={feature.background} />

                                        {feature.rules?.map((rule) => (
                                            <section key={rule.id} id={`rule-${rule.id}`} className="scroll-mt-24">
                                                <RuleContent rule={rule} />
                                            </section>
                                        ))}

                                        <div className="space-y-4">
                                            {feature.scenarios?.map((scenario) => (
                                                <section key={scenario.id} id={`scenario-${scenario.id}`} className="scroll-mt-24">
                                                    <ScenarioContent scenario={scenario} />
                                                </section>
                                            ))}
                                        </div>

                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </main>
        </div>
    );
}