"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateScenarioSheetProps {
  projectId: string;
  featureId: string;
}

export function CreateScenarioSheet({ projectId, featureId }: CreateScenarioSheetProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      steps: formData.get("steps") as string,
      projectId,
      featureId,
    };

    try {
      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create scenario");
      }

      const scenario = await response.json();
      setOpen(false);
      router.push(`/projects/${projectId}/features/${featureId}/scenarios/${scenario.id}`);
      router.refresh();
    } catch (error) {
      console.error("خطا در ایجاد سناریو:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button aria-label={t("projects.scenarios.createNew")}>{t("projects.scenarios.createNew")}</Button>
      </SheetTrigger>
      <SheetContent>
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{t("projects.scenarios.createNew")}</SheetTitle>
            <SheetDescription>
              {t("projects.scenarios.form.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("projects.scenarios.form.name")}</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder={t("projects.scenarios.form.name")}
                aria-label={t("projects.scenarios.form.name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("projects.scenarios.form.description")}</Label>
              <Textarea
                id="description"
                name="description"
                placeholder={t("projects.scenarios.form.description")}
                aria-label={t("projects.scenarios.form.description")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="steps">{t("projects.scenarios.form.steps")}</Label>
              <Textarea
                id="steps"
                name="steps"
                required
                className="font-mono h-[200px]"
                placeholder={t("projects.scenarios.form.stepsPlaceholder")}
                aria-label={t("projects.scenarios.form.steps")}
              />
            </div>
          </div>
          <SheetFooter className="gap-3 flex justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} aria-label={t("common.cancel")}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} aria-label={t("common.create")}>
              {loading ? t("common.loading") : t("common.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

CreateScenarioSheet.displayName = "CreateScenarioSheet";