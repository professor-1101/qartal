"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import type { VersionDiff, FeatureDiff } from '@/lib/versioning-diff';
import { 
  GitCompare, 
  Plus, 
  Minus, 
  Edit, 
  FileText,
  Hash,
  Code
} from 'lucide-react';

interface VersionDiffViewerProps {
  diff: VersionDiff;
  oldVersionName: string;
  newVersionName: string;
}

export function VersionDiffViewer({ diff, oldVersionName, newVersionName }: VersionDiffViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitCompare className="h-4 w-4 ml-2" />
          مقایسه تغییرات
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            مقایسه نسخه‌ها: {oldVersionName} ← {newVersionName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">خلاصه تغییرات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{diff.summary.addedFeatures}</div>
                  <div className="text-sm text-muted-foreground">فیچر اضافه شده</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{diff.summary.modifiedFeatures}</div>
                  <div className="text-sm text-muted-foreground">فیچر تغییر یافته</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{diff.summary.removedFeatures}</div>
                  <div className="text-sm text-muted-foreground">فیچر حذف شده</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{diff.summary.addedFeatures + diff.summary.modifiedFeatures + diff.summary.removedFeatures}</div>
                  <div className="text-sm text-muted-foreground">کل تغییرات</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Changes */}
          <div className="h-[60vh] overflow-y-auto">
            <Tabs defaultValue="added" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="added" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  اضافه شده ({diff.features.filter(f => f.status === 'added').length})
                </TabsTrigger>
                <TabsTrigger value="modified" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  تغییر یافته ({diff.features.filter(f => f.status === 'modified').length})
                </TabsTrigger>
                <TabsTrigger value="removed" className="flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  حذف شده ({diff.features.filter(f => f.status === 'removed').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="added" className="space-y-4">
                {diff.features.filter(f => f.status === 'added').length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    فیچر جدیدی اضافه نشده است
                  </div>
                ) : (
                  diff.features.filter(f => f.status === 'added').map((feature) => (
                    <Card key={feature.id} className="border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-green-700 flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {feature.name}
                        </CardTitle>
                        {feature.newData?.description && (
                          <p className="text-sm text-muted-foreground">{feature.newData.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">سناریوها:</span> {feature.newData?.scenarios?.length || 0}
                          </div>
                          <div>
                            <span className="font-medium">تگ‌ها:</span> {feature.newData?.tags?.length || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="modified" className="space-y-4">
                {diff.features.filter(f => f.status === 'modified').length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    فیچری تغییر نکرده است
                  </div>
                ) : (
                  diff.features.filter(f => f.status === 'modified').map((featureDiff) => (
                    <FeatureDiffCard key={featureDiff.id} featureDiff={featureDiff} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="removed" className="space-y-4">
                {diff.features.filter(f => f.status === 'removed').length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    فیچری حذف نشده است
                  </div>
                ) : (
                  diff.features.filter(f => f.status === 'removed').map((feature) => (
                    <Card key={feature.id} className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-red-700 flex items-center gap-2">
                          <Minus className="h-4 w-4" />
                          {feature.name}
                        </CardTitle>
                        {feature.oldData?.description && (
                          <p className="text-sm text-muted-foreground">{feature.oldData.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">سناریوها:</span> {feature.oldData?.scenarios?.length || 0}
                          </div>
                          <div>
                            <span className="font-medium">تگ‌ها:</span> {feature.oldData?.tags?.length || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureDiffCard({ featureDiff }: { featureDiff: FeatureDiff }) {
  const oldData = featureDiff.oldData;
  const newData = featureDiff.newData;
  
  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-700 flex items-center gap-2">
          <Edit className="h-4 w-4" />
          {featureDiff.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Basic Changes */}
          {(oldData?.name !== newData?.name || oldData?.description !== newData?.description) && (
            <AccordionItem value="basic">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  تغییرات اصلی
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {oldData?.name !== newData?.name && (
                    <DiffLine 
                      label="نام فیچر"
                      old={oldData?.name || ''}
                      new={newData?.name || ''}
                    />
                  )}
                  {oldData?.description !== newData?.description && (
                    <DiffLine 
                      label="توضیحات"
                      old={oldData?.description || ''}
                      new={newData?.description || ''}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Scenario Changes */}
          {featureDiff.scenarios && featureDiff.scenarios.length > 0 && (
            <AccordionItem value="scenarios">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  تغییرات سناریو ({featureDiff.scenarios.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {featureDiff.scenarios.map((scenarioDiff) => (
                    <div key={scenarioDiff.id} className="border rounded p-3">
                      <div className="font-medium text-sm mb-2">{scenarioDiff.name}</div>
                      {scenarioDiff.status === 'added' && (
                        <div className="text-green-600 text-sm">+ اضافه شده</div>
                      )}
                      {scenarioDiff.status === 'removed' && (
                        <div className="text-red-600 text-sm">- حذف شده</div>
                      )}
                      {scenarioDiff.status === 'modified' && (
                        <div className="text-blue-600 text-sm">~ تغییر یافته</div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Background Changes */}
          {featureDiff.background && featureDiff.background.status !== 'unchanged' && (
            <AccordionItem value="background">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  تغییرات پیش‌زمینه
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm">
                  {featureDiff.background.status === 'added' && (
                    <div className="text-green-600">+ پیش‌زمینه اضافه شده</div>
                  )}
                  {featureDiff.background.status === 'removed' && (
                    <div className="text-red-600">- پیش‌زمینه حذف شده</div>
                  )}
                  {featureDiff.background.status === 'modified' && (
                    <div className="text-blue-600">~ پیش‌زمینه تغییر یافته</div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function DiffLine({ label, old, new: newValue }: { label: string; old: string; new: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}:</div>
      <div className="bg-red-50 border border-red-200 rounded p-2 text-sm">
        <span className="text-red-600 text-xs">- </span>{old}
      </div>
      <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
        <span className="text-green-600 text-xs">+ </span>{newValue}
      </div>
    </div>
  );
}





