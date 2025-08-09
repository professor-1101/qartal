"use client";
export const dynamic = "force-dynamic";


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { User, Shield, Settings, Cloud } from "lucide-react";
import { useI18n } from "@/i18n";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";
import { signIn } from "next-auth/react";
import { useAutoSave } from "@/components/providers/autosave-context";

export default function SettingsPage() {
  const { t } = useI18n();
  const { data: session, update } = useSession();
  const { isAutoSaveEnabled, setAutoSaveEnabled } = useAutoSave();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Azure DevOps settings state
  const [azureSettings, setAzureSettings] = useState({
    apiUrl: "",
    tfsUrl: "",
    token: ""
  });

  // Load user data when session is available
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        firstName: (session.user as any).firstName || "",
        lastName: (session.user as any).lastName || "",
        email: session.user.email || ""
      });
    }
  }, [session]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
        }),
      });

      if (response.ok) {
        // Update session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email,
          },
        });
        // Force session refresh by signing in again
        await signIn("credentials", {
          email: profileData.email,
          password: undefined, // رمز عبور نیاز نیست چون session فعال است
          redirect: false,
        });
        toast.success("اطلاعات پروفایل با موفقیت به‌روزرسانی شد");
      } else {
        const error = await response.json();
        throw new Error(error.message || "خطا در به‌روزرسانی پروفایل");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در به‌روزرسانی پروفایل");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("گذرواژه جدید و تکرار آن مطابقت ندارند");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("گذرواژه جدید باید حداقل ۸ کاراکتر باشد");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success("گذرواژه با موفقیت تغییر یافت");

        // Clear password form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "خطا در تغییر گذرواژه");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در تغییر گذرواژه");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAzureSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/azure-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(azureSettings),
      });

      if (response.ok) {
        toast.success("تنظیمات Azure DevOps با موفقیت ذخیره شد");
      } else {
        const error = await response.json();
        throw new Error(error.message || "خطا در ذخیره تنظیمات Azure");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در ذخیره تنظیمات Azure");
    } finally {
      setIsLoading(false);
    }
  };

  // Load Azure settings
  useEffect(() => {
    const loadAzureSettings = async () => {
      try {
        const response = await fetch("/api/user/azure-settings");
        if (response.ok) {
          const settings = await response.json();
          setAzureSettings({
            apiUrl: settings.apiUrl || "",
            tfsUrl: settings.tfsUrl || "",
            token: settings.token || ""
          });
        }
      } catch (error) {
        console.error("Error loading Azure settings:", error);
      }
    };

    if (session?.user) {
      loadAzureSettings();
    }
  }, [session]);

  const tabs = [
    {
      id: "profile",
      label: t("userNav.profile"),
      icon: User,
      description: t("settings.profileDescription")
    },
    {
      id: "preferences",
      label: "تنظیمات",
      icon: Settings,
      description: "تنظیمات عمومی و ترجیحات"
    },
    {
      id: "security",
      label: t("settings.security"),
      icon: Shield,
      description: t("settings.securityDescription")
    },
    // Azure tab only for super users
    ...((session?.user as any)?.isSuper ? [{
      id: "azure",
      label: "همگام‌سازی Azure",
      icon: Cloud,
      description: "تنظیمات Azure DevOps و TFS"
    }] : [])
  ];

  return (
    <div dir="rtl">
      <DashboardPageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <div className="flex gap-8 mt-8">
        {/* Vertical Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-all duration-200 ${activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{tab.label}</div>
                    <div className={`text-xs ${activeTab === tab.id
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                      }`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card className="max-w-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl text-right">
                  <User className="h-5 w-5" />
                  {t("userNav.profile")}
                </CardTitle>
                <CardDescription className="text-right text-base">
                  {t("settings.profileDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs text-right">{t("auth.form.firstName")}</Label>
                      <Input
                        id="firstName"
                        placeholder={t("auth.form.firstNamePlaceholder")}
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="h-8 text-sm text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs text-right">{t("auth.form.lastName")}</Label>
                      <Input
                        id="lastName"
                        placeholder={t("auth.form.lastNamePlaceholder")}
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="h-8 text-sm text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs text-right">{t("auth.form.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.form.emailPlaceholder")}
                        value={profileData.email}
                        readOnly
                        disabled
                        className="h-8 text-sm text-right"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} size="sm">
                      {isLoading ? t("common.loading") : t("common.save")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "preferences" && (
            <Card className="max-w-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl text-right">
                  <Settings className="h-5 w-5" />
                  تنظیمات
                </CardTitle>
                <CardDescription className="text-right text-base">
                  تنظیمات عمومی و ترجیحات کاربری
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto-save Setting */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-right">
                    <Label className="text-base">ذخیره خودکار</Label>
                    <div className="text-sm text-muted-foreground">
                      تغییرات شما به صورت خودکار ذخیره می‌شود
                    </div>
                  </div>
                  <Switch
                    checked={isAutoSaveEnabled}
                    onCheckedChange={setAutoSaveEnabled}
                  />
                </div>
                
                <Separator />
                
                {/* Auto-save Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm text-right">درباره ذخیره خودکار</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 text-right">
                    <li>• تغییرات شما ۳ ثانیه پس از آخرین ویرایش ذخیره می‌شود</li>
                    <li>• در صورت قطع اینترنت، تغییرات در مرورگر نگهداری می‌شود</li>
                    <li>• هنگام برقراری مجدد اتصال، تغییرات همگام‌سازی می‌شود</li>
                    <li>• می‌توانید در هر زمان این قابلیت را فعال یا غیرفعال کنید</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="max-w-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl text-right">
                  <Shield className="h-5 w-5" />
                  {t("settings.security")}
                </CardTitle>
                <CardDescription className="text-right text-base">
                  {t("settings.securityDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="currentPassword" className="text-xs text-right">گذرواژه فعلی</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="گذرواژه فعلی خود را وارد کنید"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newPassword" className="text-xs text-right">گذرواژه جدید</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="گذرواژه جدید خود را وارد کنید"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-xs text-right">تکرار گذرواژه جدید</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="گذرواژه جدید خود را تکرار کنید"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="h-8 text-sm text-right"
                    />
                  </div>

                  {/* Security Tips */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm text-right">نیازمندی‌های گذرواژه</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 text-right">
                      <li>• حداقل ۸ کاراکتر</li>
                      <li>• شامل حروف بزرگ و کوچک</li>
                      <li>• شامل حداقل یک عدد</li>
                      <li>• شامل حداقل یک کاراکتر خاص</li>
                    </ul>
                  </div>

                  <Separator />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} size="sm">
                      {isLoading ? "در حال به‌روزرسانی..." : "به‌روزرسانی گذرواژه"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "azure" && (session?.user as any)?.isSuper && (
            <Card className="max-w-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl text-right">
                  <Cloud className="h-5 w-5" />
                  همگام‌سازی Azure DevOps
                </CardTitle>
                <CardDescription className="text-right text-base">
                  تنظیمات اتصال به Azure DevOps و TFS برای همگام‌سازی پروژه‌ها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAzureSettingsSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="apiUrl" className="text-xs text-right">API URL</Label>
                    <Input
                      id="apiUrl"
                      type="url"
                      placeholder="http://192.168.10.150:5050/api/v1"
                      value={azureSettings.apiUrl}
                      onChange={(e) => setAzureSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                      className="h-8 text-sm text-left"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      آدرس API سرور Azure DevOps شما
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="tfsUrl" className="text-xs text-right">Azure DevOps TFS URL</Label>
                    <Input
                      id="tfsUrl"
                      type="url"
                      placeholder="https://dev.azure.com/yourorg"
                      value={azureSettings.tfsUrl}
                      onChange={(e) => setAzureSettings(prev => ({ ...prev, tfsUrl: e.target.value }))}
                      className="h-8 text-sm text-left"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      آدرس Azure DevOps یا TFS سازمان شما
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="token" className="text-xs text-right">Personal Access Token</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="RPK\\username:token"
                      value={azureSettings.token}
                      onChange={(e) => setAzureSettings(prev => ({ ...prev, token: e.target.value }))}
                      className="h-8 text-sm text-left"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      توکن دسترسی شخصی برای احراز هویت (فرمت: Domain\\Username:Token)
                    </p>
                  </div>

                  {/* Azure Integration Info */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm text-right">درباره همگام‌سازی Azure</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 text-right">
                      <li>• پروژه‌های شما به صورت async به Azure DevOps ارسال می‌شود</li>
                      <li>• وضعیت همگام‌سازی در صفحه پروژه قابل مشاهده است</li>
                      <li>• نتایج import در دیتابیس ذخیره می‌شود</li>
                      <li>• در صورت بروز خطا، جزئیات در لاگ‌ها نمایش داده می‌شود</li>
                    </ul>
                  </div>

                  <Separator />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} size="sm">
                      {isLoading ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 