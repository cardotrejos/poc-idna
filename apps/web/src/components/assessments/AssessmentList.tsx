"use client";

import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";

export function AssessmentList() {
  const { data, isLoading } = useQuery(orpc.studentAssessments.listApproved.queryOptions());

  if (isLoading) return <div>Loading assessments…</div>;
  if (!data || data.length === 0) return <div>No approved assessments yet.</div>;

  return (
    <div className="grid gap-3">
      {data.map((item: any) => (
        <article key={item.uploadId} className="border rounded p-3" aria-labelledby={`ass-${item.uploadId}`}>
          <div className="flex items-center justify-between">
            <h3 id={`ass-${item.uploadId}`} className="font-semibold">
              {item.typeName || item.typeSlug}
            </h3>
            <span className="text-xs px-2 py-1 border rounded" aria-label="confidence">
              {item.confidencePct}%
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Last updated: {new Date((item.reviewedAt ?? item.submittedAt) as any).toLocaleString()}
          </div>
          <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(item.results ?? {}, null, 2)}
          </pre>
        </article>
      ))}
    </div>
  );
}
