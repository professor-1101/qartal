"use client";

import React, { useState } from 'react';
import { Background, Step } from '@/types/gherkin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronDown, ChevronRight, Trash } from 'lucide-react';
import { StepsList } from './StepsList';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface BackgroundSectionProps {
  background?: Background;
  onBackgroundChange: (background: Background | undefined) => void;
  onAddStep: (stepId: string) => void;
  onEditStep: (stepId: string, newText: string) => void;
  onEditStepType: (stepId: string, newType: Step["keyword"]) => void;
  onDeleteStep: (stepId: string) => void;
  onDuplicateStep: (stepId: string) => void;
  onReorderSteps: (newSteps: Step[]) => void;
}

export function BackgroundSection({
  background,
  onBackgroundChange,
  onAddStep,
  // onEditStep,
  // onEditStepType,
  // onDeleteStep,
  // onDuplicateStep,
  // onReorderSteps,
}: BackgroundSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleAddBackground = () => {
    const newBackground: Background = {
      id: `background-${Date.now()}`,
      steps: [
        {
          id: `step-${Date.now()}`,
          keyword: 'فرض',
          text: '',
          isValid: true
        }
      ],
      isValid: true
    };
    onBackgroundChange(newBackground);
  };

  const handleRemoveBackground = () => {
    onBackgroundChange(undefined);
  };

  const handleAddStep = () => {
    if (background) {
      onAddStep(background.id);
    }
  };

  const handleReorderSteps = (newSteps: Step[]) => {
    if (background) {
      const updatedBackground = { ...background, steps: newSteps };
      onBackgroundChange(updatedBackground);
    }
  };

  const handleEditStep = (stepId: string, newText: string) => {
    if (background) {
      const updatedSteps = background.steps.map(step =>
        step.id === stepId ? { ...step, text: newText } : step
      );
      const updatedBackground = { ...background, steps: updatedSteps };
      onBackgroundChange(updatedBackground);
    }
  };

  const handleEditStepType = (stepId: string, newType: Step["keyword"]) => {
    if (background) {
      const updatedSteps = background.steps.map(step =>
        step.id === stepId ? { ...step, keyword: newType } : step
      );
      const updatedBackground = { ...background, steps: updatedSteps };
      onBackgroundChange(updatedBackground);
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (background) {
      const updatedSteps = background.steps.filter(step => step.id !== stepId);
      const updatedBackground = { ...background, steps: updatedSteps };
      onBackgroundChange(updatedBackground);
    }
  };

  const handleDuplicateStep = (stepId: string) => {
    if (background) {
      const stepToDuplicate = background.steps.find(step => step.id === stepId);
      if (stepToDuplicate) {
        const duplicatedStep = {
          ...stepToDuplicate,
          id: `step-${Date.now()}`,
          text: stepToDuplicate.text + ' (copy)'
        };
        const stepIndex = background.steps.findIndex(step => step.id === stepId);
        const updatedSteps = [...background.steps];
        updatedSteps.splice(stepIndex + 1, 0, duplicatedStep);
        const updatedBackground = { ...background, steps: updatedSteps };
        onBackgroundChange(updatedBackground);
      }
    }
  };

  if (!background) {
    return (
      <Card className="mb-6 border-dashed border-2 border-gray-300 bg-gray-50">
        <CardContent className="p-6 text-right">
          <div className="flex flex-col items-center gap-4">
            <div className="text-gray-500">
              <p className="text-sm font-medium mb-2">بخشی برای پس‌زمینه وجود ندارد</p>
              <p className="text-xs text-gray-400">
                مراحل پس‌زمینه قبل از هر سناریو در این ویژگی اجرا می‌شوند
              </p>
            </div>
            <Button
              onClick={handleAddBackground}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              افزودن پس‌زمینه
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 h-auto"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <CardTitle className="text-lg font-semibold text-blue-800">
              پس‌زمینه
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {background.steps.length} مرحله
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddStep}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>افزودن مرحله پس‌زمینه</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveBackground}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>حذف پس‌زمینه</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <p className="text-sm text-blue-600 mr-8">
          این مراحل قبل از هر سناریو در این ویژگی اجرا می‌شوند
        </p>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0">
          <div className="mr-8">
            <StepsList
              steps={background.steps}
              onReorderSteps={(_scenarioId, newSteps) => handleReorderSteps(newSteps)}
              onAddStep={handleAddStep}
              onEditStep={handleEditStep}
              onEditStepType={handleEditStepType}
              onDeleteStep={handleDeleteStep}
              onDuplicateStep={handleDuplicateStep}
              scenarioId={background.id}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
} 