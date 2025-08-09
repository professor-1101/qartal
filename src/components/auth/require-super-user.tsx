"use client";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AccessDenied } from './access-denied';

interface RequireSuperUserProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireSuperUser({ children, fallback }: RequireSuperUserProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/sign-in');
      return;
    }

    if (!(session.user as any)?.isSuper) {
      router.push('/');
      return;
    }

    if (!(session.user as any)?.isActive) {
      router.push('/access-denied');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session || !(session.user as any)?.isSuper || !(session.user as any)?.isActive) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
}