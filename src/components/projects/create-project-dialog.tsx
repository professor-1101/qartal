"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: { name: string; description: string }) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const { t } = useI18n();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleSubmit = () => {
    if (!name.trim() || name.trim().length === 0) {
      // نمایش پیام خطا
      return;
    }
    onProjectCreated({ name: name.trim(), description });
    onOpenChange(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl">{t('projects.newProject')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {t('projects.form.name')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder={t('projects.form.namePlaceholder')}
              className="h-11"
              aria-label={t('projects.form.name')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {t('projects.form.projectDescription')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder={t('projects.form.descriptionPlaceholder')}
              className="min-h-[120px] resize-none p-3 bg-background border border-input"
              aria-label={t('projects.form.projectDescription')}
            />
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} aria-label={t('common.cancel')}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} className="px-6" aria-label={t('projects.create')}>
            {t('projects.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

CreateProjectDialog.displayName = "CreateProjectDialog";