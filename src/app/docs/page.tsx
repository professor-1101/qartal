"use client";
export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    SearchIcon,
    Code,
    Zap,
    ArrowRight,
    FileText,
    Plus,
    Edit,
    Share,
  
    Info
} from "lucide-react";

export default function DocsPage() {

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            {/* Header */}
            <div className="border-b">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-right">مستندات کارتال</h1>
                            <p className="text-muted-foreground mt-1 text-right">راهنمای کامل استفاده از پلتفرم مدیریت تست BDD</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary">نسخه 1.0.0</Badge>
                            <Button variant="outline" size="sm">گیت‌هاب</Button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mt-8 max-w-md">
                        <div className="relative">
                            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="جستجو در مستندات..."
                                className="pr-10 text-right"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="space-y-6 sticky top-8">
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground uppercase mb-3 text-right">
                                    شروع کار
                                </h3>
                                <div className="space-y-2">
                                    <a href="#introduction" className="block text-sm hover:text-primary text-right">معرفی کارتال</a>
                                    <a href="#installation" className="block text-sm hover:text-primary text-right">نصب و راه‌اندازی</a>
                                    <a href="#first-project" className="block text-sm hover:text-primary text-right">ایجاد اولین پروژه</a>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground uppercase mb-3 text-right">
                                    راهنماها
                                </h3>
                                <div className="space-y-2">
                                    <a href="#projects" className="block text-sm hover:text-primary text-right">مدیریت پروژه‌ها</a>
                                    <a href="#features" className="block text-sm hover:text-primary text-right">ایجاد ویژگی‌ها</a>
                                    <a href="#gherkin" className="block text-sm hover:text-primary text-right">سینتکس Gherkin</a>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground uppercase mb-3 text-right">
                                    ویژگی‌های پیشرفته
                                </h3>
                                <div className="space-y-2">
                                    <a href="#collaboration" className="block text-sm hover:text-primary text-right">همکاری تیمی</a>
                                    <a href="#sharing" className="block text-sm hover:text-primary text-right">اشتراک‌گذاری</a>
                                    <a href="#export" className="block text-sm hover:text-primary text-right">خروجی و گزارش</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-12">

                        {/* Dev Setup Guide */}
                        <section id="dev-setup">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2 text-right">راهنمای نصب و توسعه</h2>
                                <p className="text-muted-foreground text-right">
                                    برای توسعه و اجرای پروژه Qartal مراحل زیر را دنبال کنید:
                                </p>
                            </div>
                            <Card>
                                <CardContent className="pt-6 space-y-6">
                                    <div>
                                        <h3 className="font-medium mb-2 text-right">۱. نصب وابستگی‌ها</h3>
                                        <div className="bg-muted rounded-lg p-4 font-mono text-sm text-left">
                                            pnpm install
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-right">۲. راه‌اندازی دیتابیس و Prisma</h3>
                                        <div className="bg-muted rounded-lg p-4 font-mono text-sm text-left">
                                            pnpm prisma generate
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-right">۳. اجرای migration دیتابیس</h3>
                                        <div className="bg-muted rounded-lg p-4 font-mono text-sm text-left">
                                            pnpm prisma migrate dev --name init
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-right">۴. اجرای پروژه در حالت توسعه</h3>
                                        <div className="bg-muted rounded-lg p-4 font-mono text-sm text-left">
                                            pnpm dev
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-right">۵. build گرفتن پروژه</h3>
                                        <div className="bg-muted rounded-lg p-4 font-mono text-sm text-left">
                                            pnpm build
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-right">۶. فعال‌سازی و نصب Web App (PWA)</h3>
                                        <ul className="list-disc pr-6 text-right text-sm text-muted-foreground space-y-1">
                                            <li>در مرورگر کروم یا موبایل، سایت را باز کنید.</li>
                                            <li>روی گزینه <b>Install App</b> یا <b>نصب برنامه</b> کلیک کنید.</li>
                                            <li>آیکون Qartal به صفحه اصلی یا دسکتاپ شما اضافه می‌شود.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Introduction */}
                        <section id="introduction">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2 text-right">معرفی کارتال</h2>
                                <p className="text-muted-foreground text-right">
                                    کارتال یک پلتفرم مدرن برای مدیریت تست‌های BDD (Behavior Driven Development) است که به تیم‌های توسعه کمک می‌کند تا تست‌های خود را به صورت ساختاریافته و قابل فهم مدیریت کنند.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-medium mb-2 text-right">مدیریت Gherkin</h3>
                                        <p className="text-sm text-muted-foreground mb-4 text-right">
                                            ایجاد و مدیریت فایل‌های Gherkin با ویرایشگر پیشرفته و پشتیبانی از سینتکس کامل
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                            <Zap className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h3 className="font-medium mb-2 text-right">گزارش‌گیری</h3>
                                        <p className="text-sm text-muted-foreground mb-4 text-right">
                                            تولید گزارش‌های تحلیلی و خروجی در فرمت‌های مختلف برای مدیریت پروژه
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Installation */}
                        <section id="installation">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-right">نصب و راه‌اندازی</h2>
                                <p className="text-muted-foreground text-right">
                                    کارتال یک پلتفرم وب است و نیازی به نصب خاصی ندارد. فقط کافی است در سایت ثبت‌نام کنید و شروع کنید.
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg text-right">مراحل شروع</CardTitle>
                                    <CardDescription className="text-right">
                                        برای شروع کار با کارتال، این مراحل را دنبال کنید
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <div>
                                            <h4 className="font-medium mb-1">ثبت‌نام در کارتال</h4>
                                            <p className="text-sm text-muted-foreground">به صفحه ثبت‌نام بروید و حساب کاربری خود را ایجاد کنید</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <div>
                                            <h4 className="font-medium mb-1">تأیید ایمیل</h4>
                                            <p className="text-sm text-muted-foreground">ایمیل خود را تأیید کنید تا حساب کاربری فعال شود</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <div>
                                            <h4 className="font-medium mb-1">ورود به داشبورد</h4>
                                            <p className="text-sm text-muted-foreground">وارد داشبورد شوید و اولین پروژه خود را ایجاد کنید</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* First Project */}
                        <section id="first-project">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-right">ایجاد اولین پروژه</h2>
                                <p className="text-muted-foreground text-right">
                                    یاد بگیرید چگونه اولین پروژه تست خود را در کارتال ایجاد کنید
                                </p>
                            </div>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-medium mb-3 text-right">مرحله 1: ایجاد پروژه جدید</h3>
                                            <div className="bg-muted rounded-lg p-4 text-sm text-right">
                                                <p>1. به صفحه پروژه‌ها بروید</p>
                                                <p>2. روی دکمه ایجاد پروژه کلیک کنید</p>
                                                <p>3. نام و توضیحات پروژه را وارد کنید</p>
                                                <p>4. پروژه را ذخیره کنید</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium mb-3 text-right">مرحله 2: اضافه کردن ویژگی</h3>
                                            <div className="bg-muted rounded-lg p-4 text-sm text-right">
                                                <p>1. روی پروژه کلیک کنید</p>
                                                <p>2. دکمه ایجاد ویژگی را بزنید</p>
                                                <p>3. عنوان و توضیحات ویژگی را وارد کنید</p>
                                                <p>4. ویژگی را ذخیره کنید</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium mb-3 text-right">مرحله 3: نوشتن سناریوها</h3>
                                            <div className="bg-muted rounded-lg p-4 text-sm text-right">
                                                <p>1. روی ویژگی کلیک کنید</p>
                                                <p>2. دکمه ایجاد سناریو را بزنید</p>
                                                <p>3. سناریو را با سینتکس Gherkin بنویسید</p>
                                                <p>4. سناریو را ذخیره کنید</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Projects Management */}
                        <section id="projects">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-right">مدیریت پروژه‌ها</h2>
                                <p className="text-muted-foreground text-right">
                                    یاد بگیرید چگونه پروژه‌های خود را به طور مؤثر مدیریت کنید
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg text-right">عملیات پروژه</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">ایجاد پروژه جدید</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Edit className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm">ویرایش اطلاعات پروژه</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Share className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm">اشتراک‌گذاری پروژه</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg text-right">نکات مهم</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                            <span className="text-sm">هر پروژه می‌تواند چندین ویژگی داشته باشد</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                            <span className="text-sm">پروژه‌ها را می‌توان با تیم اشتراک گذاشت</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                            <span className="text-sm">آمار پروژه به صورت خودکار محاسبه می‌شود</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Features */}
                        <section id="features">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-right">ایجاد ویژگی‌ها</h2>
                                <p className="text-muted-foreground text-right">
                                    ویژگی‌ها قلب تست‌های BDD هستند. یاد بگیرید چگونه آنها را ایجاد کنید
                                </p>
                            </div>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-medium mb-3 text-right">ساختار یک ویژگی</h3>
                                            <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                                                <pre className="text-sm font-mono text-right">
                                                    <code>{`Feature: مدیریت کاربر
  به عنوان یک مدیر سیستم
  می‌خواهم بتوانم کاربران را مدیریت کنم
  تا امنیت سیستم را تضمین کنم

  Scenario: ایجاد کاربر جدید
    Given یک مدیر سیستم وجود دارد
    When کاربر جدیدی با نام "علی احمدی" ایجاد می‌کند
    Then کاربر جدید باید در سیستم ثبت شود
    And ایمیل تأیید باید ارسال شود`}</code>
                                                </pre>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium mb-3 text-right">عناصر اصلی</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm">Feature</h4>
                                                    <p className="text-xs text-muted-foreground">عنوان و توضیحات کلی ویژگی</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm">Scenario</h4>
                                                    <p className="text-xs text-muted-foreground">سناریوهای مختلف تست</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm">Given</h4>
                                                    <p className="text-xs text-muted-foreground">شرایط اولیه و پیش‌فرض</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm">When</h4>
                                                    <p className="text-xs text-muted-foreground">عملیات و اقدامات</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm">Then</h4>
                                                    <p className="text-xs text-muted-foreground">نتایج مورد انتظار</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm">And</h4>
                                                    <p className="text-xs text-muted-foreground">شرایط یا نتایج اضافی</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Gherkin Syntax */}
                        <section id="gherkin">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-right">سینتکس Gherkin</h2>
                                <p className="text-muted-foreground text-right">
                                    یاد بگیرید چگونه سناریوهای خود را با سینتکس استاندارد Gherkin بنویسید
                                </p>
                            </div>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-medium mb-3 text-right">کلمات کلیدی فارسی</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-muted rounded-lg p-3">
                                                    <h4 className="font-medium text-sm mb-2">Given (با توجه به)</h4>
                                                    <p className="text-xs text-muted-foreground">شرایط اولیه را تعریف می‌کند</p>
                                                </div>
                                                <div className="bg-muted rounded-lg p-3">
                                                    <h4 className="font-medium text-sm mb-2">When (هنگامی که)</h4>
                                                    <p className="text-xs text-muted-foreground">عملیات اصلی را توصیف می‌کند</p>
                                                </div>
                                                <div className="bg-muted rounded-lg p-3">
                                                    <h4 className="font-medium text-sm mb-2">Then (آنگاه)</h4>
                                                    <p className="text-xs text-muted-foreground">نتایج مورد انتظار را مشخص می‌کند</p>
                                                </div>
                                                <div className="bg-muted rounded-lg p-3">
                                                    <h4 className="font-medium text-sm mb-2">And (و)</h4>
                                                    <p className="text-xs text-muted-foreground">شرایط یا نتایج اضافی</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium mb-3 text-right">مثال عملی</h3>
                                            <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                                                <pre className="text-sm font-mono text-right">
                                                    <code>{`Scenario: ورود موفق کاربر
  Given کاربر "admin@example.com" در سیستم ثبت‌نام شده است
  And رمز عبور "123456" برای این کاربر تنظیم شده است
  When کاربر با ایمیل "admin@example.com" و رمز "123456" وارد می‌شود
  Then صفحه داشبورد باید نمایش داده شود
  And پیام "خوش آمدید" باید نشان داده شود`}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Export and Reports */}
                        <section id="export">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-right">خروجی و گزارش</h2>
                                <p className="text-muted-foreground text-right">
                                    پروژه‌ها و ویژگی‌های خود را در فرمت‌های مختلف خروجی بگیرید
                                </p>
                            </div>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                                <FileText className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <h3 className="font-medium mb-2">PDF</h3>
                                            <p className="text-sm text-muted-foreground">خروجی در فرمت PDF برای مستندات</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                                <Code className="h-6 w-6 text-green-600" />
                                            </div>
                                            <h3 className="font-medium mb-2">JSON</h3>
                                            <p className="text-sm text-muted-foreground">خروجی JSON برای یکپارچه‌سازی</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                                <FileText className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <h3 className="font-medium mb-2">Gherkin</h3>
                                            <p className="text-sm text-muted-foreground">فایل‌های Gherkin استاندارد</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Next Steps */}
                        <section>
                            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                                <CardContent className="pt-6">
                                    <h3 className="font-medium mb-2 text-right">آماده شروع هستید؟</h3>
                                    <p className="text-sm text-muted-foreground mb-4 text-right">
                                        حالا که با کارتال آشنا شدید، اولین پروژه خود را ایجاد کنید
                                    </p>
                                    <div className="flex gap-3">
                                        <Button asChild>
                                            <a href="/projects">
                                                ایجاد پروژه جدید <ArrowRight className="mr-1 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
} 