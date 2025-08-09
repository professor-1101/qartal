"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getPersianInitials, getFullName } from "@/lib/persian-utils";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, BookOpen, LogOut, Settings, Activity, User, Folder, CheckCircle, Shield, BarChart3 } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

interface SidebarContentProps {
  navItems: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  onItemClick?: () => void;
}

export function SidebarContent({ navItems, onItemClick }: SidebarContentProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { data: session } = useSession();

  return (
    <div dir="rtl" className="px-2">
      {/* Main Platform Section */}
      <div data-slot="sidebar-group-label" data-sidebar="group-label" className="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-right">
        {t("sidebar.platform")}
      </div>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-[oklch(.145_0_0)]"
                )}
                onClick={onItemClick}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* Divider */}
      <div className="my-4 border-t border-border/50" />

      {/* User Pages Section */}
      <div data-slot="sidebar-group-label" data-sidebar="group-label" className="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-right">
        {t("sidebar.pages")}
      </div>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link
              href="/activities"
              className={cn(
                "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                pathname === "/activities" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
              )}
              onClick={onItemClick}
            >
              <Activity className="h-4 w-4" />
              <span>{t("sidebar.activities")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link
              href="/changelog"
              className={cn(
                "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                pathname === "/changelog" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
              )}
              onClick={onItemClick}
            >
              <Sparkles className="h-4 w-4" />
              <span>{t("sidebar.changelog")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link
              href="/docs"
              className={cn(
                "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                pathname === "/docs" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
              )}
              onClick={onItemClick}
            >
              <BookOpen className="h-4 w-4" />
              <span>{t("sidebar.docs")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {/* Admin Section - Only for Super Users */}
      {(session?.user as any)?.isSuper && (
        <>
          {/* Divider */}
          <div className="my-4 border-t border-border/50" />
          
          <div data-slot="sidebar-group-label" data-sidebar="group-label" className="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-right">
            مدیریت سیستم
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/qa"
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                    pathname === "/qa" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
                  )}
                  onClick={onItemClick}
                >
                  <Shield className="h-4 w-4" />
                  <span>نظارت و تایید</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/approved-versions"
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                    pathname === "/approved-versions" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
                  )}
                  onClick={onItemClick}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>نسخه‌های تایید شده</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/admin-users"
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                    pathname === "/admin-users" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
                  )}
                  onClick={onItemClick}
                >
                  <User className="h-4 w-4" />
                  <span>{t("sidebar.adminUsers")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/admin-projects"
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                    pathname === "/admin-projects" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
                  )}
                  onClick={onItemClick}
                >
                  <Folder className="h-4 w-4" />
                  <span>{t("sidebar.adminProjects")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/admin-activities"
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 text-[14px] text-right px-3 py-2 rounded-md hover:bg-accent/50",
                    pathname === "/admin-activities" ? "bg-accent text-accent-foreground font-medium" : "text-[oklch(.145_0_0)]"
                  )}
                  onClick={onItemClick}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t("sidebar.adminActivities")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </>
      )}
    </div>
  );
}

export function SidebarFooter() {
  const { t } = useI18n();
  const { data: session } = useSession();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    
    try {
      // Clear session first, then redirect
      await signOut({ 
        callbackUrl: '/sign-in',
        redirect: false
      });
      
      // Force page reload and redirect
      window.location.replace('/sign-in');
      
    } catch (error) {
      console.error('خطا در خروج از سیستم:', error);
      // Force redirect regardless of error
      window.location.replace('/sign-in');
    } finally {
      // Reset state in case user stays on page
      setTimeout(() => setIsSigningOut(false), 1000);
    }
  };

  // Get user data from session
  const userFirstName = (session?.user as any)?.firstName;
  const userLastName = (session?.user as any)?.lastName;
  const userEmail = session?.user?.email;

  return (
    <div className="p-4 border-t" dir="rtl">
      <div className="flex flex-col gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-3 hover:bg-accent transition-colors w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} alt={getFullName(userFirstName, userLastName)} />
                <AvatarFallback>{getPersianInitials(userFirstName, userLastName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0 text-right">
                <span className="font-medium text-sm truncate">
                  {getFullName(userFirstName, userLastName)}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {userEmail || t("sidebar.userEmail")}
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevrons-up-down ml-auto">
                <path d="m7 15 5 5 5-5"></path>
                <path d="m7 9 5-5 5 5"></path>
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 ml-2 text-right">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-right">
                  {getFullName(userFirstName, userLastName)}
                </span>
                <span className="text-xs text-muted-foreground text-right">
                  {userEmail || t("sidebar.userEmail")}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t("sidebar.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="text-red-600 cursor-pointer"
              disabled={isSigningOut}
            >
              <LogOut className={`ml-2 h-4 w-4 ${isSigningOut ? 'animate-spin' : ''}`} />
              <span>{isSigningOut ? 'در حال خروج...' : t("sidebar.signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 