"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { client } from "@/utils/orpc";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function CoachStudentDocumentsPage() {
  const params = useParams();
  const id = String(params.id);
  const docsQ = useQuery({
    queryKey: ["coach-student-docs", id],
    queryFn: () => client.documents.listForStudent({ studentUserId: id }),
  });

  const analyzeMut = useMutation({
    mutationFn: async ({ docId, task }: { docId: number; task: "auto" | "summary" | "kv" | "full" }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/documents/${docId}/analyze?task=${task}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      return res.json() as Promise<{
        provider: string; model: string; confidencePct: number; object: Record<string, unknown>;
      }>;
    },
  });

  async function handleView(docId: number) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/documents/${docId}/url`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      const { url } = await res.json();
      if (url) window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message || "Unable to open file");
    }
  }

  async function handleDelete(idNum: number) {
    if (!confirm(`Delete document #${idNum}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/documents/${idNum}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      await docsQ.refetch();
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  }

  async function handleAnalyze(docId: number) {
    try {
      toast.message("Analyzing…", { duration: 1200 });
      const r = await analyzeMut.mutateAsync({ docId, task: "full" });
      const header = `AI: ${r.provider} (${r.model}) • confidence ${Math.round(r.confidencePct)}%`;
      const pretty = JSON.stringify(r.object, null, 2).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
      const w = window.open("", "_blank", "noopener,width=800,height=600");
      if (w) {
        w.document.write(`<pre style=\"white-space:pre-wrap;word-wrap:break-word;padding:16px;margin:0;\">${header}\n\n${pretty}</pre>`);
        w.document.close();
      } else {
        toast.info(header);
        console.info("Analysis", r);
      }
    } catch (e: any) {
      toast.error(e?.message || "Analyze failed");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Student Documents</h1>
      {docsQ.isLoading ? (
        <div>Loading…</div>
      ) : (docsQ.data?.length ?? 0) === 0 ? (
        <div className="text-gray-600">No documents for this student.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Filename</th>
                <th className="py-2 pr-4">Uploaded</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {(docsQ.data ?? []).map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="py-2 pr-4">{d.id}</td>
                  <td className="py-2 pr-4">{d.category}</td>
                  <td className="py-2 pr-4">{d.filename}</td>
                  <td className="py-2 pr-4">{new Date(d.uploadedAt as any).toLocaleString()}</td>
                  <td className="py-2 pr-4 flex gap-3 items-center">
                    <button className="underline" onClick={() => handleView(d.id)} aria-label={`View document ${d.id}`}>
                      View
                    </button>
                    <button
                      className="underline"
                      onClick={() => handleAnalyze(d.id)}
                      aria-label={`Analyze document ${d.id}`}
                      disabled={analyzeMut.isPending}
                      title="Extract a structured summary from this document"
                    >
                      {analyzeMut.isPending ? "Analyzing…" : "Analyze"}
                    </button>
                    <button className="underline text-red-700" onClick={() => handleDelete(d.id)} aria-label={`Delete document ${d.id}`}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
