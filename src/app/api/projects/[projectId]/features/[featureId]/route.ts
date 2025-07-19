import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

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

    const data = await request.json();

    // Remove existing scenarios & background
    await prisma.scenario.deleteMany({ where: { featureId } });
    await prisma.background.deleteMany({ where: { featureId } });

    // Re-create scenarios with nested steps & examples
    for (const scenario of data.scenarios || []) {
      // پشتیبانی از هر دو حالت آرایه و آبجکت برای examples
      let exampleObj = undefined;
      if (Array.isArray(scenario.examples) && scenario.examples.length > 0) {
        exampleObj = scenario.examples[0];
      } else if (scenario.examples && typeof scenario.examples === 'object') {
        exampleObj = scenario.examples;
      }
      await prisma.scenario.create({
        data: {
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