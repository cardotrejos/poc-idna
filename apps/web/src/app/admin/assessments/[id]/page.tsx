"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client, orpc, queryClient } from "@/utils/orpc";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function AdminAssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    return <div className="p-4">Invalid id.</div>;
  }

  // Fetch upload detail via TanStack Query (no useEffect)
  const detailQ = useQuery(orpc.adminAssessments.getUpload.queryOptions({ id }));

  // Fetch signed preview URL via fetch + Query (credentials from the browser)
  const previewQ = useQuery({
    queryKey: ["admin-assessment-preview", id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/assessments/${id}/url`, {
        credentials: "include",
      });
      if (!res.ok) return { url: "" } as { url: string };
      return res.json() as Promise<{ url: string; expiresIn: number; mime: string }>
    },
  });

  if (detailQ.isLoading) return <div className="p-4">Loading…</div>;
  if (detailQ.isError) return <div className="p-4">Failed to load.</div>;

  const detail = detailQ.data!;
  const initialJson = JSON.stringify(detail.result?.resultsJson ?? {}, null, 2);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Review Upload #{id}</h1>
      <div className="text-sm text-gray-600">
        <div>
          <strong>Student:</strong> {detail.upload.studentName} ({detail.upload.studentEmail})
        </div>
        <div>
          <strong>Assessment:</strong> {detail.upload.typeName || detail.upload.typeSlug}
        </div>
        <div>
          <strong>Status:</strong> {detail.upload.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section aria-label="Document preview" className="border rounded">
          {previewQ.data?.url ? (
            <iframe
              title="Assessment document preview"
              src={previewQ.data.url}
              className="w-full h-[480px]"
            />
          ) : (
            <div className="p-4">No preview available</div>
          )}
        </section>

        <Editor
          key={id}
          id={id}
          initialJson={initialJson}
          onAfterChange={() => {
            // Refresh the detail after save/status update
            queryClient.invalidateQueries({ queryKey: orpc.adminAssessments.getUpload.queryKey({ id }) });
          }}
        />
      </div>
    </div>
  );
}

function Editor({
  id,
  initialJson,
  onAfterChange,
}: {
  id: number;
  initialJson: string;
  onAfterChange?: () => void;
}) {
  const [jsonText, setJsonText] = useState<string>(initialJson);
  const [saving, setSaving] = useState(false);

  const parsedOk = useMemo(() => {
    try {
      JSON.parse(jsonText);
      return true;
    } catch {
      return false;
    }
  }, [jsonText]);

  async function saveEdits() {
    if (!parsedOk) return;
    setSaving(true);
    try {
      const resultsJson = JSON.parse(jsonText);
      await client.adminAssessments.updateResult({ id, resultsJson, confidencePct: 100 });
      toast.success("Saved");
      onAfterChange?.();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: "approved" | "rejected" | "needs_review") {
    try {
      await client.adminAssessments.setStatus({ id, status });
      toast.success(status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Updated");
      onAfterChange?.();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  }

  return (
    <section aria-label="Extracted JSON" className="border rounded p-2">
      <label htmlFor="json" className="text-sm font-medium">Extracted result (editable JSON)</label>
      <textarea
        id="json"
        name="json"
        className="mt-2 w-full h-[430px] font-mono text-xs border rounded p-2"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        aria-invalid={!parsedOk}
      />
      {!parsedOk && (
        <div className="text-red-600 text-sm mt-1" role="alert">Invalid JSON</div>
      )}
      <div className="flex gap-2 mt-2">
        <button type="button" className="border rounded px-3 py-2" onClick={saveEdits} disabled={!parsedOk || saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="border rounded px-3 py-2" onClick={() => setStatus("approved")}>
          Approve
        </button>
        <button type="button" className="border rounded px-3 py-2" onClick={() => setStatus("rejected")}>
          Reject
        </button>
      </div>
    </section>
  );
}
