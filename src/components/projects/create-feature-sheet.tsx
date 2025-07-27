"use client";

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';
import { toast } from "@/components/ui/use-toast";

interface CreateFeatureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeatureCreated: (feature: any) => void;
  projectId: string;
}

export function CreateFeatureSheet({
  open,
  onOpenChange,
  onFeatureCreated,
  projectId,
}: CreateFeatureSheetProps) {
  const { t } = useI18n();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || title.trim().length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: title.trim(), description }),
      });
      if (!response.ok) throw new Error('Failed to create feature');
      const newFeature = await response.json();
      onFeatureCreated(newFeature);
      onOpenChange(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      toast('ایجاد ویژگی با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-6">
        <SheetHeader>
          <SheetTitle>{t('features.createSheet.title') || 'ایجاد ویژگی جدید'}</SheetTitle>
          <SheetDescription>
            {t('features.createSheet.description') || 'یک ویژگی جدید به پروژه خود اضافه کنید.'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              {t('features.createSheet.form.title') || 'عنوان ویژگی'}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder={t('features.createSheet.form.titlePlaceholder') || 'عنوان ویژگی را وارد کنید'}
              aria-label={t('features.createSheet.form.title') || 'عنوان ویژگی'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {t('features.createSheet.form.description') || 'توضیحات ویژگی'}
            </Label>
            <Textarea
              id="description"
              className="p-2"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;
                const wordCount = newValue.trim() ? newValue.trim().split(/\s+/).length : 0;
                if (wordCount <= 150) {
                  setDescription(newValue);
                }
              }}
              placeholder={t('features.createSheet.form.descriptionPlaceholder') || 'توضیح کوتاهی برای ویژگی وارد کنید'}
              aria-label={t('features.createSheet.form.description') || 'توضیحات ویژگی'}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>تعداد کلمات: {description.trim() ? description.trim().split(/\s+/).length : 0}</span>
              <span>{description.trim() ? description.trim().split(/\s+/).length : 0}/150</span>
            </div>
          </div>
        </div>
        <SheetFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} aria-label={t('common.cancel') || 'انصراف'}>
            {t('common.cancel') || 'انصراف'}
          </Button>
          <Button onClick={handleSubmit} aria-label={t('features.create') || 'ایجاد ویژگی'} disabled={!title.trim() || loading}>
            {loading ? t('common.loading') || 'در حال ایجاد...' : t('features.create') || 'ایجاد ویژگی'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

CreateFeatureSheet.displayName = "CreateFeatureSheet";