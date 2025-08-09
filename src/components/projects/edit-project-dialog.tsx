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
import { Edit } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Project } from '@/types/index';
import { FormField } from '@/components/ui/form-field';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectUpdated: (project: { id: string; name: string; description: string }) => void;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onProjectUpdated,
}: EditProjectDialogProps) {
  const { t } = useI18n();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
  }, [project]);

  const handleSubmit = () => {
    if (!project || !name.trim()) {
      return;
    }
    onProjectUpdated({ id: project.id, name, description });
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            {t('projects.editProject')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t('projects.form.editDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <FormField
            id="edit-name"
            label={t('projects.form.name')}
            value={name}
            onChange={setName}
            placeholder={t('projects.form.namePlaceholder')}
            ariaLabel={t('projects.form.name')}
          />
          <FormField
            id="edit-description"
            label={t('projects.form.projectDescription')}
            value={description}
            onChange={setDescription}
            placeholder={t('projects.form.descriptionPlaceholder')}
            type="textarea"
            ariaLabel={t('projects.form.projectDescription')}
            maxWords={200}
            showWordCount={true}
          />
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={handleCancel} aria-label={t('common.cancel')}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} className="px-6" aria-label={t('projects.update')}>
            {t('projects.update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

EditProjectDialog.displayName = "EditProjectDialog";