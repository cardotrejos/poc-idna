"use client";

import Link from "next/link";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { toast } from "sonner";

function statusFromUploads(uploads: Array<{ typeSlug: string; status: string }>, slug: string) {
  const items = uploads.filter((u) => u.typeSlug === slug);
  if (items.find((i) => i.status === "approved")) return "Approved";
  if (items.find((i) => i.status === "needs_review")) return "Needs review";
  if (items.length > 0) return "Submitted";
  return "Not started";
}

export default function AssessmentsPage() {
  const typesQ = useQuery(orpc.assessments.listTypes.queryOptions());
  const myUploadsQ = useQuery(orpc.studentAssessments.listMyUploads.queryOptions());
  async function handleView(uploadId: number) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/assessments/${uploadId}/url`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      const { url } = await res.json();
      if (url) window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message || "Unable to open file");
    }
  }

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="text-2xl font-semibold">Assessments</h1>
        <p className="text-gray-600">Complete the assessments below on their external sites, then upload a screenshot or PDF of your result.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {typesQ.data?.map((t) => {
          const status = statusFromUploads(myUploadsQ.data ?? [], t.slug);
          return (
            <section key={t.slug} className="border rounded p-4" aria-labelledby={`ass-${t.slug}`}>
              <div className="flex items-center justify-between">
                <h2 id={`ass-${t.slug}`} className="text-lg font-semibold">{t.name}</h2>
                <span className="text-xs px-2 py-1 border rounded" aria-label="status">{status}</span>
              </div>
              {t.required && <div className="text-xs text-red-700 mt-1">Required</div>}
              {t.providerUrl && (
                <div className="mt-2">
                  <Link href={t.providerUrl} target="_blank" rel="noopener" className="underline">
                    Open assessment site
                  </Link>
                </div>
              )}
              <div className="mt-3">
                <details>
                  <summary className="cursor-pointer select-none">How to complete</summary>
                  {t.instructions ? (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{t.instructions}</p>
                  ) : (
                    <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                      <li>Click “Open assessment site” and complete the test.</li>
                      <li>Take a clear screenshot of your results (or download the PDF).</li>
                      <li>Ensure your name and the overall score/type are visible.</li>
                      <li>Upload the screenshot/PDF using the control below.</li>
                    </ul>
                  )}
                </details>
              </div>
              <div className="mt-3">
                <UploadDropzone
                  typeSlug={t.slug}
                  onUploaded={() => {
                    myUploadsQ.refetch();
                  }}
                />
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-medium">Your uploads</h3>
                <ul className="mt-2 space-y-1">
                  {(myUploadsQ.data?.filter((u) => u.typeSlug === t.slug) || []).slice(0, 5).map((u) => (
                    <li key={u.id} className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2">#{u.id} — {new Date(u.submittedAt as any).toLocaleString()}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 border rounded ${
                            u.status === "approved"
                              ? "border-green-600 text-green-700"
                              : u.status === "needs_review"
                              ? "border-amber-600 text-amber-700"
                              : u.status === "rejected"
                              ? "border-red-600 text-red-700"
                              : "border-gray-500 text-gray-600"
                          }`}
                          aria-label={`status ${u.status}`}
                        >
                          {u.status}
                        </span>
                        <button
                          type="button"
                          className="underline"
                          onClick={() => handleView(u.id)}
                          aria-label={`View upload ${u.id}`}
                        >
                          View
                        </button>
                      </span>
                    </li>
                  ))}
                  {((myUploadsQ.data?.filter((u) => u.typeSlug === t.slug) || []).length === 0) && (
                    <li className="text-sm text-gray-600">No uploads yet.</li>
                  )}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
