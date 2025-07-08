import React, { RefObject } from "react";
import { Scenario, Step, Examples } from "@/types/gherkin";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScenarioCard } from "./components/scenario-card";

// DnD imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

interface GherkinEditorScenariosProps {
  scenarios: Scenario[];
  onAddScenario: (type: "scenario" | "scenario-outline") => void;
  onEditScenario: (scenarioId: string, newTitle: string, newType: "scenario" | "scenario-outline", examples?: Examples, newDescription?: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onDuplicateScenario: (scenarioId: string) => void;
  showAddScenarioMenu: boolean;
  setShowAddScenarioMenu: (show: boolean) => void;
  addScenarioButtonRef: RefObject<HTMLButtonElement>;
  onAddStep: (scenarioId: string) => void;
  onEditStep: (stepId: string, newText: string) => void;
  onEditStepType: (stepId: string, newType: Step["keyword"]) => void;
  onDeleteStep: (stepId: string) => void;
  onDuplicateStep: (stepId: string) => void;
  onReorderSteps: (scenarioId: string, newSteps: Step[]) => void;
  onReorderScenarios: (newScenarios: Scenario[]) => void; // اضافه شده برای DnD سناریوها
}

export function GherkinEditorScenarios({
  scenarios,
  onAddScenario,
  onEditScenario,
  onDeleteScenario,
  onDuplicateScenario,
  showAddScenarioMenu,
  setShowAddScenarioMenu,
  addScenarioButtonRef,
  onAddStep,
  onEditStep,
  onEditStepType,
  onDeleteStep,
  onDuplicateStep,
  onReorderSteps,
  onReorderScenarios, // اضافه شده
}: GherkinEditorScenariosProps) {
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // DnD handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = scenarios.findIndex(s => s.id === active.id);
      const newIndex = scenarios.findIndex(s => s.id === over?.id);
      const newOrder = arrayMove(scenarios, oldIndex, newIndex);
      onReorderScenarios(newOrder);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          سناریوها ({scenarios.length})
        </h3>
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddScenarioMenu(!showAddScenarioMenu)}
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
            <div id="add-scenario-dropdown-menu" className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
              <button
                className="block w-full text-right px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => { onAddScenario("scenario"); setShowAddScenarioMenu(false); }}
              >
                سناریوی معمولی
              </button>
              <button
                className="block w-full text-right px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => { onAddScenario("scenario-outline"); setShowAddScenarioMenu(false); }}
              >
                سناریو Outline
              </button>
            </div>
          )}
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={scenarios.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {scenarios.length > 0 ? (
              scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onRenameScenario={onEditScenario}
                  onDeleteScenario={onDeleteScenario}
                  onDuplicateScenario={onDuplicateScenario}
                  onAddStep={onAddStep}
                  onEditStep={onEditStep}
                  onEditStepType={onEditStepType}
                  onDeleteStep={onDeleteStep}
                  onDuplicateStep={onDuplicateStep}
                  onReorderSteps={(scenarioId, newSteps) => onReorderSteps(scenarioId, newSteps)}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                هنوز سناریویی اضافه نشده است
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
