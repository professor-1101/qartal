import React from "react";
import { Background, Step } from "@/types/gherkin";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BackgroundSection } from "./components/background-section";

interface GherkinEditorBackgroundProps {
  background?: Background;
  onBackgroundChange: (background: Background | undefined) => void;
  onAddStep: () => void;
  onEditStep: (stepId: string, newText: string) => void;
  onEditStepType: (stepId: string, newType: Step["keyword"]) => void;
  onDeleteStep: (stepId: string) => void;
  onDuplicateStep: (stepId: string) => void;
  onReorderSteps: (newSteps: Step[]) => void;
}

export function GherkinEditorBackground({
  background,
  onBackgroundChange,
  onAddStep,
  onEditStep,
  onEditStepType,
  onDeleteStep,
  onDuplicateStep,
  onReorderSteps,
}: GherkinEditorBackgroundProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">پس‌زمینه (Background)</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBackgroundChange({
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
        background={background}
        onBackgroundChange={onBackgroundChange}
        onAddStep={onAddStep}
        onEditStep={onEditStep}
        onEditStepType={onEditStepType}
        onDeleteStep={onDeleteStep}
        onDuplicateStep={onDuplicateStep}
        onReorderSteps={onReorderSteps}
      />
    </div>
  );
} 