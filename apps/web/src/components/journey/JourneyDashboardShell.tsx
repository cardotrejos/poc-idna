"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { ProgressRing } from "@/components/journey/ProgressRing";
import { JourneyTracker, type JourneyStep } from "@/components/journey/JourneyTracker";
import { CtaCard } from "@/components/journey/CtaCard";
import { ClipboardList, FileUp, NotebookPen, Gauge } from "lucide-react";
import type { Route } from "next";

export function JourneyDashboardShell() {
  const { data, isLoading } = useQuery(orpc.progress.getMy.queryOptions());

  const steps: JourneyStep[] = data
    ? [
        { key: "profile", label: "Complete Profile", status: data.steps.profile },
        { key: "assessments", label: "Assessments", status: data.steps.assessments },
        { key: "documents", label: "Upload Documents", status: data.steps.documents },
        { key: "stories", label: "Life Stories", status: data.steps.stories },
        { key: "idna", label: "iDNA Dashboard", status: data.steps.idna },
      ]
    : [
        { key: "profile", label: "Complete Profile", status: "current" },
        { key: "assessments", label: "Assessments", status: "todo" },
        { key: "documents", label: "Upload Documents", status: "todo" },
        { key: "stories", label: "Life Stories", status: "todo" },
        { key: "idna", label: "iDNA Dashboard", status: "todo" },
      ];

  const completion = data?.percentComplete ?? 0;

  const assessmentsDesc = data
    ? data.requiredTypes > 0
      ? `${data.requiredApproved} of ${data.requiredTypes} required approved`
      : `${data.approvedAssessments} approved, ${data.uploadedAssessments} uploaded`
    : "Finish the remaining items to unlock insights.";

  const documentsDesc = data
    ? data.uploadedDocuments > 0
      ? `${data.uploadedDocuments} document${data.uploadedDocuments === 1 ? "" : "s"} uploaded`
      : "Add certificates or references to strengthen your profile."
    : "Add certificates or references to strengthen your profile.";

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[auto,1fr] items-center" aria-label="Progress overview">
        <div className="justify-self-center">
          <ProgressRing value={completion} label="Overall completion" />
        </div>
        <div>
          <JourneyTracker steps={steps} />
        </div>
      </section>

      <section aria-label="Quick actions" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CtaCard
          icon={ClipboardList}
          title="Continue Assessments"
          description={assessmentsDesc}
          href="/dashboard/assessments"
          actionLabel="Open"
        />
        <CtaCard
          icon={FileUp}
          title="Upload Documents"
          description={documentsDesc}
          href="/dashboard/documents"
          actionLabel="Upload"
        />
        <CtaCard
          icon={NotebookPen}
          title="Write Your Story"
          description="Reflect on key moments. Drafts autosave as you write."
          href={"/stories" as Route}
          actionLabel="Start"
        />
        <CtaCard
          icon={Gauge}
          title="Preview iDNA"
          description="See your strengths and next steps — coming soon."
          actionLabel="Preview"
          disabled
        />
      </section>
    </>
  );
}
