"use client";

import { orpc, client, queryClient } from "@/utils/orpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

export default function AdminAssessmentsPage() {
  const [status, setStatus] = useState<string>("needs_review");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-assessments", { status, q, page }],
    queryFn: () => client.adminAssessments.listUploads({ status: status as any, q, page, pageSize: 20 }),
  });

  const reanalyzeMut = useMutation({
    mutationFn: async (uploadId: number) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/assessments/${uploadId}/analyze`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      return res.json() as Promise<{ confidencePct: number; provider: string; model?: string }>;
    },
    onSuccess: async () => {
      await refetch();
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Assessment Review Queue</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetch();
        }}
        className="flex items-end gap-4"
        aria-label="Filters"
      >
        <div className="flex flex-col">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="needs_review">Needs review</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Name or email"
          />
        </div>
        <button type="submit" className="border rounded px-3 py-2">
          Apply
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm" role="table">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Upload ID</th>
              <th className="py-2 pr-4">Student</th>
              <th className="py-2 pr-4">Assessment</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Confidence</th>
              <th className="py-2 pr-4">Submitted</th>
              <th className="py-2 pr-4">Last AI</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-4" colSpan={7}>
                  Loading...
                </td>
              </tr>
            )}
            {data?.items?.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2 pr-4">{row.id}</td>
                <td className="py-2 pr-4">
                  {row.studentName} <span className="text-gray-500">({row.studentEmail})</span>
                </td>
                <td className="py-2 pr-4">{row.typeName || row.typeSlug}</td>
                <td className="py-2 pr-4">{row.status}</td>
                <td className="py-2 pr-4">{row.confidencePct}%</td>
                <td className="py-2 pr-4">{new Date(row.submittedAt as any).toLocaleString()}</td>
                <td className="py-2 pr-4 text-xs text-gray-700">
                  {row.lastCall ? (
                    <span title={new Date(row.lastCall.createdAt as any).toLocaleString()}>
                      {row.lastCall.provider} · {row.lastCall.model}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/assessments/${row.id}`} className="underline">
                    Review
                  </Link>
                  <span className="mx-2">•</span>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => reanalyzeMut.mutate(row.id)}
                    disabled={reanalyzeMut.isPending}
                    aria-label={`Re-analyze upload ${row.id}`}
                    title="Re-run AI analysis"
                  >
                    {reanalyzeMut.isPending ? "Re-analyzing…" : "Re-analyze"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="border rounded px-3 py-1"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span className="px-2 py-1" aria-live="polite">
          Page {page}
        </span>
        <button
          type="button"
          className="border rounded px-3 py-1"
          onClick={() => setPage((p) => p + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
