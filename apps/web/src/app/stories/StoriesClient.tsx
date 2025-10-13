"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client, queryClient, orpc } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PROMPTS = [
  { key: "challenge", label: "A challenge you overcame" },
  { key: "achievement", label: "A proud achievement" },
  { key: "teamwork", label: "A time you helped a team" },
  { key: "learning", label: "A moment you learned something important" },
];

export default function StoriesClient() {
  const [promptKey, setPromptKey] = useState(PROMPTS[0]!.key);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastTextRef = useRef("");

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Changing prompt creates a new draft thread
  useEffect(() => {
    setDraftId(null);
    lastTextRef.current = "";
  }, [promptKey]);

  const listQ = useQuery({
    queryKey: ["stories", "list", 1],
    queryFn: () => client.stories.list({ page: 1, pageSize: 20 }),
  });

  async function saveNow(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (draftId) {
        await client.stories.update({ id: draftId, contentRichtext: trimmed, isDraft: true });
      } else {
        const res = await client.stories.create({ promptKey, contentRichtext: trimmed, isDraft: true });
        setDraftId(res.id);
        // First save affects progress; update dashboard metrics
        queryClient.invalidateQueries({ queryKey: orpc.progress.getMy.queryKey() });
      }
      lastTextRef.current = trimmed;
      // Only refetch list on first create or occasionally; here we refetch once at first create
      if (!listQ.data?.items.length) await listQ.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Autosave failed");
    } finally {
      setSaving(false);
    }
  }

  function scheduleAutosave(nextText: string) {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // Avoid autosaving if nothing changed meaningfully
    if (nextText.trim() === lastTextRef.current) return;
    timerRef.current = window.setTimeout(() => {
      void saveNow(nextText);
    }, 800);
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    try {
      await client.stories.remove({ id });
      await Promise.all([
        listQ.refetch(),
        queryClient.invalidateQueries({ queryKey: orpc.progress.getMy.queryKey() }),
      ]);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-label="Write a story">
        <div className="flex items-center gap-2">
          <label htmlFor="story-prompt" className="text-sm font-medium">Prompt</label>
          <select
            id="story-prompt"
            value={promptKey}
            onChange={(e) => setPromptKey(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {PROMPTS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="story-content" className="text-sm font-medium">Your story</label>
          <textarea
            id="story-content"
            value={content}
            onChange={(e) => {
              const v = e.target.value;
              setContent(v);
              scheduleAutosave(v);
            }}
            rows={6}
            className="w-full border rounded p-2"
            placeholder="Write at least a few sentences…"
          />
        </div>
        <div>
          <Button onClick={() => saveNow(content)} disabled={!content.trim() || saving} aria-disabled={!content.trim() || saving}>
            {saving ? "Saving…" : draftId ? "Save now" : "Create draft"}
          </Button>
          {draftId ? (
            <span className="ml-2 text-xs text-muted-foreground">Autosaves after you stop typing</span>
          ) : null}
        </div>
      </section>

      <section aria-label="Your stories" className="space-y-2">
        <h2 className="text-lg font-semibold">Your stories</h2>
        {listQ.isLoading ? (
          <div>Loading…</div>
        ) : (listQ.data?.items.length ?? 0) === 0 ? (
          <div className="text-muted-foreground">No stories yet.</div>
        ) : (
          <ul className="space-y-3">
            {listQ.data!.items.map((s) => (
              <li key={s.id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{PROMPTS.find((p) => p.key === s.promptKey)?.label ?? s.promptKey}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.updatedAt as any).toLocaleString()}</div>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap line-clamp-4">{s.contentRichtext}</p>
                <div className="mt-2 text-xs text-muted-foreground">{s.wordCount} words {s.isDraft ? "· Draft" : null}</div>
                <div className="mt-2">
                  <button className="underline text-red-700" onClick={() => onDelete(s.id)} aria-label={`Delete story ${s.id}`}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
