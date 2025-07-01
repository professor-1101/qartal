"use client";
export const dynamic = "force-dynamic";

import { useI18n } from "@/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function LanguagePage() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.language')}</CardTitle>
        <CardDescription>{t('settings.languageDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <Label htmlFor="language-display">{t('settings.language')}</Label>
          <Input id="language-display" type="text" value="فارسی" readOnly disabled className="w-[180px]" />
        </div>
      </CardContent>
    </Card>
  );
}