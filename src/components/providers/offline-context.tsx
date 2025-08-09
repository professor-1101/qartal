"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface OfflineData {
  id: string;
  type: 'feature' | 'project';
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
}

interface OfflineContextType {
  isOnline: boolean;
  pendingChanges: OfflineData[];
  saveOffline: (data: OfflineData) => void;
  syncPendingChanges: () => Promise<void>;
  clearPendingChanges: () => void;
  hasPendingChanges: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingChanges, setPendingChanges] = useState<OfflineData[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Load pending changes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qartal-offline-changes');
      if (saved) {
        const changes = JSON.parse(saved) as OfflineData[];
        setPendingChanges(changes);
        setHasPendingChanges(changes.length > 0);
      }
    } catch (error) {
      console.error('Error loading offline changes:', error);
    }
  }, []);

  // Save pending changes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('qartal-offline-changes', JSON.stringify(pendingChanges));
      setHasPendingChanges(pendingChanges.length > 0);
    } catch (error) {
      console.error('Error saving offline changes:', error);
    }
  }, [pendingChanges]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("اتصال اینترنت برقرار شد", {
        description: pendingChanges.length > 0 ? 
          `${pendingChanges.length} تغییر منتظر همگام‌سازی است` : 
          undefined
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("اتصال اینترنت قطع شد", {
        description: "تغییرات شما در مرورگر ذخیره می‌شود"
      });
    };

    // Initial check
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingChanges.length]);

  const saveOffline = useCallback((data: OfflineData) => {
    setPendingChanges(prev => {
      // Remove any existing change for the same item
      const filtered = prev.filter(item => 
        !(item.type === data.type && item.id === data.id)
      );
      
      // Add the new change
      return [...filtered, data];
    });
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || pendingChanges.length === 0) return;

    toast.info("در حال همگام‌سازی تغییرات...", {
      description: `${pendingChanges.length} مورد در حال پردازش`,
      duration: 0, // Keep open until we update it
    });

    let successCount = 0;
    let errorCount = 0;

    for (const change of pendingChanges) {
      try {
        if (change.type === 'feature') {
          await syncFeatureChange(change);
        } else if (change.type === 'project') {
          await syncProjectChange(change);
        }
        successCount++;
      } catch (error) {
        console.error('Error syncing change:', error);
        errorCount++;
      }
    }

    // Clear successfully synced changes
    if (successCount > 0) {
      setPendingChanges([]);
    }

    // Show result
    if (errorCount === 0) {
      toast.success("همگام‌سازی کامل شد", {
        description: `${successCount} تغییر با موفقیت ذخیره شد`
      });
    } else {
      toast.error("برخی تغییرات همگام‌سازی نشدند", {
        description: `${successCount} موفق، ${errorCount} ناموفق`
      });
    }
  }, [isOnline, pendingChanges]);

  const syncFeatureChange = async (change: OfflineData) => {
    const response = await fetch(`/api/projects/${change.data.projectId}/features/${change.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(change.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync feature: ${response.statusText}`);
    }
  };

  const syncProjectChange = async (change: OfflineData) => {
    const response = await fetch(`/api/projects/${change.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(change.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync project: ${response.statusText}`);
    }
  };

  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    localStorage.removeItem('qartal-offline-changes');
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      const timer = setTimeout(() => {
        syncPendingChanges();
      }, 1000); // Wait 1 second after coming online
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingChanges.length, syncPendingChanges]);

  return (
    <OfflineContext.Provider value={{
      isOnline,
      pendingChanges,
      saveOffline,
      syncPendingChanges,
      clearPendingChanges,
      hasPendingChanges,
    }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}