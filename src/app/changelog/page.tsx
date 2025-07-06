"use client";
export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle,  Bug, Sparkles, Shield, Rocket, LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n";



export default function ChangelogPage() {
  const { t } = useI18n();

  const changelogData = [
    {
      version: "1.0.0",
      date: "۱ آوریل ۲۰۲۴",
      type: "اصلی",
      title: "اولین نسخه و ویژگی‌های اصلی",
      description: "اولین نسخه و انتشار قارطال، پایه‌گذاری پلتفرم مدرن تست BDD.",
      changes: [
        { type: "new", text: "داشبورد مدیریت پروژه با طراحی مینیمال و حرفه‌ای shadcn/ui" },
        { type: "new", text: "لیست پروژه‌ها با آواتار، شمارنده ویژگی‌ها و توضیحات کامل" },
        { type: "new", text: "مدیریت ویژگی‌ها: ایجاد، ویرایش و سازماندهی ویژگی‌ها برای هر پروژه" },
        { type: "new", text: "ویرایشگر گرکین برای سناریوهای BDD با برجسته‌سازی سینتکس و جدول مثال‌ها" },
        { type: "new", text: "احراز هویت کاربر (ثبت‌نام، ورود، مسیرهای محافظت شده)" },
        { type: "new", text: "طرح اولیه پایگاه داده Prisma و راه‌اندازی" },
        { type: "improvement", text: "استفاده مداوم از کامپوننت‌های shadcn/ui برای تمام لیست‌ها، کارت‌ها و نشان‌ها" },
        { type: "improvement", text: "طرح واکنش‌گرا و تایپوگرافی تمیز و خوانا" }
      ]
    }
  ];

  

  const getChangeIcon = (type: string) => {
    const colors = {
      new: "text-green-600",
      improvement: "text-blue-600",
      fix: "text-orange-600",
      security: "text-purple-600"
    };
    return colors[type as keyof typeof colors] || "text-muted-foreground";
  };

  const getIconForChange = (changeType: string): LucideIcon => {
    switch (changeType) {
      case 'new': return Sparkles;
      case 'improvement': return Rocket;
      case 'fix': return Bug;
      case 'security': return Shield;
      default: return CheckCircle;
    }
  }

  return (
    <div className="container max-w-3xl py-12" dir="rtl">
      <div className="mb-12">
        <h1 className="text-3xl font-semibold mb-3 text-right">{t("changelog.title")}</h1>
        <p className="text-muted-foreground text-right">
          {t("changelog.description")}
        </p>
      </div>

      <div className="space-y-8">
        {changelogData.map((release, index) => (
          <div key={release.version} className="relative">
            {index !== changelogData.length - 1 && (
              <div className="absolute right-6 top-12 w-px h-full bg-border" />
            )}

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center">
                  <span className="text-sm font-medium">{release.version}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <Card className="border-0 shadow-none bg-transparent p-0">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl font-medium text-right">
                          {release.title}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {release.type}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            {t("changelog.latest")}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{release.date}</span>
                    </div>
                    <CardDescription className="text-sm text-right">
                      {release.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {release.changes.map((change: any, changeIndex: number) => {
                        const IconComponent = getIconForChange(change.type);
                        return (
                          <div key={changeIndex} className="flex items-center gap-3">
                            <div className={`${getChangeIcon(change.type)}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-muted-foreground text-right">
                              {change.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}