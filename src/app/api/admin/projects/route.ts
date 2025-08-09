import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/admin/projects?search=&status=&userId=&page=&pageSize=
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
  
  console.log('ADMIN PROJECTS API - ENV superuser emails:', superUserEmails);
  console.log('ADMIN PROJECTS API - User email:', session.user.email);
  console.log('ADMIN PROJECTS API - Is super?', isSuper);
  
  if (!user || !isSuper || !user.isActive) {
    return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { lastName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status && status !== 'all') {
    if (status === 'locked') {
      where.isLocked = true;
    } else if (status === 'pending') {
      where.versions = { some: { status: 'PENDING' } };
    } else if (status === 'approved') {
      where.versions = { some: { status: 'APPROVED' } };
    } else if (status === 'rejected') {
      where.versions = { some: { status: 'REJECTED' } };
    } else {
      where.status = status;
    }
  }
  if (userId) where.userId = userId;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
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
        features: {
          include: {
            scenarios: {
              include: { steps: true }
            },
            background: {
              include: { steps: true }
            }
          }
        },
        _count: {
          select: {
            features: true,
            gherkinFiles: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  // محاسبه آمار برای هر پروژه
  const projectsWithStats = projects.map(project => {
    let totalSteps = 0;
    let totalScenarios = 0;

    project.features.forEach(feature => {
      // شمارش مراحل background
      if (feature.background?.steps) {
        totalSteps += feature.background.steps.length;
      }
      // شمارش سناریوها و مراحل آن‌ها
      if (feature.scenarios) {
        totalScenarios += feature.scenarios.length;
        feature.scenarios.forEach(scenario => {
          if (scenario.steps) {
            totalSteps += scenario.steps.length;
          }
        });
      }
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      slang: project.slang,
      user: project.user,
      featuresCount: project._count.features,
      gherkinFilesCount: project._count.gherkinFiles,
      totalSteps,
      totalScenarios,
    };
  });

  return NextResponse.json({ projects: projectsWithStats, total, page, pageSize });
}

// PATCH /api/admin/projects?projectId=&action= (for status changes, ownership transfer)
export async function PATCH(request: NextRequest) {
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
  const projectId = searchParams.get("projectId");
  const action = searchParams.get("action");

  if (!projectId || !action) {
    return NextResponse.json({ error: "projectId and action are required" }, { status: 400 });
  }

  try {
    if (action === "toggle-status") {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      
      const newStatus = project.status === "active" ? "inactive" : "active";
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { status: newStatus },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      return NextResponse.json({ project: updatedProject });
    } 
    
    if (action === "transfer-ownership") {
      const { newUserId } = await request.json();
      if (!newUserId) {
        return NextResponse.json({ error: "newUserId is required" }, { status: 400 });
      }

      const newUser = await prisma.user.findUnique({ where: { id: newUserId } });
      if (!newUser) {
        return NextResponse.json({ error: "New user not found" }, { status: 404 });
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { userId: newUserId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      return NextResponse.json({ project: updatedProject });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/admin/projects?projectId=
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      include: { _count: { select: { features: true } } }
    });
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // قبل از حذف، فعالیت حذف پروژه را ثبت کن (بدون قرار دادن projectId)
    const deleter = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (deleter) {
      await prisma.activity.create({
        data: {
          userId: deleter.id,
          type: 'DELETE',
          action: 'project_deleted',
          description: `پروژه "${project.name}" حذف شد`,
          metadata: { projectName: project.name, deletedProjectId: project.id }
        }
      });
    }

    // حذف پروژه (cascade delete در schema باعث حذف خودکار features و موارد مرتبط می‌شود)
    await prisma.project.delete({ where: { id: projectId } });
    
    return NextResponse.json({ 
      success: true, 
      message: `پروژه "${project.name}" با ${project._count.features} ویژگی حذف شد.`
    });
  } catch (error) {
    console.error("Project delete error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}