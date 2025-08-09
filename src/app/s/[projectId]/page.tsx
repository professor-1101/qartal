// no notFound; show friendly message instead
import { generateShortCode } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import ProjectViewClient from '@/components/projects/ProjectViewClient';
import { StepType } from '@/types/gherkin';

export const dynamic = 'force-dynamic';

export default async function SharePage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;

  // Resolve short code to real project id
  const projects = await prisma.project.findMany({ select: { id: true } });
  const match = projects.find(p => generateShortCode(p.id) === projectId);
  if (!match) {
    return (
      <div className="container " dir="rtl">
        <div className="max-w-xl mx-auto border rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">لینک نمایش پروژه نامعتبر است</h1>
          <p className="text-muted-foreground">ممکن است پروژه حذف شده باشد یا لینک اشتباه باشد.</p>
        </div>
      </div>
    );
  }

  // Load project (public view; no auth)
  const project = await prisma.project.findUnique({
    where: { id: match.id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      isLocked: true,
      slang: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!project) {
    return (
      <div className="container " dir="rtl">
        <div className="max-w-xl mx-auto border rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">این پروژه در دسترس نیست</h1>
          <p className="text-muted-foreground">ممکن است پروژه حذف شده باشد.</p>
        </div>
      </div>
    );
  }

  // Load features for display
  const featuresFromDb = await prisma.feature.findMany({
    where: { projectId: project.id },
    include: {
      scenarios: { include: { steps: true, examples: true } },
      background: { include: { steps: true } },
    },
    orderBy: { order: 'asc' },
  });

  const latestApprovedVersion = await prisma.projectVersion.findFirst({
    where: { projectId: project.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: { approvedBy: { select: { firstName: true, lastName: true } } },
  });

  const features: any[] = featuresFromDb.map(feature => ({
    id: feature.id,
    name: feature.name,
    description: feature.description || undefined,
    order: feature.order,
    tags: feature.tags || [],
    scenarios: feature.scenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description || undefined,
      order: (scenario as any).order || 0,
      type: 'scenario',
      tags: [],
      steps: scenario.steps.map(step => ({
        id: step.id,
        type: (step.keyword as StepType),
        text: step.text,
        keyword: step.keyword as StepType,
        order: (step as any).order || 0,
      })),
      examples: scenario.examples.map(example => ({
        id: example.id,
        headers: Array.isArray(example.header)
          ? example.header
          : typeof example.header === 'string'
            ? (() => { try { return JSON.parse(example.header as unknown as string); } catch { return []; } })()
            : (example.header ?? []),
        rows: Array.isArray(example.body)
          ? example.body
          : typeof example.body === 'string'
            ? (() => { try { return JSON.parse(example.body as unknown as string); } catch { return []; } })()
            : (example.body ?? []),
      })),
    })),
    background: feature.background ? {
      id: feature.background.id,
      steps: feature.background.steps.map(step => ({
        id: step.id,
        type: (step.keyword as StepType),
        text: step.text,
        keyword: step.keyword as StepType,
        order: (step as any).order || 0,
      })),
    } : undefined,
  }));

  return (
    <ProjectViewClient
      project={project as any}
      features={features}
      approvedFeatures={features}
      latestApprovedVersion={latestApprovedVersion}
      compact
    />
  );
}