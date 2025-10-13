"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";
import Link from "next/link";
import { useState } from "react";

export default function AdminStudentsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const studentsQ = useQuery({
    queryKey: ["admin-students", q, page],
    queryFn: () => client.adminStudents.list({ q, page, pageSize: 25 }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Students</h1>

      <form
        className="flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          qc.invalidateQueries({ queryKey: ["admin-students"] });
        }}
      >
        <div className="flex flex-col">
          <label htmlFor="q" className="text-sm font-medium">Search</label>
          <input id="q" value={q} onChange={(e) => setQ(e.target.value)} className="border rounded px-2 py-1" placeholder="Name or email" />
        </div>
        <button type="submit" className="border rounded px-3 py-2">Apply</button>
      </form>

      {studentsQ.isLoading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(studentsQ.data?.items ?? []).map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2 pr-4">{s.name}</td>
                  <td className="py-2 pr-4">{s.email}</td>
                  <td className="py-2 pr-4">
                    <Link className="underline" href={`/admin/students/${s.id}/documents`}>
                      Documents
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" className="border rounded px-3 py-1" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span className="px-2 py-1">Page {page}</span>
        <button type="button" className="border rounded px-3 py-1" onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
