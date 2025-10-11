import { publicProcedure } from "../index";
import { db } from "@idna/db";
import { assessmentTypes } from "@idna/db/schema/assessments";

export const assessmentsRouter = {
  listTypes: publicProcedure.handler(async () => {
    const rows = await db.select().from(assessmentTypes);
    return rows.map((r: any) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      required: Boolean(r.required),
      providerUrl: r.providerUrl as string | null,
      instructions: r.fieldsJson?.instructions ?? null,
    }));
  }),
};
