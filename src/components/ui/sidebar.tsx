"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

export const Sidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "flex flex-col w-64 h-full bg-background border-r border-border transition-all duration-300",
        className
      )}
      {...props}
    />
  )
);
Sidebar.displayName = "Sidebar";

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-4 border-b border-border">{children}</div>;
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto space-4">{children}</div>;
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="space-4 border-t border-border">{children}</div>;
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2">{children}</ul>;
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ children, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className="w-full flex items-center space-2 space-x-3 space-y-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      {...props}
    >
      {children}
    </Comp>
  );
}

export function SidebarRail() {
  return <div className="w-2 bg-muted" />;
}