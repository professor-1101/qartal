import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Edit } from "lucide-react";

interface GherkinEditorHeaderProps {
  featureName: string;
  tags: string[];
  dirty: boolean;
  onSave: () => void;
  onFeatureNameChange?: (newName: string) => void;
}

export function GherkinEditorHeader({ featureName, tags, dirty, onSave, onFeatureNameChange }: GherkinEditorHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(featureName);

  useEffect(() => {
    setEditValue(featureName);
  }, [featureName]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(featureName);
  };

  const handleSave = () => {
    if (editValue.trim() && onFeatureNameChange) {
      onFeatureNameChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(featureName);
    setIsEditing(false);
  };

  return (
    <nav className="sticky top-0 z-30 w-full bg-white border border-gray-200 rounded-lg flex items-center justify-between px-6 py-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              className="text-lg font-bold max-w-xs md:max-w-md border-0 shadow-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span 
              className="text-lg font-bold text-gray-900 truncate max-w-xs md:max-w-md cursor-pointer hover:text-blue-600 transition-colors" 
              title={featureName}
              onClick={handleEdit}
            >
              {featureName || 'بدون نام'}
            </span>
            {onFeatureNameChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity hover:bg-gray-100 rounded"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
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
          onClick={onSave}
          className="h-9 px-5"
        >
          ذخیره
          <Save className="ml-2 rtl:ml-0 rtl:mr-2" />
        </Button>
      </div>
    </nav>
  );
} 