"use client";

import { ConnectionStatus } from "@/components/ui/connection-status";

export function StatusIndicator() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <ConnectionStatus showDetails={false} />
    </div>
  );
}



