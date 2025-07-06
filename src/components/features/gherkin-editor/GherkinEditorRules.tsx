import React from "react";
import { Rule } from "@/types/gherkin";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GherkinEditorRulesProps {
  rules: Rule[];
  onAddRule: () => void;
  onDeleteRule: (ruleId: string) => void;
  setShowRuleModal: (show: boolean) => void;
  setEditingRule: (rule: { id?: string; name: string; description: string } | null) => void;
}

export function GherkinEditorRules({
  rules,
  onAddRule,
  onDeleteRule,
  setShowRuleModal,
  setEditingRule,
}: GherkinEditorRulesProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">قوانین (Rules)</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddRule}
          className="text-xs px-2 py-1 h-7"
        >
          <Plus className="h-3 w-3 ml-1" />
          افزودن قانون
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {rules.length > 0 ? (
          rules.map((rule) => (
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
                    onClick={() => onDeleteRule(rule.id)}
                    className="text-xs px-2 py-1 h-6 text-red-600 hover:text-red-700"
                  >
                    حذف
                  </Button>
                </div>
              </div>
              {rule.description && (
                <div className="text-xs text-gray-600 mb-2">{rule.description}</div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            هنوز قانونی اضافه نشده است
          </div>
        )}
      </div>
    </div>
  );
} 