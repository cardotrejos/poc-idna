"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
  const [fileName, setFileName] = useState<string>("");

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

  const upload = useCallback(
    async (f: File) => {
      if (!validate(f)) return;
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", f);
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
        toast.success("Upload submitted");
        onUploaded();
      } catch (e: any) {
        toast.error(e?.message || "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [typeSlug, onUploaded],
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    upload(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFileName(f.name);
      upload(f);
    }
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
        <p>Drag and drop file here, or click to select.</p>
        <p className="text-xs text-gray-600">JPG, PNG, PDF up to 10MB</p>
        {fileName && <p className="mt-2 text-sm">Selected: {fileName}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={onInput}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

