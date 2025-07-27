"use client";

import React from "react";
import { Feature } from "@/types/gherkin";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { GherkinEditorHeader } from "./GherkinEditorHeader";
import { GherkinEditorBackground } from "./GherkinEditorBackground";
import { GherkinEditorRules } from "./GherkinEditorRules";
import { GherkinEditorScenarios } from "./GherkinEditorScenarios";
import { GherkinEditorRuleModal } from "./GherkinEditorRuleModal";
import { useGherkinEditorLogic } from "./useGherkinEditorLogic";
import { GherkinPreview } from "./GherkinPreview";
import { deepNormalizeFeature } from '@/lib/deepNormalize';

interface GherkinEditorProps {
    feature: Feature;
    onFeatureChange: (feature: Feature) => void;
}

export function GherkinEditor({ feature: initialFeature, onFeatureChange }: GherkinEditorProps) {
    const normalizedFeature = deepNormalizeFeature(initialFeature);
    const logic = useGherkinEditorLogic(normalizedFeature);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full bg-gray-50 text-gray-900 font-sans antialiased">
                <Toaster />
                <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[3fr_1.5fr] gap-6 p-6">
                    <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
                        <GherkinEditorHeader
                            featureName={logic.feature.name}
                            featureDescription={logic.feature.description}
                            tags={logic.feature.tags}
                            dirty={logic.dirty}
                            onSave={() => {
                                onFeatureChange(logic.feature);
                                logic.setDirty(false);
                            }}
                            onFeatureNameChange={logic.handleFeatureNameChange}
                            onFeatureDescriptionChange={logic.handleFeatureDescriptionChange}
                        />
                        <GherkinEditorBackground
                            background={logic.feature.background}
                            onBackgroundChange={logic.handleBackgroundChange}
                            onAddStep={logic.handleAddBackgroundStep}
                            onEditStep={logic.handleEditBackgroundStep}
                            onEditStepType={logic.handleEditBackgroundStepType}
                            onDeleteStep={logic.handleDeleteBackgroundStep}
                            onDuplicateStep={logic.handleDuplicateBackgroundStep}
                            onReorderSteps={logic.handleReorderBackgroundSteps}
                        />
                        <GherkinEditorRules
                            rules={logic.feature.rules || []}
                            onAddRule={() => { logic.setEditingRule({ name: "", description: "" }); logic.setShowRuleModal(true); }}
                            onDeleteRule={logic.handleDeleteRule}
                            setShowRuleModal={logic.setShowRuleModal}
                            setEditingRule={logic.setEditingRule}
                        />
                        <GherkinEditorScenarios
                            scenarios={logic.feature.scenarios || []}
                            onAddScenario={logic.handleAddScenario}
                            onEditScenario={logic.handleRenameScenario}
                            onDeleteScenario={logic.handleDeleteScenario}
                            onDuplicateScenario={logic.handleDuplicateScenario}
                            showAddScenarioMenu={logic.showAddScenarioMenu}
                            setShowAddScenarioMenu={logic.setShowAddScenarioMenu}
                            addScenarioButtonRef={logic.addScenarioButtonRef}
                            onAddStep={logic.handleAddStep}
                            onEditStep={logic.handleEditStep}
                            onEditStepType={logic.handleEditStepType}
                            onDeleteStep={logic.handleDeleteStep}
                            onDuplicateStep={logic.handleDuplicateStep}
                            onReorderSteps={logic.handleReorderSteps}
                            onReorderScenarios={logic.handleReorderScenarios}
                        />
                        <div className="block lg:hidden">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">پیش‌نمایش</h3>
                                <GherkinPreview feature={logic.feature} />
                            </div>
                        </div>
                                        </div>
                    <div className="hidden lg:block overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">پیش‌نمایش</h3>
                            <GherkinPreview feature={logic.feature} />
                        </div>
                    </div>
                </main>
                <GherkinEditorRuleModal
                    open={logic.showRuleModal}
                    onClose={() => { logic.setShowRuleModal(false); logic.setEditingRule(null); }}
                    onSubmit={logic.handleAddOrEditRule}
                    editingRule={logic.editingRule}
                />
            </div>
        </TooltipProvider>
    );
}