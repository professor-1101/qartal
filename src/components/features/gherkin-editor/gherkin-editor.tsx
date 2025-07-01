"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Feature, Scenario, Step, Examples, Background } from "@/types/gherkin";
import { ScenarioCard } from "./components/scenario-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Save, Download, Plus, FileText, List, Copy, Code2 } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";
import { BackgroundSection } from "./components/background-section";
import { gherkinBusinessLogic } from "@/lib/gherkin-business-logic";

interface GherkinEditorProps {
    feature: Feature;
    onFeatureChange: (feature: Feature) => void;
}

export function GherkinEditor({
    feature: initialFeature,
    onFeatureChange,
}: GherkinEditorProps) {
    const [feature, setFeature] = useState<Feature>(initialFeature);
    const [dirty, setDirty] = useState(false);
    const [showAddScenarioMenu, setShowAddScenarioMenu] = useState(false);
    const [showRaw, setShowRaw] = useState(false);
    const addScenarioButtonRef = useRef<HTMLButtonElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [editingRule, setEditingRule] = useState<{ id?: string; name: string; description: string } | null>(null);

    useEffect(() => {
        setIsClient(true);

        const handleClickOutside = (event: MouseEvent) => {
            if (addScenarioButtonRef.current && !addScenarioButtonRef.current.contains(event.target as Node)) {
                const menu = document.getElementById('add-scenario-dropdown-menu');
                if (menu && !menu.contains(event.target as Node)) {
                    setShowAddScenarioMenu(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setFeature(initialFeature);
        setDirty(false);
    }, [initialFeature]);

    useEffect(() => {
        setDirty(JSON.stringify(feature) !== JSON.stringify(initialFeature));
    }, [feature, initialFeature]);

    const highlightGherkin = (gherkin: string) => {
        return gherkin
            .replace(/(ویژگی:|طرح سناریو:|سناریو:|مثال‌ها:)/g, '<span class="text-blue-800 font-bold">$1</span>')
            .replace(/(با فرض|هنگامی که|آنگاه)(?= )/g, '<span class="text-green-700 font-medium">$1</span>')
            .replace(/(و|اما)(?= )/g, '<span class="text-gray-500 font-normal">$1</span>')
            .replace(/(@[a-zA-Z0-9_]+)/g, '<span class="text-amber-700">$1</span>')
            .replace(/(\|.*?\|)/g, '<span class="text-gray-700 font-mono">$1</span>');
    };

    const gherkinText = useMemo(() => {
        return gherkinBusinessLogic.generateGherkinText(feature);
    }, [feature]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const handleSave = () => {
        onFeatureChange(feature);
        setDirty(false);
        toast.success("تغییرات با موفقیت ذخیره شد");
    };

    const handleExport = (type: "feature" | "json" | "pdf") => {
        let content = "";
        let filename = "feature";
        
        switch (type) {
            case "feature":
                content = gherkinText;
                filename = `${feature.name.replace(/\s+/g, '_')}.feature`;
                break;
            case "json":
                content = JSON.stringify(feature, null, 2);
                filename = `${feature.name.replace(/\s+/g, '_')}.json`;
                break;
            case "pdf":
            default:
                toast.info("PDF export is not implemented yet");
                return;
        }
        
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`فایل ${filename} با موفقیت دانلود شد`);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(gherkinText)
            .then(() => toast.success("متن Gherkin در کلیپ‌بورد کپی شد"))
            .catch(err => toast.error("خطا در کپی کردن متن: " + err.message));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setFeature(prev => {
                const oldIndex = prev.scenarios.findIndex(s => s.id === active.id);
                const newIndex = prev.scenarios.findIndex(s => s.id === over.id);
                const newScenarios = arrayMove(prev.scenarios, oldIndex, newIndex);
                return { ...prev, scenarios: newScenarios };
            });
            setDirty(true);
        }
    };

    const handleAddOrEditRule = (rule?: { id?: string; name: string; description: string }) => {
        setFeature(prev => {
            const rules = prev.rules ? [...prev.rules] : [];
            if (rule?.id) {
                const idx = rules.findIndex(r => r.id === rule.id);
                if (idx !== -1) rules[idx] = { ...rules[idx], ...rule };
            } else if (rule) {
                rules.push({
                    id: `rule-${Date.now()}`,
                    name: rule.name,
                    description: rule.description,
                    tags: [],
                    scenarios: [],
                });
            }
            return { ...prev, rules };
        });
        setDirty(true);
        setShowRuleModal(false);
        setEditingRule(null);
    };

    const handleDeleteRule = (ruleId: string) => {
        setFeature(prev => ({
            ...prev,
            rules: prev.rules?.filter(r => r.id !== ruleId) || [],
        }));
        setDirty(true);
    };

    const handleBackgroundChange = (background: Background | undefined) => {
        setFeature(prev => ({ ...prev, background }));
        setDirty(true);
    };

    const handleAddBackgroundStep = () => {
        setFeature(prev => {
            if (!prev.background) return prev;
            return {
                ...prev,
                background: {
                    ...prev.background,
                    steps: [
                        ...prev.background.steps,
                        { id: `step-${Date.now()}`, keyword: 'فرض', text: '' }
                    ]
                }
            };
        });
        setDirty(true);
    };

    const handleEditBackgroundStep = (stepId: string, newText: string) => {
        setFeature(prev => {
            if (!prev.background) return prev;
            return {
                ...prev,
                background: {
                    ...prev.background,
                    steps: prev.background.steps.map(st =>
                        st.id === stepId ? { ...st, text: newText } : st
                    )
                }
            };
        });
        setDirty(true);
    };

    const handleEditBackgroundStepType = (stepId: string, newType: Step["keyword"]) => {
        setFeature(prev => {
            if (!prev.background) return prev;
            return {
                ...prev,
                background: {
                    ...prev.background,
                    steps: prev.background.steps.map(st =>
                        st.id === stepId ? { ...st, keyword: newType } : st
                    )
                }
            };
        });
        setDirty(true);
    };

    const handleDeleteBackgroundStep = (stepId: string) => {
        setFeature(prev => {
            if (!prev.background) return prev;
            return {
                ...prev,
                background: {
                    ...prev.background,
                    steps: prev.background.steps.filter(st => st.id !== stepId)
                }
            };
        });
        setDirty(true);
    };

    const handleDuplicateBackgroundStep = (stepId: string) => {
        setFeature(prev => {
            if (!prev.background) return prev;
            const stepToDup = prev.background.steps.find(st => st.id === stepId);
            if (!stepToDup) return prev;
            const idx = prev.background.steps.findIndex(st => st.id === stepId);
            const newSteps = [...prev.background.steps];
            newSteps.splice(idx + 1, 0, {
                ...stepToDup,
                id: `step-${Date.now()}`,
                text: stepToDup.text + ' (کپی)'
            });
            return {
                ...prev,
                background: {
                    ...prev.background,
                    steps: newSteps
                }
            };
        });
        setDirty(true);
    };

    const handleReorderBackgroundSteps = (newSteps: Step[]) => {
        setFeature(prev => {
            if (!prev.background) return prev;
            return {
                ...prev,
                background: {
                    ...prev.background,
                    steps: newSteps
                }
            };
        });
        setDirty(true);
    };

    const handleAddScenario = (type: "scenario" | "scenario-outline" = "scenario") => {
        const newScenario: Scenario = {
            id: `scenario-${Date.now()}`,
            type: type,
            name: "سناریوی جدید",
            description: "",
            tags: [],
            steps: [],
            ...(type === "scenario-outline" ? {
                examples: {
                    id: `examples-${Date.now()}`,
                    headers: ["param1"],
                    rows: [{ id: `row-${Date.now()}`, values: [""] }]
                }
            } : {})
        };
        setFeature(prev => ({
            ...prev,
            scenarios: [...prev.scenarios, newScenario]
        }));
        setDirty(true);
    };

    const handleAddStep = (scenarioId: string) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s =>
                s.id === scenarioId
                    ? {
                        ...s,
                        steps: [
                            ...s.steps,
                            { id: `step-${Date.now()}`, keyword: "فرض", text: "" }
                        ]
                    }
                    : s
            )
        }));
        setDirty(true);
    };

    const handleEditStep = (stepId: string, newText: string) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s => ({
                ...s,
                steps: s.steps.map(st =>
                    st.id === stepId ? { ...st, text: newText } : st
                )
            }))
        }));
        setDirty(true);
    };

    const handleEditStepType = (stepId: string, newType: Step["keyword"]) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s => ({
                ...s,
                steps: s.steps.map(st =>
                    st.id === stepId ? { ...st, keyword: newType } : st
                )
            }))
        }));
        setDirty(true);
    };

    const handleDeleteStep = (stepId: string) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s => ({
                ...s,
                steps: s.steps.filter(st => st.id !== stepId)
            }))
        }));
        setDirty(true);
    };

    const handleDuplicateStep = (stepId: string) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s => ({
                ...s,
                steps: s.steps.flatMap(st =>
                    st.id === stepId
                        ? [st, { ...st, id: `step-${Date.now()}` }]
                        : [st]
                )
            }))
        }));
        setDirty(true);
    };

    const handleRenameScenario = (
        scenarioId: string,
        newTitle: string,
        newType: 'scenario' | 'scenario-outline',
        examples?: Examples,
        newDescription?: string
    ) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s =>
                s.id === scenarioId
                    ? {
                        ...s,
                        name: newTitle,
                        type: newType,
                        description: newDescription ?? s.description,
                        examples: newType === "scenario-outline"
                            ? (examples
                                ? { ...examples }
                                : {
                                    id: `examples-${Date.now()}`,
                                    headers: ["param1"],
                                    rows: [{ id: `row-${Date.now()}`, values: [""] }]
                                })
                            : undefined
                    }
                    : s
            )
        }));
        setDirty(true);
    };

    const handleDeleteScenario = (scenarioId: string) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.filter(s => s.id !== scenarioId)
        }));
        setDirty(true);
    };

    const handleDuplicateScenario = (scenarioId: string) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.flatMap(s =>
                s.id === scenarioId
                    ? [
                        s,
                        {
                            ...s,
                            id: `scenario-${Date.now()}`,
                            examples: s.examples
                                ? {
                                    ...s.examples,
                                    id: `examples-${Date.now()}`,
                                    rows: s.examples.rows.map(row => ({ ...row, id: `row-${Date.now()}` }))
                                }
                                : undefined
                        }
                    ]
                    : [s]
            )
        }));
        setDirty(true);
    };

    const handleExamplesChange = (
        scenarioId: string,
        headers: string[],
        rows: { id: string; values: string[] }[]
    ) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s =>
                s.id === scenarioId
                    ? {
                        ...s,
                        examples: {
                            id: s.examples?.id || `examples-${Date.now()}`,
                            headers: [...headers],
                            rows: rows.map(r => ({ ...r }))
                        }
                    }
                    : s
            )
        }));
        setDirty(true);
    };

    const handleReorderSteps = (scenarioId: string, newSteps: Step[]) => {
        setFeature(prev => ({
            ...prev,
            scenarios: prev.scenarios.map(s =>
                s.id === scenarioId
                    ? { ...s, steps: newSteps }
                    : s
            )
        }));
        setDirty(true);
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full bg-gray-50 text-gray-900 font-sans antialiased">
                <Toaster />

                <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[3fr_1.5fr] gap-6 p-6">
                    <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
                        <nav className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur border-b border-gray-200 flex items-center justify-between px-6 py-3 mb-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-gray-900 truncate max-w-xs md:max-w-md" title={feature.name}>
                                    {feature.name || 'بدون نام'}
                                </span>
                                {feature.tags && feature.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {feature.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {dirty && <Badge variant="destructive">تغییرات ذخیره نشده</Badge>}
                                <Button
                                    variant="outline"
                                    disabled={!dirty}
                                    onClick={handleSave}
                                    className="h-9 px-5"
                                >
                                    ذخیره
                                    <Save className="ml-2" />
                                </Button>
                            </div>
                        </nav>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">پس‌زمینه (Background)</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBackgroundChange({
                                        id: `background-${Date.now()}`,
                                        steps: [{
                                            id: `step-${Date.now()}`,
                                            keyword: 'فرض',
                                            text: 'سیستم در وضعیت مشخصی قرار دارد',
                                        }],
                                    })}
                                    className="text-xs px-2 py-1 h-7"
                                >
                                    <Plus className="h-3 w-3 ml-1" />
                                    افزودن پس‌زمینه
                                </Button>
                            </div>
                            <BackgroundSection
                                background={feature.background}
                                onBackgroundChange={handleBackgroundChange}
                                onAddStep={handleAddBackgroundStep}
                                onEditStep={handleEditBackgroundStep}
                                onEditStepType={handleEditBackgroundStepType}
                                onDeleteStep={handleDeleteBackgroundStep}
                                onDuplicateStep={handleDuplicateBackgroundStep}
                                onReorderSteps={handleReorderBackgroundSteps}
                            />
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">قوانین (Rules)</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setEditingRule({ name: "", description: "" }); setShowRuleModal(true); }}
                                    className="text-xs px-2 py-1 h-7"
                                >
                                    <Plus className="h-3 w-3 ml-1" />
                                    افزودن قانون
                                </Button>
                            </div>
                            <div className="flex flex-col gap-3">
                                {feature.rules && feature.rules.length > 0 ? (
                                    feature.rules.map((rule) => (
                                        <div key={rule.id} className="border rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">{rule.name}</span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingRule({
                                                                id: rule.id,
                                                                name: rule.name,
                                                                description: rule.description || ""
                                                            });
                                                            setShowRuleModal(true);
                                                        }}
                                                        className="text-xs px-2 py-1 h-6"
                                                    >
                                                        ویرایش
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        className="text-xs px-2 py-1 h-6 text-red-600 hover:text-red-700"
                                                    >
                                                        حذف
                                                    </Button>
                                                </div>
                                            </div>
                                            {rule.description && (
                                                <div className="text-xs text-gray-600 mb-2">{rule.description}</div>
                                            )}
                                            <div className="text-xs text-gray-500">
                                                {rule.scenarios?.length || 0} سناریو
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        هنوز قانونی اضافه نشده است
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">
                                    سناریوها ({feature.scenarios.length})
                                </h3>
                                <div className="relative">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowAddScenarioMenu((v) => !v)}
                                                aria-label="افزودن سناریو جدید"
                                                className="text-xs px-2 py-1 h-7"
                                                ref={addScenarioButtonRef}
                                            >
                                                <Plus className="h-3 w-3 ml-1" /> افزودن سناریو
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>افزودن سناریو جدید</TooltipContent>
                                    </Tooltip>
                                    {showAddScenarioMenu && (
                                        <div
                                            id="add-scenario-dropdown-menu"
                                            className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 flex flex-col gap-1 bg-white border border-gray-200 rounded-md shadow-lg p-1 z-50 min-w-[170px]"
                                        >
                                            <Button
                                                variant="ghost"
                                                className="justify-end gap-2 text-sm text-gray-700 hover:bg-gray-50 px-3 py-2"
                                                onClick={() => { handleAddScenario('scenario'); setShowAddScenarioMenu(false); }}
                                            >
                                                <FileText className="h-4 w-4 text-gray-500" /> سناریو
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="justify-end gap-2 text-sm text-gray-700 hover:bg-gray-50 px-3 py-2"
                                                onClick={() => { handleAddScenario('scenario-outline'); setShowAddScenarioMenu(false); }}
                                            >
                                                <List className="h-4 w-4 text-gray-500" /> سناریو با مثال
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isClient ? (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext items={feature.scenarios.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-4">
                                            {feature.scenarios.map((scenario, idx) => (
                                                <ScenarioCard
                                                    key={scenario.id}
                                                    scenario={scenario}
                                                    onReorderSteps={handleReorderSteps}
                                                    onAddStep={handleAddStep}
                                                    onEditStep={handleEditStep}
                                                    onEditStepType={handleEditStepType}
                                                    onDeleteStep={handleDeleteStep}
                                                    onDuplicateStep={handleDuplicateStep}
                                                    onRenameScenario={handleRenameScenario}
                                                    onDeleteScenario={handleDeleteScenario}
                                                    onDuplicateScenario={handleDuplicateScenario}
                                                    index={idx}
                                                    total={feature.scenarios.length}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-right text-gray-400">
                                    <span className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-transparent rounded-full mb-2"></span>
                                    <p>در حال بارگذاری سناریوها...</p>
                                </div>
                            )}

                            {feature.scenarios.length === 0 && isClient && (
                                <div className="flex flex-col items-center justify-center py-12 text-right text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                                    <FileText className="h-14 w-14 mb-3 text-gray-300" />
                                    <h3 className="text-base font-medium mb-1">هنوز سناریویی وجود ندارد</h3>
                                    <p className="text-sm mb-4">برای افزودن سناریو، روی افزودن سناریو کلیک کنید.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <section className="lg:col-span-1 flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white text-gray-800 rounded-lg border border-gray-100 p-4 relative group font-mono text-sm leading-relaxed">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleCopy}
                                            aria-label="کپی در کلیپ‌بورد"
                                            className="h-8 w-8 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>کپی در کلیپ‌بورد</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowRaw(r => !r)}
                                            aria-label="Toggle Raw View"
                                            className="h-8 w-8 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                        >
                                            <Code2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{showRaw ? "نمای قالب‌بندی شده" : "نمای خام"}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleExport("feature")}
                                            aria-label="دانلود فایل"
                                            className="h-8 w-8 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>دانلود فایل Gherkin</TooltipContent>
                                </Tooltip>
                            </div>
                            <pre
                                className="whitespace-pre-wrap pt-8 text-base"
                                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                                {...(showRaw
                                    ? { children: gherkinText }
                                    : { dangerouslySetInnerHTML: { __html: highlightGherkin(gherkinText) } })}
                            />
                        </div>
                    </section>
                </main>

                {showRuleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4 text-right">
                                {editingRule?.id ? "ویرایش قانون" : "افزودن قانون جدید"}
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm mb-1 text-right">نام قانون</label>
                                <Input
                                    value={editingRule?.name || ""}
                                    onChange={e => setEditingRule(r => ({ ...r!, name: e.target.value }))}
                                    className="w-full"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm mb-1 text-right">توضیحات</label>
                                <Input
                                    value={editingRule?.description || ""}
                                    onChange={e => setEditingRule(r => ({ ...r!, description: e.target.value }))}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => { setShowRuleModal(false); setEditingRule(null); }}
                                >
                                    لغو
                                </Button>
                                <Button onClick={() => handleAddOrEditRule(editingRule!)}>
                                    ذخیره
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}