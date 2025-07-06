import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface GherkinEditorHeaderProps {
  featureName: string;
  tags: string[];
  dirty: boolean;
  onSave: () => void;
}

export function GherkinEditorHeader({ featureName, tags, dirty, onSave }: GherkinEditorHeaderProps) {
  return (
    <nav className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur border-b border-gray-200 flex items-center justify-between px-6 py-3 mb-6 shadow-sm rtl">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg font-bold text-gray-900 truncate max-w-xs md:max-w-md" title={featureName}>
          {featureName || 'بدون نام'}
        </span>
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