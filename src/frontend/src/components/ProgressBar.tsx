import { Progress } from "@/components/ui/progress";
import React from "react";

interface ProgressBarProps {
  position: number;
  total: number;
}

export default function ProgressBar({ position, total }: ProgressBarProps) {
  const percent =
    total > 0 ? Math.min(100, Math.round((position / total) * 100)) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-border/50 bg-card/80 backdrop-blur-sm font-sans">
      <Progress value={percent} className="flex-1 h-1.5" />
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
        {percent}%
      </span>
    </div>
  );
}
