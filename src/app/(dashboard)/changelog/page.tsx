"use client";
export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle,  Bug, Sparkles, Shield, Rocket, LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";



export default function ChangelogPage() {
  const { t } = useI18n();

  // Use ISO dates and format to Jalaali at render time to avoid inconsistencies
  const changelogData = [
    {
      version: "1.0.0",
      date: "2025-01-16T00:00:00.000Z",
      type: "نسخه اصلی",
      title: "انتشار نسخه اصلی کارتال",
      description: "اولین نسخه کامل و پایدار کارتال با تمام ویژگی‌های اصلی.",
      changes: [
        { type: "new", text: "صفحه نمایش یکپارچه برای نمایش عمومی و آخرین تغییرات با تب‌های جداگانه" },
        { type: "new", text: "بهبود UI/UX در صفحه نمایش پروژه‌ها با کارت‌های زیبا و رنگ‌بندی مناسب" },
        { type: "new", text: "دکمه‌های کپی لینک و خروجی HTML در صفحه نمایش پروژه‌ها" },
        { type: "new", text: "نمایش اطلاعات کامل پروژه شامل مالک، تاریخ ایجاد و تعداد ویژگی‌ها" },
        { type: "new", text: "رنگ‌بندی و آیکون‌های مخصوص برای انواع مختلف steps (Given, When, Then)" },
        { type: "new", text: "جدول‌های قابل اسکرول برای Examples در سناریوها" },
        { type: "improvement", text: "بهبود لینک‌های نمایش عمومی و آخرین تغییرات در صفحه QA" },
        { type: "improvement", text: "بهبود محتوای صفحه مستندات با اطلاعات واقعی سیستم" },
        { type: "improvement", text: "اضافه شدن breadcrumb و notification در تمام صفحات" },
        { type: "fix", text: "رفع مشکل RTL در تب‌های صفحه پروژه" },
        { type: "fix", text: "رفع مشکل منوهای تکراری در sidebar" },
        { type: "fix", text: "تبدیل متن‌های انگلیسی به فارسی در سیستم" }
      ]
    },
    {
      version: "0.3.0",
      date: "2025-01-15T00:00:00.000Z",
      type: "به‌روزرسانی مهم",
      title: "بهبودهای رابط کاربری و ویژگی‌های جدید",
      description: "اضافه شدن تاریخ‌یاب فارسی، بهبود ویرایش توضیحات و رفع مشکلات کلیدی.",
      changes: [
        { type: "new", text: "تاریخ‌یاب فارسی برای فیلتر فعالیت‌ها با پشتیبانی از تاریخ دقیق" },
        { type: "new", text: "ویرایش توضیحات پروژه‌ها و ویژگی‌ها با محدودیت کلمات (200 کلمه برای پروژه، 150 برای ویژگی)" },
        { type: "new", text: "شمارنده کلمات در فرم‌های ویرایش با نمایش تعداد باقی‌مانده" },
        { type: "improvement", text: "بهبود محاسبه تعداد کل steps (background + scenario steps)" },
        { type: "improvement", text: "استاندارد کردن سایز محتوا در صفحات مستندات و تاریخچه تغییرات" },
        { type: "improvement", text: "بهبود کامپوننت FormField برای پشتیبانی از محدودیت کلمات" },
        { type: "improvement", text: "جایگزینی آیکون GitBranch با Layers برای نمایش سناریوها" },
        { type: "fix", text: "رفع مشکل Select component با استفاده از 'all' به جای رشته خالی" },
        { type: "fix", text: "رفع مشکلات واردات و متغیرهای استفاده نشده" },
        { type: "fix", text: "رفع مشکل تطبیق date-fns و استفاده از locale فارسی" },
        { type: "fix", text: "بهبود لاگ‌گیری تغییر ترتیب ویژگی‌ها" },
        { type: "fix", text: "نرمال‌سازی line endings برای جلوگیری از هشدارهای LF/CRLF" }
      ]
    },
    {
      version: "0.2.0",
      date: "2024-07-05T00:00:00.000Z",
      type: "به‌روزرسانی",
      title: "سیستم فعالیت‌ها و بهبودهای عملکرد",
      description: "اضافه شدن سیستم لاگ فعالیت‌ها و بهبودهای مختلف رابط کاربری.",
      changes: [
        { type: "new", text: "سیستم کامل لاگ فعالیت‌ها برای ردیابی تمام تغییرات پروژه" },
        { type: "new", text: "صفحه فعالیت‌ها با فیلترهای پیشرفته بر اساس نوع و تاریخ" },
        { type: "new", text: "نمایش فعالیت‌های اخیر در هر پروژه" },
        { type: "improvement", text: "بهبود عملکرد با ایندکس‌گذاری بهتر در پایگاه داده" },
        { type: "improvement", text: "بهبود ترجمه‌های فارسی در سراسر پلتفرم" }
      ]
    },
    {
      version: "0.1.0",
      date: "2024-07-04T00:00:00.000Z",
      type: "اصلی",
      title: "اولین نسخه و ویژگی‌های اصلی",
      description: "اولین نسخه و انتشار کارتال، پایه‌گذاری پلتفرم مدرن تست BDD.",
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
    <div className="container-fluid " dir="rtl">
      <DashboardPageHeader 
        title={t("changelog.title")}
        description={t("changelog.description")}
      />

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
                      <span className="text-sm text-muted-foreground ml-auto pl-2">
                        {(() => {
                          try {
                            const d = new Date(release.date);
                            if (isNaN(d.getTime())) return release.date;
                            return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
                          } catch { return release.date; }
                        })()}
                      </span>
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