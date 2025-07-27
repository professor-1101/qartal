import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Edit } from "lucide-react";

interface GherkinEditorHeaderProps {
  featureName: string;
  featureDescription?: string;
  tags: string[];
  dirty: boolean;
  onSave: () => void;
  onFeatureNameChange?: (newName: string) => void;
  onFeatureDescriptionChange?: (newDescription: string) => void;
}

export function GherkinEditorHeader({ 
  featureName, 
  featureDescription = "", 
  tags, 
  dirty, 
  onSave, 
  onFeatureNameChange,
  onFeatureDescriptionChange 
}: GherkinEditorHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editNameValue, setEditNameValue] = useState(featureName);
  const [editDescriptionValue, setEditDescriptionValue] = useState(featureDescription);

  useEffect(() => {
    setEditNameValue(featureName);
    setEditDescriptionValue(featureDescription);
  }, [featureName, featureDescription]);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setEditNameValue(featureName);
  };

  const handleNameSave = () => {
    if (editNameValue.trim() && onFeatureNameChange) {
      onFeatureNameChange(editNameValue.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditNameValue(featureName);
    setIsEditingName(false);
  };

  const handleDescriptionEdit = () => {
    setIsEditingDescription(true);
    setEditDescriptionValue(featureDescription);
  };

  const handleDescriptionSave = () => {
    if (onFeatureDescriptionChange) {
      onFeatureDescriptionChange(editDescriptionValue);
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setEditDescriptionValue(featureDescription);
    setIsEditingDescription(false);
  };

  return (
    <nav className="sticky top-0 z-30 w-full bg-white border border-gray-200 rounded-lg flex flex-col gap-4 px-6 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSave();
                  } else if (e.key === 'Escape') {
                    handleNameCancel();
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
                onClick={handleNameEdit}
              >
                {featureName || 'بدون نام'}
              </span>
              {onFeatureNameChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNameEdit}
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
      </div>
      
      {/* Description Section */}
      <div className="flex items-start gap-2">
        {isEditingDescription ? (
          <div className="flex-1">
            <Textarea
              value={editDescriptionValue}
              onChange={(e) => {
                const newValue = e.target.value;
                const wordCount = newValue.trim() ? newValue.trim().split(/\s+/).length : 0;
                if (wordCount <= 150) {
                  setEditDescriptionValue(newValue);
                }
              }}
              onBlur={handleDescriptionSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleDescriptionCancel();
                }
              }}
              placeholder="توضیحات ویژگی را وارد کنید..."
              className="min-h-[80px] resize-none border-0 shadow-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0"
              autoFocus
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
              <span>تعداد کلمات: {editDescriptionValue.trim() ? editDescriptionValue.trim().split(/\s+/).length : 0}</span>
              <span>{editDescriptionValue.trim() ? editDescriptionValue.trim().split(/\s+/).length : 0}/150</span>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <p 
              className="text-sm text-muted-foreground cursor-pointer hover:text-gray-700 transition-colors min-h-[20px]"
              onClick={handleDescriptionEdit}
            >
              {featureDescription || 'توضیحات ویژگی را اضافه کنید...'}
            </p>
            {onFeatureDescriptionChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDescriptionEdit}
                className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity hover:bg-gray-100 rounded mt-1"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 