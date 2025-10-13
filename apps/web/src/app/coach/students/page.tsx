"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import Link from "next/link";

export default function CoachStudentsPage() {
  const studentsQ = useQuery(orpc.coachStudents.listAssigned.queryOptions());
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Students</h1>
      {studentsQ.isLoading ? (
        <div>Loading…</div>
      ) : (studentsQ.data?.length ?? 0) === 0 ? (
        <div className="text-gray-600">No assigned students.</div>
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
              {(studentsQ.data ?? []).map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2 pr-4">{s.name}</td>
                  <td className="py-2 pr-4">{s.email}</td>
                  <td className="py-2 pr-4">
                    <Link className="underline" href={`/coach/students/${s.id}/documents`}>Documents</Link>
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

