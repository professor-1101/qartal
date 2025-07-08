"use client";

import React from 'react';
import { Step } from '@/types/gherkin';
import { StepCard } from './step-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

interface StepsListProps {
    steps: Step[];
    onReorderSteps: (scenarioId: string, newSteps: Step[]) => void; // Added for dnd-kit integration
    onAddStep: (scenarioId: string) => void;
    onEditStep: (stepId: string, newText: string) => void;
    onEditStepType: (stepId: string, newType: Step["keyword"]) => void;
    onDeleteStep: (stepId: string) => void;
    onDuplicateStep: (stepId: string) => void;
    scenarioId: string;
}

export const StepsList: React.FC<StepsListProps> = ({
    steps,
    onReorderSteps,
    onAddStep,
    onEditStep,
    onEditStepType, // Pass this down
    onDeleteStep,
    onDuplicateStep,
    scenarioId,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = steps.findIndex(step => step.id === active.id);
            const newIndex = steps.findIndex(step => step.id === over?.id);
            const newStepsOrder = arrayMove(steps, oldIndex, newIndex);
            onReorderSteps(scenarioId, newStepsOrder);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                    {steps.map((step) => (
                        <StepCard
                            key={step.id}
                            step={step}
                            onEditStep={onEditStep}
                            onEditStepType={onEditStepType}
                            onDeleteStep={onDeleteStep}
                            onDuplicateStep={onDuplicateStep}
                        />
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-fit self-start px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md"
                        onClick={() => onAddStep(scenarioId)}
                        aria-label="Add new step"
                    >
                        <Plus className="h-4 w-4 ml-1.5" /> افزودن مرحله
                    </Button>
                </div>
            </SortableContext>
        </DndContext>
    );
};

StepsList.displayName = "StepsList";