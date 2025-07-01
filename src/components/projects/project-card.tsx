"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { Project } from "@/types/index";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/i18n";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const { t, locale } = useI18n();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <>
      <Card className="w-full rounded-lg shadow-md border bg-background transition hover:shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{t("projectCard.features")}: {project.features.length}</p>
            <p>{t("projectCard.created")}: {formatDate(project.createdAt)}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2 pt-2">
          <Button
            variant="outline"
            asChild
            aria-label={t("projectCard.viewFeatures")}
          >
            <Link href={`/projects/${project.id}`}>
              {t("projectCard.viewFeatures")}
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            aria-label={t("projectCard.deleteDialogTitle")}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projectCard.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("projectCard.deleteDialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("projectCard.deleteDialogCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(project.id);
                setShowDeleteDialog(false);
              }}
            >
              {t("projectCard.deleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

ProjectCard.displayName = "ProjectCard";