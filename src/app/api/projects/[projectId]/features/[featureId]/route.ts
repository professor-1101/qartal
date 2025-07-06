import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[projectId]/features/[featureId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { projectId: string; featureId: string } }
) {
  console.log('[DELETE] params:', params);
  try {
    const { projectId, featureId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[DELETE] Unauthorized, no session.user.email');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      console.log('[DELETE] User not found for email:', session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!project) {
      console.log('[DELETE] Project not found:', { projectId, userId: user.id });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const feature = await prisma.feature.findFirst({ where: { id: featureId, projectId } });
    if (!feature) {
      console.log('[DELETE] Feature not found:', { featureId, projectId });
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    await prisma.feature.delete({ where: { id: featureId } });
    console.log('[DELETE] Feature deleted successfully:', featureId);
    return NextResponse.json({ message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Error deleting feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/projects/[projectId]/features/[featureId]
export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string; featureId: string } }
) {
  console.log('[GET] params:', params);
  try {
    const { projectId, featureId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[GET] Unauthorized, no session.user.email');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      console.log('[GET] User not found for email:', session.user.email);
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
      console.log('[GET] Feature not found:', { featureId, projectId });
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    let rules;
    if (feature.rulesJson) {
      try { rules = JSON.parse(feature.rulesJson as any); } catch (e) { console.error('[GET] rulesJson parse error', e); }
    }

    const responsePayload = { ...feature, rules };
    console.log('[GET] response:', responsePayload);
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error fetching feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/projects/[projectId]/features/[featureId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; featureId: string } }
) {
  console.log('[PUT] params:', params);
  try {
    const { projectId, featureId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[PUT] Unauthorized, no session.user.email');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      console.log('[PUT] User not found for email:', session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!project) {
      console.log('[PUT] Project not found:', { projectId, userId: user.id });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = await request.json();
    console.log('[PUT] request body:', JSON.stringify(data, null, 2));

    // Remove existing scenarios & background
    await prisma.scenario.deleteMany({ where: { featureId } });
    await prisma.background.deleteMany({ where: { featureId } });

    // Re-create scenarios with nested steps & examples
    for (const scenario of data.scenarios || []) {
      console.log('[PUT] creating scenario:', scenario.name);
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
      console.log('[PUT] creating background with steps count:', data.background.steps.length);
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

    // Update feature metadata
    const rulesJson = data.rules ? JSON.stringify(data.rules) : undefined;

    const updatedFeature = await prisma.feature.update({
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

    let rules;
    if (updatedFeature.rulesJson) {
      try { rules = JSON.parse(updatedFeature.rulesJson as any); } catch (e) { console.error('[PUT] rulesJson parse error', e); }
    }

    const responsePayload = { ...updatedFeature, rules };
    console.log('[PUT] response:', JSON.stringify(responsePayload, null, 2));
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error updating feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}