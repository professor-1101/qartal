import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users?search=&isActive=&page=&pageSize=
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Check if user is super user (check ENV first, then database)
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  
  // Check ENV-based superuser status
  const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
  const isSuperUser = superUserEmails.includes(session.user.email!) || user?.isSuper || false;
  
  console.log('ADMIN USERS API - ENV superuser emails:', superUserEmails);
  console.log('ADMIN USERS API - User email:', session.user.email);
  console.log('ADMIN USERS API - Is super?', isSuperUser);
  
  if (!user || !isSuperUser) {
    return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const isActive = searchParams.get("isActive");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (isActive === "true") where.isActive = true;
  if (isActive === "false") where.isActive = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        image: true,
        isSuper: true,
        isActive: true,
        createdAt: true,
        projects: { select: { id: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pageSize });
}

// PATCH /api/admin/users?userId=&action=
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is super user (check ENV first, then database)
  const currentUser = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { id: true, isSuper: true }
  });
  
  // Check ENV-based superuser status
  const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
  const isSuperUser = superUserEmails.includes(session.user.email!) || currentUser?.isSuper || false;
  
  if (!currentUser || !isSuperUser) {
    return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
  }

  // Prevent self-deactivation
  if (userId === currentUser.id && action === "toggle-active") {
    return NextResponse.json({ error: "Cannot modify your own status" }, { status: 400 });
  }

  try {
    let updateData: any = {};
    
    if (action === "toggle-active") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      updateData = { isActive: !user.isActive };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuper: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users?userId=
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is super user (check ENV first, then database)
  const currentUser = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { id: true, isSuper: true }
  });
  
  // Check ENV-based superuser status
  const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
  const isSuperUser = superUserEmails.includes(session.user.email!) || currentUser?.isSuper || false;
  
  if (!currentUser || !isSuperUser) {
    return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    // جلوگیری از حذف خودی
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (currentUser?.id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}