import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/admin/activities?search=&type=&userId=&projectId=&featureId=&date=&exactDate=&page=&pageSize=
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is super user (check ENV first, then database)
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { isSuper: true, isActive: true }
  });
  
  // Check ENV-based superuser status
  const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
  const isSuper = superUserEmails.includes(session.user.email!) || user?.isSuper || false;
  
  if (!user || !isSuper || !user.isActive) {
    return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const projectId = searchParams.get("projectId");
  const featureId = searchParams.get("featureId");
  const date = searchParams.get("date");
  const exactDate = searchParams.get("exactDate");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where: any = {};

  // جستجو در description و action
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { lastName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { project: { name: { contains: search, mode: "insensitive" } } },
      { feature: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // فیلتر بر اساس نوع فعالیت
  if (type && type !== "all") {
    where.type = type;
  }

  // فیلتر بر اساس کاربر
  if (userId && userId !== "all") {
    where.userId = userId;
  }

  // فیلتر بر اساس پروژه
  if (projectId && projectId !== "all") {
    where.projectId = projectId;
  }

  // فیلتر بر اساس ویژگی
  if (featureId && featureId !== "all") {
    where.featureId = featureId;
  }

  // فیلتر بر اساس تاریخ
  if (exactDate) {
    const startDate = new Date(exactDate);
    const endDate = new Date(exactDate);
    endDate.setDate(endDate.getDate() + 1);
    where.createdAt = {
      gte: startDate,
      lt: endDate,
    };
  } else if (date) {
    const now = new Date();
    let startDate: Date;
    
    switch (date) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // همه تاریخ‌ها
    }
    
    where.createdAt = { gte: startDate };
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return NextResponse.json({ activities, total, page, pageSize });
}

// POST /api/admin/activities - دریافت لیست کاربران و پروژه‌ها برای فیلترها
export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const [users, projects, features] = await Promise.all([
      // کاربرانی که فعالیت دارند
      prisma.user.findMany({
        where: {
          activities: {
            some: {},
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
          { email: "asc" },
        ],
      }),
      // پروژه‌هایی که فعالیت دارند
      prisma.project.findMany({
        where: {
          activities: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      }),
      // ویژگی‌هایی که فعالیت دارند
      prisma.feature.findMany({
        where: {
          activities: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // نوع‌های فعالیت موجود
    const activityTypes = await prisma.activity.findMany({
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" },
    });

    return NextResponse.json({
      users,
      projects,
      features,
      activityTypes: activityTypes.map(at => at.type),
    });
  } catch (error) {
    console.error("Activity filters error:", error);
    return NextResponse.json({ error: "Failed to fetch filters" }, { status: 500 });
  }
}