"use client";

import React, { useState } from "react";
import { Step } from '@/types/gherkin';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Trash, Copy, Pencil, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming cn is a utility for conditionally joining class names
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface StepCardProps {
    step: Step;
    onEditStep: (stepId: string, newText: string) => void;
    onEditStepType: (stepId: string, newType: Step["keyword"]) => void;
    onDeleteStep: (stepId: string) => void;
    onDuplicateStep: (stepId: string) => void;
}

export const StepCard: React.FC<StepCardProps> = ({
    step,
    onEditStep,
    onEditStepType,
    onDeleteStep,
    onDuplicateStep,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(step.text);

    React.useEffect(() => {
        setValue(step.text);
    }, [step.text]);

    const handleEdit = () => setEditing(true);
    const handleBlur = () => {
        setEditing(false);
        if (value !== step.text) onEditStep(step.id, value);
    };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            (e.currentTarget as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
            setEditing(false);
            setValue(step.text);
        }
    };

    const stepKeywords: Step["keyword"][] = ["فرض", "وقتی", "آنگاه", "و", "اما"];

    // Dynamic classes for keyword button
    const getKeywordClasses = (keyword: Step["keyword"]) => {
        switch (keyword) {
            case "فرض":
                return "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200";
            case "وقتی":
                return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200";
            case "آنگاه":
                return "bg-green-50 text-green-700 hover:bg-green-100 border-green-200";
            case "و":
                return "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200";
            case "اما":
                return "bg-red-50 text-red-700 hover:bg-red-100 border-red-200";
            default:
                return "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200";
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-2 py-1.5 shadow-sm hover:shadow-md transition-all min-h-[44px] group relative",
                editing && "ring-2 ring-blue-300 ring-offset-2 ring-offset-white"
            )}
        >
            {/* Drag Handle */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-grab text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-ring h-8 w-8"
                        {...listeners}
                        {...attributes}
                        aria-label="Drag step to reorder"
                    >
                        <GripVertical className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Drag to reorder step</TooltipContent>
            </Tooltip>

            {/* Step Keyword (Dropdown with distinct colors) */}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "font-semibold text-xs px-2 py-1 h-auto flex items-center justify-between min-w-[80px] flex-shrink-0 border rounded-md", // Added border, rounded-md
                                    getKeywordClasses(step.keyword) // Apply dynamic keyword classes
                                )}
                            >
                                {step.keyword} <ChevronDown className="ml-1 h-3 w-3 opacity-80" />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Change step type</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start">
                    {stepKeywords.map(keyword => (
                        <DropdownMenuItem
                            key={keyword}
                            onClick={() => onEditStepType(step.id, keyword)}
                            className={cn(
                                "flex items-center gap-2",
                                keyword === step.keyword && "font-semibold bg-blue-50 text-blue-700", // Highlight selected keyword
                                getKeywordClasses(keyword) // Apply keyword classes to menu items as well
                            )}
                        >
                            <span className="w-2 h-2 rounded-full" /> {/* Small color indicator */}
                            {keyword}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Step Text Input/Display */}
            {editing ? (
                <Input
                    className="flex-1 text-sm px-2 py-1.5 h-auto border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-0 bg-white"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    aria-label="Edit step text"
                />
            ) : (
                <span
                    className="flex-1 text-sm px-2 py-1.5 cursor-pointer truncate text-gray-800 hover:bg-gray-50 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={handleEdit}
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && handleEdit()}
                    aria-label="Step text"
                >
                    {value || "New step"}
                </span>
            )}

            {/* DataTable UI */}
            {step.dataTable && (
                <div className="mt-2 w-full">
                    <div className="flex gap-2 mb-1">
                        {step.dataTable.headers.map((header, idx) => (
                            <span key={idx} className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{header}</span>
                        ))}
                    </div>
                    {step.dataTable.rows.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-2 mb-1">
                            {row.values.map((val, cIdx) => (
                                <Input key={cIdx} value={val} className="text-xs w-20" readOnly />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* DocString UI */}
            {step.docString && (
                <div className="mt-2 w-full">
                    <div className="bg-gray-100 rounded p-2 text-xs font-mono text-gray-700 whitespace-pre-wrap">
                        {step.docString.content}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            onClick={handleEdit}
                            aria-label="Edit step"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit step text</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            onClick={() => onDuplicateStep(step.id)}
                            aria-label="Duplicate step"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate step</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-red-50/50"
                            onClick={() => onDeleteStep(step.id)}
                            aria-label="Delete step"
                        >
                            <Trash className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>حذف مرحله</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
};

StepCard.displayName = "StepCard";