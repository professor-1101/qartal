import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { deepNormalizeFeature } from '@/lib/deepNormalize';

// Mock DB/stub function (replace with real DB logic if available)
async function getFeature(projectId: string, featureId: string) {
  // TODO: Replace with real DB fetch
  if (projectId === 'demo' && featureId === 'demo') {
    return {
      id: featureId,
      title: 'نمونه فیچر',
      description: 'توضیحات نمونه',
      language: 'fa',
      scenarios: [
        {
          id: 'scenario-1',
          title: 'سناریوی نمونه',
          steps: ['فرض کاربر وارد شده است', 'وقتی روی دکمه کلیک می‌کند']
        }
      ],
      rules: [
        {
          id: 'rule-1',
          description: 'باید کاربر احراز هویت شده باشد'
        }
      ]
    };
  }
  // Not found
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string; featureId: string } }
) {
  const { projectId, featureId } = params;
  const feature = await getFeature(projectId, featureId);
  if (!feature) {
    return NextResponse.json(
      { error: 'Feature not found' },
      { status: 404 }
    );
  }
  const normalized = deepNormalizeFeature(structuredClone(feature));
  return NextResponse.json(normalized);
} 