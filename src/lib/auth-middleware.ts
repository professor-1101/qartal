import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { 
      id: true, 
      email: true, 
      isActive: true, 
      isSuper: true,
      firstName: true,
      lastName: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.isActive) {
    return NextResponse.json({ 
      error: 'Your account has been deactivated. Please contact administrator.' 
    }, { status: 403 });
  }

  return { user, session };
}

export async function requireSuperUser() {
  const authResult = await requireAuth();
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const { user } = authResult;

  if (!user.isSuper) {
    return NextResponse.json({ 
      error: 'Access denied. Super user privileges required.' 
    }, { status: 403 });
  }

  return authResult;
}

export async function preventSelfModification(userId: string, currentUserId: string) {
  if (userId === currentUserId) {
    return NextResponse.json({ 
      error: 'Cannot modify your own account status' 
    }, { status: 400 });
  }
  return null;
}