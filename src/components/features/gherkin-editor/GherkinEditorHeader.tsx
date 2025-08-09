import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, Save, Clock, CheckCircle2, AlertCircle } from "lucide-react";

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 10) return 'همین الان';
  if (diffInSeconds < 60) return `${diffInSeconds} ثانیه پیش`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
  
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

interface GherkinEditorHeaderProps {
  featureName: string;
  featureDescription?: string;
  tags: string[];
  dirty: boolean;
  isAutoSaving?: boolean;
  isAutoSaveEnabled?: boolean;
  lastSaved?: Date | null;
  onSave: () => void | Promise<void>;
  onFeatureNameChange?: (newName: string) => void;
  onFeatureDescriptionChange?: (newDescription: string) => void;
}

export function GherkinEditorHeader({ 
  featureName, 
  featureDescription = "", 
  tags, 
  dirty, 
  isAutoSaving = false,
  isAutoSaveEnabled = true,
  lastSaved,
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
      {/* Professional Save Status/Button */}
      <div className="flex items-center gap-3">
        {isAutoSaveEnabled ? (
          /* Modern Auto-Save Mode */
          <div className="flex items-center">
            {isAutoSaving ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="relative">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <div className="absolute inset-0 w-4 h-4 bg-blue-100 rounded-full animate-ping opacity-30" />
                </div>
                <span className="text-sm font-medium text-blue-700">در حال ذخیره...</span>
              </div>
            ) : dirty ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                <div className="relative">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-medium text-amber-700">در انتظار ذخیره خودکار</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-green-700">ذخیره شده</span>
                  {lastSaved && (
                    <span className="text-xs text-green-600 opacity-80">
                      {formatRelativeTime(lastSaved)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Professional Manual Save Mode */
          <div className="flex items-center gap-3">
            {dirty ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">تغییرات ذخیره نشده</span>
              </div>
            ) : lastSaved && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">ذخیره شده</span>
                  <span className="text-xs text-gray-600 opacity-80">
                    {formatRelativeTime(lastSaved)}
                  </span>
                </div>
              </div>
            )}
            
            <Button
              variant={dirty ? "default" : "outline"}
              disabled={!dirty}
              onClick={onSave}
              className={`h-10 px-6 font-medium transition-all duration-200 ${
                dirty 
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105" 
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              <Save className="ml-2 rtl:ml-0 rtl:mr-2 h-4 w-4" />
              ذخیره تغییرات
            </Button>
          </div>
        )}
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