"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

interface OfficerCardSkeletonProps {
  className?: string;
}

export function OfficerCardSkeleton({ className }: OfficerCardSkeletonProps) {
  return (
    <Card className={cn("relative overflow-hidden border-border bg-card", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Image Skeleton */}
          <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />

          {/* Name Skeleton */}
          <Skeleton className="h-6 w-32 flex-shrink-0" />

          {/* Position Skeleton */}
          <Skeleton className="h-4 w-24 flex-shrink-0" />

          {/* Social Links Skeleton */}
          <div className="flex items-center gap-2 pt-2 flex-shrink-0">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
