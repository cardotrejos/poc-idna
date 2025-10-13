"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc, queryClient } from "@/utils/orpc";
import { DocumentUploader } from "@/components/upload/DocumentUploader";
import { toast } from "sonner";

export default function DocumentsPage() {
  const docsQ = useQuery(orpc.documents.listMy.queryOptions());

  async function handleView(id: number) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/documents/${id}/url`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      const { url } = await res.json();
      if (url) window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message || "Unable to open file");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(`Delete document #${id}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      docsQ.refetch();
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">My Documents</h1>
        <p className="text-gray-600">Upload certificates, references, and other documents.</p>
      </header>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Upload Documents</h2>
        <DocumentUploader onUploaded={() => { docsQ.refetch(); queryClient.invalidateQueries({ queryKey: orpc.progress.getMy.queryKey() }); }} />
      </div>

      <section>
        <h2 className="font-semibold mb-2">Uploaded</h2>
        {docsQ.isLoading ? (
          <div>Loading…</div>
        ) : (docsQ.data?.length ?? 0) === 0 ? (
          <div className="text-gray-600">No documents uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Filename</th>
                  <th className="py-2 pr-4">Uploaded</th>
                  <th className="py-2 pr-4">Status</th>
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
                    <td className="py-2 pr-4">uploaded</td>
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
      </section>
    </div>
  );
}
