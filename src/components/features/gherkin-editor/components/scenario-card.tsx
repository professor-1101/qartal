"use client";

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, ChevronDown, Copy, Trash, Pencil, MoreHorizontal } from 'lucide-react';
import { StepsList } from './StepsList';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ExamplesTable } from './ExamplesTable'; // Import from external file

interface ScenarioCardProps {
    scenario: import('@/types/gherkin').Scenario;
    onReorderSteps: (scenarioId: string, newSteps: import('@/types/gherkin').Step[]) => void;
    onAddStep: (scenarioId: string) => void;
    onEditStep: (stepId: string, newText: string) => void;
    onEditStepType: (stepId: string, newType: import('@/types/gherkin').Step["keyword"]) => void;
    onDeleteStep: (stepId: string) => void;
    onDuplicateStep: (stepId: string) => void;
    onRenameScenario: (scenarioId: string, newTitle: string, newType: 'scenario' | 'scenario-outline', examples?: import('@/types/gherkin').Examples, newDescription?: string) => void;
    onDeleteScenario: (scenarioId: string) => void;
    onDuplicateScenario: (scenarioId: string) => void;
    index?: number;
    total?: number;
    defaultOpen?: boolean;
}

export function ScenarioCard({
    scenario,
    onReorderSteps,
    onAddStep,
    onEditStep,
    onEditStepType,
    onDeleteStep,
    onDuplicateStep,
    onRenameScenario,
    onDeleteScenario,
    onDuplicateScenario,
}: ScenarioCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: scenario.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [collapsed, setCollapsed] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(scenario.name);
    const [currentDescription, setCurrentDescription] = useState(scenario.description || "");

    React.useEffect(() => {
        setCurrentTitle(scenario.name);
        setCurrentDescription(scenario.description || "");
    }, [scenario.name, scenario.description]);

    const handleTitleDescriptionChange = () => {
        setEditingTitle(false);
        if (currentTitle !== scenario.name || currentDescription !== scenario.description) {
            onRenameScenario(scenario.id, currentTitle, scenario.type, scenario.examples, currentDescription);
        }
    };

    const handleTypeSwitch = (checked: boolean) => {
        let newExamples = scenario.examples;
        if (checked && !scenario.examples) {
            newExamples = {
                id: `examples-${scenario.id}`,
                headers: ["پارامتر ۱", "پارامتر ۲"],
                rows: [{ id: `row-${scenario.id}-${Date.now()}`, values: ["", ""] }],
            };
        }
        onRenameScenario(scenario.id, currentTitle, checked ? "scenario-outline" : "scenario", newExamples, currentDescription);
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="
                transition-all duration-200 ease-in-out
                border border-gray-200
                bg-white
                py-0
                rounded-xl
                shadow-lg
                hover:shadow-xl
                relative group
                flex flex-col
            "
        >
            <CardHeader className="
                flex flex-row items-center justify-between gap-4
                px-6 py-4
                border-b border-gray-100
                bg-gray-50
                rounded-t-xl
            ">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            {...listeners}
                            {...attributes}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 cursor-grab flex-shrink-0"
                            aria-label="Drag scenario to reorder"
                        >
                            <GripVertical className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>کشیدن برای تغییر ترتیب سناریو</TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {editingTitle ? (
                        <Input
                            value={currentTitle}
                            onChange={e => setCurrentTitle(e.target.value)}
                            onBlur={handleTitleDescriptionChange}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleTitleDescriptionChange();
                                if (e.key === 'Escape') {
                                    setCurrentTitle(scenario.name);
                                    setEditingTitle(false);
                                }
                            }}
                            autoFocus
                            className="w-full text-base bg-transparent border-none focus:outline-none"
                            aria-label="Edit scenario title"
                            placeholder="نام سناریو را وارد کنید"
                        />
                    ) : (
                        <CardTitle
                            className="
                                text-xl font-bold
                                text-gray-800
                                cursor-pointer hover:underline underline-offset-2 decoration-dotted
                                transition-all px-0.5 py-0.5 rounded-md
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                            "
                            onClick={() => setEditingTitle(true)}
                            onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(true); }}
                            tabIndex={0}
                            aria-label="Scenario title"
                        >
                            {currentTitle || "سناریوی بدون نام"}
                        </CardTitle>
                    )}
                    <Badge
                        variant="secondary"
                        className="
                            text-xs font-medium
                            bg-blue-100 text-blue-800 border-blue-200
                            px-2 py-1 rounded-full
                        "
                    >
                        {scenario.type === "scenario-outline" ? "سناریو با مثال" : "سناریو"}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={`scenario-type-${scenario.id}`}
                            checked={scenario.type === "scenario-outline"}
                            onCheckedChange={handleTypeSwitch}
                            aria-label="Toggle scenario type between Scenario and Scenario Outline"
                            className="data-[state=checked]:bg-blue-600"
                        />
                        <Label htmlFor={`scenario-type-${scenario.id}`} className="text-xs text-gray-600">
                            {scenario.type === "scenario-outline" ? "سناریو با مثال" : "سناریو"}
                        </Label>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More scenario actions" className="h-8 w-8 text-gray-500 hover:bg-gray-200 hover:text-gray-700">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setEditingTitle(true)}>
                                <Pencil className="h-4 w-4 ml-2 text-gray-500" /> تغییر نام سناریو
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicateScenario(scenario.id)}>
                                <Copy className="h-4 w-4 ml-2 text-gray-500" /> تکرار سناریو
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDeleteScenario(scenario.id)} className="text-destructive focus:text-destructive">
                                <Trash className="h-4 w-4 ml-2" /> حذف سناریو
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(c => !c)}
                                aria-label={collapsed ? 'گسترش جزئیات سناریو' : 'جمع کردن جزئیات سناریو'}
                                className="h-8 w-8 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                            >
                                <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{collapsed ? 'گسترش' : 'جمع کردن'} سناریو</TooltipContent>
                    </Tooltip>
                </div>
            </CardHeader>

            {!collapsed && (
                <CardContent className="px-6 pb-6 pt-5 space-y-5 flex-1 overflow-auto">
                    {scenario.tags && scenario.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span className="font-semibold text-gray-700">برچسب‌ها:</span>
                            {scenario.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="
                                    text-gray-700 bg-purple-100 border-purple-200
                                    text-xs px-2 py-0.5 rounded-full
                                ">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div>
                        <Textarea
                            value={currentDescription}
                            onChange={e => setCurrentDescription(e.target.value)}
                            onBlur={handleTitleDescriptionChange}
                            placeholder="توضیح سناریو (اختیاری)..."
                            rows={2}
                            className="
                                w-full resize-y p-3
                                bg-gray-50 border border-gray-200 rounded-md
                                text-sm leading-relaxed text-gray-700
                                focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-0
                                placeholder:text-gray-400
                            "
                            aria-label="Scenario description"
                        />
                    </div>

                    <div>
                        <StepsList
                            steps={scenario.steps}
                            onReorderSteps={onReorderSteps}
                            onAddStep={onAddStep}
                            onEditStep={onEditStep}
                            onEditStepType={onEditStepType}
                            onDeleteStep={onDeleteStep}
                            onDuplicateStep={onDuplicateStep}
                            scenarioId={scenario.id}
                        />
                    </div>

                    {scenario.type === "scenario-outline" && scenario.examples && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-3">مثال‌ها</h3>
                            <ExamplesTable
                                headers={scenario.examples?.headers || []}
                                rows={scenario.examples?.rows || []}
                                onChange={(headers, rows) => {
                                    onRenameScenario(
                                        scenario.id,
                                        currentTitle,
                                        "scenario-outline",
                                        {
                                        id: scenario.examples?.id ?? `examples-${scenario.id}`,
                                        headers,
                                        rows,
                                        },
                                        currentDescription
                                    );
                                }}
                            />
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

ScenarioCard.displayName = "ScenarioCard";