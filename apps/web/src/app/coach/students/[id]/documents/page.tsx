"use client";

import { useQuery } from "@tanstack/react-query";
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
                  <td className="py-2 pr-4 flex gap-3">
                    <button className="underline" onClick={() => handleView(d.id)} aria-label={`View document ${d.id}`}>
                      View
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
