"use client";
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';

export function AccessDenied() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only force logout if we have a session and user is confirmed inactive
    if (status === 'authenticated' && session?.user && !(session.user as any).isActive) {
      signOut({ callbackUrl: '/' });
    }
  }, [session, status]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl">دسترسی محدود شده</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            حساب کاربری شما توسط مدیر غیرفعال شده است. برای اطلاعات بیشتر با مدیر سیستم تماس بگیرید.
          </p>
          
          <Button 
            onClick={handleLogout}
            className="w-full"
            variant="outline"
          >
            <LogOut className="h-4 w-4 ml-2" />
            خروج از سیستم
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}