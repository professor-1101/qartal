"use client";

import React from "react";
import { Wifi, WifiOff, Clock, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOffline } from "@/components/providers/offline-context";
import { useAutoSave } from "@/components/providers/autosave-context";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionStatus({ className, showDetails = false }: ConnectionStatusProps) {
  const { isOnline, pendingChanges, syncPendingChanges, hasPendingChanges } = useOffline();
  const { isAutoSaving, lastSaved, isAutoSaveEnabled } = useAutoSave();

  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "همین الان";
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    
    return date.toLocaleDateString('fa-IR');
  };

  const getStatusIcon = () => {
    if (isAutoSaving) {
      return <Clock className="h-3 w-3 animate-spin" />;
    }
    
    if (!isOnline) {
      return <WifiOff className="h-3 w-3" />;
    }
    
    if (hasPendingChanges) {
      return <AlertCircle className="h-3 w-3" />;
    }
    
    return <Wifi className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (isAutoSaving) {
      return "در حال ذخیره...";
    }
    
    if (!isOnline) {
      return "آفلاین";
    }
    
    if (hasPendingChanges) {
      return `${pendingChanges.length} تغییر در انتظار`;
    }
    
    return "آنلاین";
  };

  const getStatusVariant = () => {
    if (isAutoSaving) return "secondary";
    if (!isOnline) return "destructive";
    if (hasPendingChanges) return "outline";
    return "default";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={getStatusVariant()}
        className="flex items-center gap-1 text-xs"
      >
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      
      {showDetails && (
        <>
          {/* Auto-save status */}
          {isAutoSaveEnabled && lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3" />
              آخرین ذخیره: {formatLastSaved(lastSaved)}
            </span>
          )}
          
          {/* Sync button for pending changes */}
          {!isOnline && hasPendingChanges && (
            <span className="text-xs text-muted-foreground">
              {pendingChanges.length} تغییر محلی ذخیره شده
            </span>
          )}
          
          {isOnline && hasPendingChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncPendingChanges}
              className="h-6 px-2 text-xs"
            >
              همگام‌سازی ({pendingChanges.length})
            </Button>
          )}
        </>
      )}
    </div>
  );
}