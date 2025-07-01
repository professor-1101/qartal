"use client";

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { Project } from '@/types/index';

interface DeleteProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project | null;
    onProjectDeleted: (projectId: string) => void;
}

export function DeleteProjectDialog({
    open,
    onOpenChange,
    project,
    onProjectDeleted,
}: DeleteProjectDialogProps) {
    const handleDelete = () => {
        if (project) {
            onProjectDeleted(project.id);
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        حذف پروژه
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        آیا مطمئن هستید که می‌خواهید <span className="font-semibold"> {project?.name} </span> را حذف کنید؟ این عملیات قابل بازگشت نیست و پروژه و تمام داده‌های مرتبط با آن را به طور دائمی حذف خواهد کرد.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel aria-label="انصراف از حذف">انصراف</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        aria-label="تأیید حذف پروژه"
                    >
                        حذف پروژه
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

DeleteProjectDialog.displayName = "DeleteProjectDialog";