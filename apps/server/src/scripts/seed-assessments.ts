import "dotenv/config";
import { db, eq } from "@idna/db";
import { assessmentTypes } from "@idna/db/schema/assessments";

type SeedType = {
  slug: string;
  name: string;
  required?: boolean;
  providerUrl?: string;
  instructions?: string;
};

const seeds: SeedType[] = [
  {
    slug: "16personalities",
    name: "16Personalities (MBTI)",
    required: true,
    providerUrl: "https://www.16personalities.com/free-personality-test",
    instructions:
      "Open the test, answer all questions honestly, then download or screenshot the result page showing your type (e.g., INTJ-A) and summary.",
  },
  {
    slug: "riasec",
    name: "RIASEC (Holland Code)",
    required: true,
    providerUrl: "https://openpsychometrics.org/tests/RIASEC/",
    instructions:
      "Take a Holland Code (RIASEC) test. Upload a screenshot/PDF that clearly shows your three-letter code (e.g., RIA).",
  },
  {
    slug: "keirsey",
    name: "Keirsey Temperament Sorter",
    required: false,
    providerUrl: "https://www.keirsey.com/sorter/register.aspx",
    instructions:
      "Complete the Keirsey Temperament Sorter and upload the result page showing your temperament (e.g., Artisan, Guardian, Idealist, Rational).",
  },
  {
    slug: "strengthsprofile",
    name: "StrengthsProfile",
    required: false,
    providerUrl: "https://www.strengthsprofile.com/",
    instructions:
      "Complete the StrengthsProfile assessment. Upload the PDF or a screenshot of your Top Strengths summary.",
  },
  {
    slug: "hexaco",
    name: "HEXACO-PI-R",
    required: false,
    providerUrl: "https://hexaco.org/hexaco-online",
    instructions:
      "Complete the HEXACO personality inventory. Upload a file that shows the six factor scores (Honesty-Humility, Emotionality, eXtraversion, Agreeableness, Conscientiousness, Openness).",
  },
];

async function upsertType(s: SeedType) {
  const [existing] = await db
    .select({ id: assessmentTypes.id, slug: assessmentTypes.slug })
    .from(assessmentTypes)
    .where(eq(assessmentTypes.slug, s.slug))
    .limit(1);

  const fieldsJson: any = {};
  if (s.instructions) fieldsJson.instructions = s.instructions;

  if (existing) {
    await db
      .update(assessmentTypes)
      .set({
        name: s.name,
        required: s.required ? 1 : 0,
        providerUrl: s.providerUrl ?? null,
        fieldsJson,
      })
      .where(eq(assessmentTypes.id, existing.id));
    console.log(`Updated assessment type: ${s.slug}`);
  } else {
    await db.insert(assessmentTypes).values({
      slug: s.slug,
      name: s.name,
      required: s.required ? 1 : 0,
      providerUrl: s.providerUrl ?? null,
      fieldsJson,
    });
    console.log(`Inserted assessment type: ${s.slug}`);
  }
}

async function main() {
  for (const s of seeds) {
    await upsertType(s);
  }
}

main()
  .then(() => {
    console.log("Assessment types seeded");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

