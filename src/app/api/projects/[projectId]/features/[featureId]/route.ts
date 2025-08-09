import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { ActivityLogger } from "@/lib/activity-logger";
// auto-versioning disabled; publish endpoint handles versioning explicitly

// DELETE /api/projects/[projectId]/features/[featureId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { projectId: string; featureId: string } }
) {
  try {
    const { projectId, featureId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if project is locked
    if (project.isLocked) {
      return NextResponse.json({ 
        error: "پروژه قفل است و در انتظار تایید QA Manager می‌باشد" 
      }, { status: 423 });
    }

    const feature = await prisma.feature.findFirst({ where: { id: featureId, projectId } });
    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Use transaction to delete feature and update project
    await prisma.$transaction(async (tx) => {
        await tx.feature.delete({ where: { id: featureId } });
        
        // Update project's updatedAt
        await tx.project.update({
            where: { id: projectId },
            data: { updatedAt: new Date() }
        });
    });

    // Log feature deletion activity
    await ActivityLogger.logFeatureDeleted(user.id, projectId, featureId, feature.name);
    
    // Auto-versioning disabled: only create versions on explicit publish
    
    return NextResponse.json({ message: "Feature deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/projects/[projectId]/features/[featureId]
export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string; featureId: string } }
) {
  try {
    const { projectId, featureId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const feature = await prisma.feature.findFirst({
      where: {
        id: featureId,
        projectId,
        project: { userId: user.id },
      },
      include: {
        scenarios: { include: { steps: true, examples: true } },
        background: { include: { steps: true } },
        project: { select: { id: true } },
      },
    });
    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    let rules;
    if (feature.rulesJson) {
      try { rules = JSON.parse(feature.rulesJson as any); } catch (e) { }
    }

    const responsePayload = { ...feature, rules };
    return NextResponse.json(responsePayload);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/projects/[projectId]/features/[featureId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; featureId: string } }
) {
  try {
    const { projectId, featureId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if project is locked
    if (project.isLocked) {
      return NextResponse.json({ 
        error: "پروژه قفل است و در انتظار تایید QA Manager می‌باشد" 
      }, { status: 423 }); // 423 = Locked
    }

    const data = await request.json();

    // Remove existing background 
    await prisma.background.deleteMany({ where: { featureId } });

    // Get existing scenarios to preserve IDs where possible
    const existingScenarios = await prisma.scenario.findMany({
      where: { featureId },
      include: { steps: true, examples: true }
    });

    // Create maps for efficient lookup
    const existingScenariosMap = new Map(existingScenarios.map(s => [s.id, s]));
    const newScenarioIds = new Set((data.scenarios || []).map((s: any) => s.id).filter((id: any) => id));

    // Remove scenarios that are no longer present
    const scenarioIdsToRemove = existingScenarios
      .filter(s => !newScenarioIds.has(s.id))
      .map(s => s.id);
    
    if (scenarioIdsToRemove.length > 0) {
      await prisma.scenario.deleteMany({ 
        where: { id: { in: scenarioIdsToRemove } } 
      });
    }

    // Update or create scenarios
    for (const scenario of data.scenarios || []) {
      // پشتیبانی از هر دو حالت آرایه و آبجکت برای examples
      let exampleObj = undefined;
      if (Array.isArray(scenario.examples) && scenario.examples.length > 0) {
        exampleObj = scenario.examples[0];
      } else if (scenario.examples && typeof scenario.examples === 'object') {
        exampleObj = scenario.examples;
      }
      const existingScenario = scenario.id ? existingScenariosMap.get(scenario.id) : null;
      
      if (existingScenario) {
        // Update existing scenario
        await prisma.step.deleteMany({ where: { scenarioId: scenario.id } });
        await prisma.examples.deleteMany({ where: { scenarioId: scenario.id } });
        
        await prisma.scenario.update({
          where: { id: scenario.id },
          data: {
            name: scenario.name,
            description: scenario.description,
            type: scenario.type,
            keyword: scenario.keyword,
            tags: scenario.tags,
            steps: {
              create: scenario.steps?.map((st: any) => ({
                keyword: st.keyword,
                text: st.text,
                argument: st.argument,
              })) || [],
            },
            examples: exampleObj
              ? {
                  create: [{
                    name: exampleObj.name,
                    description: exampleObj.description,
                    tags: exampleObj.tags,
                    header: exampleObj.header,
                    body: exampleObj.body,
                  }],
                }
              : undefined,
          },
        });
      } else {
        // Create new scenario
        await prisma.scenario.create({
          data: {
            id: scenario.id, // Preserve ID if provided
            featureId,
            name: scenario.name,
            description: scenario.description,
            type: scenario.type,
            keyword: scenario.keyword,
            tags: scenario.tags,
            steps: {
              create: scenario.steps?.map((st: any) => ({
                keyword: st.keyword,
                text: st.text,
                argument: st.argument,
              })) || [],
            },
            examples: exampleObj
              ? {
                  create: [{
                    name: exampleObj.name,
                    description: exampleObj.description,
                    tags: exampleObj.tags,
                    header: exampleObj.header,
                    body: exampleObj.body,
                  }],
                }
              : undefined,
          },
        });
      }
    }

    // Re-create background steps
    if (data.background?.steps?.length > 0) {
      await prisma.background.create({
        data: {
          featureId,
          steps: {
            create: data.background.steps.map((st: any) => ({
              keyword: st.keyword,
              text: st.text,
              argument: st.argument,
            })),
          },
        },
      });
    }

        // Update feature metadata and project's updatedAt
    const rulesJson = data.rules ? JSON.stringify(data.rules) : undefined;

    const result = await prisma.$transaction(async (tx) => {
        const updatedFeature = await tx.feature.update({
            where: { id: featureId, projectId },
            data: {
                name: data.name,
                description: data.description,
                tags: data.tags,
                rulesJson,
            },
            include: {
                scenarios: { include: { steps: true, examples: true } },
                background: { include: { steps: true } },
                project: { select: { id: true } },
            },
        });

        // Update project's updatedAt
        await tx.project.update({
            where: { id: projectId },
            data: { updatedAt: new Date() }
        });

        return updatedFeature;
    });

    // Log feature update activity
    const changes = {
        scenarios: data.scenarios?.length || 0,
        background: data.background?.steps?.length || 0,
        totalSteps: (data.scenarios?.reduce((acc: any, s: any) => acc + (s.steps?.length || 0), 0) || 0) + (data.background?.steps?.length || 0)
    };
    await ActivityLogger.logFeatureUpdated(user.id, projectId, featureId, result.name, changes);

    // Auto-versioning disabled: only create versions on explicit publish

        let rules;
    if (result.rulesJson) {
        try { rules = JSON.parse(result.rulesJson as any); } catch (e) { }
    }

    const responsePayload = { ...result, rules };
    return NextResponse.json(responsePayload);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}