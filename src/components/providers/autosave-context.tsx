"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useOffline } from "./offline-context";
import { toast } from "sonner";

interface AutoSaveContextType {
  isAutoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  scheduleAutoSave: (id: string, type: 'feature' | 'project', data: any, projectId?: string) => void;
  cancelAutoSave: (id: string) => void;
  saveNow: (id: string) => Promise<void>;
  onSaveSuccess?: (projectId: string) => void;
  setOnSaveSuccess: (callback: (projectId: string) => void) => void;
}

const AutoSaveContext = createContext<AutoSaveContextType | undefined>(undefined);

interface PendingSave {
  id: string;
  type: 'feature' | 'project';
  data: any;
  projectId?: string;
  timeoutId: NodeJS.Timeout;
}

export function AutoSaveProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { isOnline, saveOffline } = useOffline();
  
  const [isAutoSaveEnabled, setIsAutoSaveEnabledState] = useState<boolean>(true);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const pendingSaves = useRef<Map<string, PendingSave>>(new Map());
  const onSaveSuccessCallback = useRef<((projectId: string) => void) | undefined>(undefined);

  // Load auto-save preference from user settings
  useEffect(() => {
    if (session?.user) {
      const userAutoSave = (session.user as any).autoSave;
      setIsAutoSaveEnabledState(userAutoSave !== false); // Default to true if not set
    }
  }, [session]);

  const setAutoSaveEnabled = useCallback(async (enabled: boolean) => {
    setIsAutoSaveEnabledState(enabled);
    
    // Save to server if online
    if (isOnline) {
      try {
        await fetch('/api/user/autosave', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ autoSave: enabled }),
        });
      } catch (error) {
        console.error('Failed to save auto-save preference:', error);
      }
    }
  }, [isOnline]);

  const performSave = useCallback(async (save: PendingSave) => {
    if (!isAutoSaveEnabled) return;

    setIsAutoSaving(true);
    
    try {
      if (isOnline) {
        // Try to save to server
        let response: Response;
        
        if (save.type === 'feature') {
          response = await fetch(`/api/projects/${save.projectId}/features/${save.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(save.data),
          });
        } else {
          response = await fetch(`/api/projects/${save.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(save.data),
          });
        }

        if (response.ok) {
          setLastSaved(new Date());
          toast.success("تغییرات خودکار ذخیره شد", { duration: 2000 });
          
          // Call success callback if available
          if (onSaveSuccessCallback.current && save.projectId) {
            onSaveSuccessCallback.current(save.projectId);
          }
        } else if (response.status === 423) {
          // Project is locked
          const errorData = await response.json();
          toast.warning(errorData.error || "پروژه قفل است", { duration: 4000 });
          return; // Don't retry or save offline
        } else {
          throw new Error('Server save failed');
        }
      } else {
        // Save offline
        saveOffline({
          id: save.id,
          type: save.type,
          data: save.data,
          timestamp: Date.now(),
          action: 'update',
        });
        
        setLastSaved(new Date());
        toast.info("تغییرات محلی ذخیره شد", { 
          description: "هنگام اتصال مجدد، همگام‌سازی خواهد شد",
          duration: 3000 
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // Fallback to offline save
      saveOffline({
        id: save.id,
        type: save.type,
        data: save.data,
        timestamp: Date.now(),
        action: 'update',
      });
      
      toast.warning("خطا در ذخیره‌سازی آنلاین", {
        description: "تغییرات محلی ذخیره شد",
        duration: 3000
      });
    } finally {
      setIsAutoSaving(false);
      pendingSaves.current.delete(save.id);
    }
  }, [isAutoSaveEnabled, isOnline, saveOffline]);

  const scheduleAutoSave = useCallback((
    id: string, 
    type: 'feature' | 'project', 
    data: any, 
    projectId?: string
  ) => {
    if (!isAutoSaveEnabled) return;

    // Cancel existing save for this item
    const existingSave = pendingSaves.current.get(id);
    if (existingSave) {
      clearTimeout(existingSave.timeoutId);
    }

    // Schedule new save (3 seconds delay)
    const timeoutId = setTimeout(() => {
      const save = pendingSaves.current.get(id);
      if (save) {
        performSave(save);
      }
    }, 3000);

    // Store the pending save
    pendingSaves.current.set(id, {
      id,
      type,
      data,
      projectId,
      timeoutId,
    });
  }, [isAutoSaveEnabled, performSave]);

  const cancelAutoSave = useCallback((id: string) => {
    const save = pendingSaves.current.get(id);
    if (save) {
      clearTimeout(save.timeoutId);
      pendingSaves.current.delete(id);
    }
  }, []);

  const saveNow = useCallback(async (id: string) => {
    const save = pendingSaves.current.get(id);
    if (save) {
      clearTimeout(save.timeoutId);
      await performSave(save);
    }
  }, [performSave]);

  const setOnSaveSuccess = useCallback((callback: (projectId: string) => void) => {
    onSaveSuccessCallback.current = callback;
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const currentPendingSaves = pendingSaves.current;
    return () => {
      currentPendingSaves.forEach(save => {
        clearTimeout(save.timeoutId);
      });
      currentPendingSaves.clear();
    };
  }, []);

  return (
    <AutoSaveContext.Provider value={{
      isAutoSaveEnabled,
      setAutoSaveEnabled,
      isAutoSaving,
      lastSaved,
      scheduleAutoSave,
      cancelAutoSave,
      saveNow,
      setOnSaveSuccess,
    }}>
      {children}
    </AutoSaveContext.Provider>
  );
}

export function useAutoSave() {
  const context = useContext(AutoSaveContext);
  if (context === undefined) {
    throw new Error('useAutoSave must be used within an AutoSaveProvider');
  }
  return context;
}