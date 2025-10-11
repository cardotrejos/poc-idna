"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { AssessmentList } from "@/components/assessments/AssessmentList";

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const privateData = useQuery(orpc.privateData.queryOptions());

	return (
		<>
			<p>API: {privateData.data?.message}</p>
			<section className="mt-4" aria-label="Assessment results">
				<h2 className="text-xl font-semibold mb-2">Assessment Results</h2>
				<AssessmentList />
			</section>
		</>
	);
}
