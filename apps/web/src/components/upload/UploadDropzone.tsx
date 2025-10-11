"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED = ["image/png", "image/jpeg", "application/pdf"] as const;

export function UploadDropzone({
  typeSlug,
  onUploaded,
}: {
  typeSlug: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  type Selected = { file: File; previewUrl: string };
  const [selected, setSelected] = useState<Selected[]>([]);

  const acceptAttr = useMemo(() => ACCEPTED.join(","), []);

  const validate = (f: File) => {
    if (!ACCEPTED.includes(f.type as any)) {
      toast.error("Invalid file type. Use JPG/PNG/PDF.");
      return false;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File too large (max 10MB)");
      return false;
    }
    return true;
  };

  const upload = useCallback(async () => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      // Upload files sequentially to keep server load predictable
      for (const item of selected) {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("typeSlug", typeSlug);
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/assessments`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || res.statusText);
        }
      }
      toast.success(`Uploaded ${selected.length} file(s)`);
      // cleanup
      selected.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
      setSelected([]);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }, [selected, typeSlug, onUploaded]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const next: Selected[] = [];
    for (const f of arr) {
      if (!validate(f)) continue;
      let url = "";
      if (f.type.startsWith("image/") || f.type === "application/pdf") {
        url = URL.createObjectURL(f);
      }
      next.push({ file: f, previewUrl: url });
    }
    setSelected((prev) => [...prev, ...next]);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    addFiles(e.target.files);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const fl = e.dataTransfer.files;
    if (fl?.length) addFiles(fl);
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-label="Upload assessment screenshot (JPG, PNG or PDF)"
        className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${
          dragOver ? "bg-blue-50" : ""
        } ${busy ? "opacity-60" : ""}`}
      >
        <p>Drag and drop file(s) here, or click to select.</p>
        <p className="text-xs text-gray-600">JPG, PNG, PDF up to 10MB each</p>
        {selected.length > 0 && (
          <p className="mt-2 text-sm">Selected: {selected.length} file(s)</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        multiple
        onChange={onInput}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {selected.length > 0 && (
        <div className="mt-3 space-y-2" aria-live="polite">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selected.map((s, idx) => (
              <div key={idx} className="border rounded p-1">
                {s.previewUrl && s.file.type.startsWith("image/") ? (
                  <Image
                    src={s.previewUrl}
                    alt={`Preview ${s.file.name}`}
                    width={240}
                    height={180}
                    className="w-full h-auto rounded"
                    unoptimized
                  />
                ) : s.previewUrl && s.file.type === "application/pdf" ? (
                  <iframe title={`Preview ${s.file.name}`} src={s.previewUrl} className="w-full h-32 border rounded" />
                ) : (
                  <div className="text-xs p-2">{s.file.name}</div>
                )}
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="truncate" title={s.file.name}>{s.file.name}</span>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
                      setSelected((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    disabled={busy}
                    aria-label={`Remove ${s.file.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="border rounded px-3 py-2" onClick={upload} disabled={busy}>
              {busy ? `Uploading ${selected.length}…` : `Upload ${selected.length} file(s)`}
            </button>
            <button
              type="button"
              className="border rounded px-3 py-2"
              onClick={() => {
                selected.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
                setSelected([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={busy}
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
