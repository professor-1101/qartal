"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// removed alert
import {
  BookOpenText,
  Search,
  Sparkles,
  Layers,
  ListChecks,
  GitBranch,
  ShieldCheck,
  UserCheck,
  Share2,
  Download,
  FileJson,
  Globe,
} from "lucide-react";

export default function DocsPage() {
  // sections identifiers (sidebar removed)
  useMemo(() => (['intro','quickstart','projects','features','versioning','qa','export','faq']), []);

  const [query, setQuery] = useState("");

    return (
    <div className="container-fluid " dir="rtl">
      {/* Hero / Header */}
      <Card className="mb-6 overflow-hidden border-primary/10">
        <CardContent className="p-6 md:p-8 bg-gradient-to-l from-primary/5 via-transparent to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold">راهنمای رسمی کارتال</span>
                </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">مستندات پلتفرم کارتال</h1>
              <CardDescription className="text-right">
                همه چیز درباره مدیریت پروژه‌های BDD: از ساخت پروژه تا سناریونویسی، نسخه‌گذاری، تایید و اشتراک.
              </CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary">نسخه 1.0.0</Badge>
                <Badge variant="outline">به‌روزرسانی: ۱۴۰۳/۰۵</Badge>
                        </div>
                                        </div>
            <BookOpenText className="hidden md:block h-10 w-10 text-primary/60" />
                                    </div>

          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در فهرست مطالب..."
                className="pl-9 text-right"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
                                        </div>
            <div className="mt-3 text-xs text-muted-foreground text-right">
              راهنمایی: از سایدبار برای دسترسی سریع به بخش‌ها استفاده کنید.
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

      {/* Single column content (sidebar removed) */}
      <div className="space-y-10">
          {/* Intro */}
          <section id="intro" className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-row-reverse justify-end">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>معرفی کارتال</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-7">
              کارتال ابزاری برای مستندسازی و مدیریت نیازمندی‌ها بر اساس BDD است. با کارتال می‌توانید ویژگی‌ها (Features) و سناریوها (Scenarios) را با کلمات کلیدی استاندارد تعریف و نگهداری کنید.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-blue-200/60 bg-blue-50/40">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 flex-row-reverse justify-end"><Layers className="h-4 w-4 text-blue-600" />ساختارمند</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">مدیریت پروژه، ویژگی، سناریو و مراحل با نظم و ترتیب</CardContent>
              </Card>
              <Card className="border-emerald-200/60 bg-emerald-50/40">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 flex-row-reverse justify-end"><ListChecks className="h-4 w-4 text-emerald-600" />سناریونویسی استاندارد</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">پشتیبانی از Given/When/Then (و معادل فارسی)</CardContent>
              </Card>
            </div>
                    </section>

          {/* Quickstart */}
          <section id="quickstart" className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-row-reverse justify-end">
              <ListChecks className="h-5 w-5 text-emerald-600" />
              <span>شروع سریع</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 flex-row-reverse justify-end"><Badge variant="secondary">۱</Badge>ایجاد پروژه</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">از صفحه «پروژه‌ها» روی «پروژه جدید» بزنید و نام/توضیح را وارد کنید.</CardContent>
              </Card>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 flex-row-reverse justify-end"><Badge variant="secondary">۲</Badge>تعریف ویژگی</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">برای هر قابلیت یک Feature بسازید و توضیح بدهید.</CardContent>
              </Card>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 flex-row-reverse justify-end"><Badge variant="secondary">۳</Badge>سناریو و مراحل</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">سناریوها را اضافه کنید و مراحل را با کلیدواژه‌ها بنویسید.</CardContent>
              </Card>
                                </div>
                    </section>

          {/* Projects */}
          <section id="projects" className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-row-reverse justify-end"><Layers className="h-5 w-5 text-blue-600" />پروژه‌ها</h2>
                        <Card>
              <CardContent className="pt-5 text-sm text-muted-foreground leading-7">
                ایجاد، ویرایش، اشتراک و حذف پروژه‌ها. امکان قفل پروژه برای ارسال نسخه به QA.
                            </CardContent>
                        </Card>
                    </section>

          {/* Features & Scenarios */}
          <section id="features" className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-row-reverse justify-end"><ListChecks className="h-5 w-5 text-purple-600" />ویژگی‌ها و سناریوها</h2>
                        <Card>
              <CardContent className="pt-5 space-y-3 text-sm text-muted-foreground leading-7">
                <div>هر Feature شامل سناریوها و در صورت نیاز «پس‌زمینه» است. مراحل سناریو با کلیدواژه‌ها نمایش داده می‌شوند.</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-dashed bg-purple-50/40 border-purple-200/60">
                    <CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2"><ListChecks className="h-4 w-4" />کلیدواژه‌ها</CardTitle></CardHeader>
                    <CardContent className="text-xs text-muted-foreground">فرض / وقتی / آنگاه / و / اما</CardContent>
                  </Card>
                  <Card className="border-dashed bg-cyan-50/40 border-cyan-200/60">
                    <CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" />نمایش عمومی</CardTitle></CardHeader>
                    <CardContent className="text-xs text-muted-foreground">نمایش ویژگی‌ها در share view به صورت آکاردیون و TOC</CardContent>
                  </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Versioning */}
          <section id="versioning" className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-row-reverse justify-end"><GitBranch className="h-5 w-5 text-amber-600" />نسخه‌گذاری</h2>
                        <Card>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-slate-50/50 border-slate-200/60"><CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2 flex-row-reverse justify-end"><GitBranch className="h-4 w-4 text-slate-600" />Draft</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">پیش‌نویس</CardContent></Card>
                  <Card className="bg-amber-50/50 border-amber-200/60"><CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2 flex-row-reverse justify-end"><UserCheck className="h-4 w-4 text-amber-600" />Pending</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">در انتظار تایید</CardContent></Card>
                  <Card className="bg-emerald-50/50 border-emerald-200/60"><CardHeader className="pb-1"><CardTitle className="text-sm flex items-center gap-2 flex-row-reverse justify-end"><ShieldCheck className="h-4 w-4 text-emerald-600" />Approved</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">تایید شده</CardContent></Card>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* QA */}
          <section id="qa" className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-row-reverse justify-end"><ShieldCheck className="h-5 w-5 text-red-600" />نظارت و تایید</h2>
                        <Card>
              <CardContent className="pt-5 text-sm text-muted-foreground leading-7">
                پروژه‌های در انتظار تایید در صفحه QA نمایش داده می‌شوند. سوپریوزرها می‌توانند تایید/رد کنند و نوتیف برای مالک ارسال می‌شود.
                            </CardContent>
                        </Card>
                    </section>

          {/* Export & Share */}
          <section id="export" className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-row-reverse justify-end"><Share2 className="h-5 w-5 text-cyan-600" />خروجی و اشتراک</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Share2 className="h-4 w-4" />لینک اشتراک</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">ایجاد لینک عمومی (short code) و نمایش بدون نیاز به ورود</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" />HTML</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">خروجی HTML زیبا از مستندات</CardContent>
              </Card>
                        <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileJson className="h-4 w-4" />JSON</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">خروجی JSON برای پشتیبان‌گیری/انتقال</CardContent>
              </Card>
                                </div>
                    </section>

          {/* FAQ */}
          <section id="faq" className="space-y-3">
            <h2 className="text-xl font-bold">سوالات متداول</h2>
                        <Card>
              <CardContent className="pt-5 space-y-3 text-sm text-muted-foreground leading-7">
                <div>
                  <span className="font-medium text-foreground">share view لاگین می‌خواهد؟</span>
                  <div>خیر. نمایش عمومی بدون ورود است و سایدبار داشبورد نمایش داده نمی‌شود.</div>
                                        </div>
                <div>
                  <span className="font-medium text-foreground">چرا کلیدواژه‌ها رنگ دارند؟</span>
                  <div>برای خوانایی بهتر، رنگ‌بندی مطابق ادیتور گرکین اعمال شده است.</div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
    );
} 
