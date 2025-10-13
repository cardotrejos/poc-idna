"use client";

import { client } from "@/utils/orpc";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminAssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [detail, setDetail] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [jsonText, setJsonText] = useState<string>("{}");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    (async () => {
      const d = await client.adminAssessments.getUpload({ id });
      setDetail(d);
      setJsonText(JSON.stringify(d.result?.resultsJson ?? {}, null, 2));
    })();
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    (async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/assessments/${id}/url`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.url);
      }
    })();
  }, [id]);

  const parsedOk = useMemo(() => {
    try {
      JSON.parse(jsonText);
      return true;
    } catch {
      return false;
    }
  }, [jsonText]);

  async function saveEdits() {
    setSaving(true);
    try {
      const resultsJson = JSON.parse(jsonText);
      await client.adminAssessments.updateResult({ id, resultsJson, confidencePct: 100 });
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: "approved" | "rejected" | "needs_review") {
    await client.adminAssessments.setStatus({ id, status });
  }

  if (!detail) return <div className="p-4">Loading…</div>;

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
          {previewUrl ? (
            <iframe
              title="Assessment document preview"
              src={previewUrl}
              className="w-full h-[480px]"
            />
          ) : (
            <div className="p-4">No preview available</div>
          )}
        </section>

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
            <button type="button" className="border rounded px-3 py-2" onClick={() => setStatus("approved")}>Approve</button>
            <button type="button" className="border rounded px-3 py-2" onClick={() => setStatus("rejected")}>Reject</button>
          </div>
        </section>
      </div>
    </div>
  );
}
