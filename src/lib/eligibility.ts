import { libraryCategories, scholarshipResources, streamLibraryMap } from "@/lib/content/data";

/*
 * First-pass scholarship checker, ported from the prototype (getScholarshipEligibilityMatches).
 * Runs only in the browser: the answers are never sent to the server or stored.
 */

export type Eligibility = {
  gender: "any" | "female" | "male";
  state: "any" | "tn";
  community: "general" | "scst" | "obc" | "minority" | "ebc-dnt";
  income: "unknown" | "upto2_5" | "upto4" | "upto4_5" | "upto5" | "upto6" | "upto8" | "above8";
  school: "any" | "tn-govt-6-12" | "tn-aided-tamil-6-12";
  courseLevel: "any" | "school" | "ug" | "diploma-iti" | "professional" | "pg";
  disability: boolean;
  orphan: boolean;
  firstGraduate: boolean;
  loan: boolean;
};

export const DEFAULT_ELIGIBILITY: Eligibility = {
  gender: "any",
  state: "any",
  community: "general",
  income: "unknown",
  school: "any",
  courseLevel: "any",
  disability: false,
  orphan: false,
  firstGraduate: false,
  loan: false,
};

const INCOME: Record<Eligibility["income"], number | null> = {
  unknown: null,
  upto2_5: 2.5,
  upto4: 4,
  upto4_5: 4.5,
  upto5: 5,
  upto6: 6,
  upto8: 8,
  above8: 99,
};

const TECHNICAL = ["engineering", "computer-science-it", "architecture", "science", "mathematics-statistics"];
const PROFESSIONAL = new Set(["engineering", "computer-science-it", "architecture", "medical-science", "allied-medicine", "law", "management"]);

const OFFICIAL = new Set([
  "vidya-lakshmi-loan", "national-scholarship-portal", "myscheme-gateway", "jansamarth", "aicte-tuition-waiver",
  "first-graduate-tn", "pudhumai-penn", "tamil-pudhalvan", "tn-bc-mbc-dnc-post-matric", "tn-sc-st-post-matric",
  "aicte-pragati-saksham-swanath", "central-disability-scholarships", "central-community-scholarships",
  "central-sector-college", "worker-wards-post-matric", "tahdco",
]);
const PROVIDER = new Set([
  "foundation-ngo-scholarships", "ffe-stem-scholarships", "hdfc-parivartan-ecss", "kotak-kanya", "legrand-empowering", "rolls-royce-unnati",
]);
const TRACKER = new Set(["buddy4study", "company-scholarships", "bank-scholarships"]);

export function trustLabel(id: string) {
  if (OFFICIAL.has(id)) return { label: "Official source", tone: "official" as const };
  if (PROVIDER.has(id)) return { label: "Verified provider", tone: "provider" as const };
  if (TRACKER.has(id)) return { label: "Discovery site, check the provider", tone: "tracker" as const };
  return { label: "Check this source carefully", tone: "caution" as const };
}

export type Scholarship = (typeof scholarshipResources)[number];

export function scholarshipById(id: string) {
  return scholarshipResources.find((s) => s.id === id) ?? null;
}

/** streamIds: the student's top matches (Level 1 stream ids). */
export function eligibleScholarships(e: Eligibility, streamIds: string[]): Scholarship[] {
  const cats = new Set(
    streamIds.map((s) => (streamLibraryMap as Record<string, string>)[s]).filter(Boolean),
  );
  const income = INCOME[e.income];
  const mayQualify = (max: number) => income === null || income <= max;
  const technical = [...cats].some((c) => TECHNICAL.includes(c));
  const professional = e.courseLevel === "professional" || [...cats].some((c) => PROFESSIONAL.has(c));
  const higherEd = ["any", "ug", "diploma-iti", "professional", "pg"].includes(e.courseLevel);
  const tnGovtSchool = ["tn-govt-6-12", "tn-aided-tamil-6-12"].includes(e.school) || e.school === "any";

  const ids = new Set(["national-scholarship-portal", "myscheme-gateway", "buddy4study"]);
  const add = (...xs: string[]) => xs.forEach((x) => ids.add(x));
  if (e.loan || professional) add("vidya-lakshmi-loan", "jansamarth");
  if (e.state === "tn" && e.firstGraduate) add("first-graduate-tn");
  if (e.state === "tn" && e.gender === "female" && higherEd && tnGovtSchool) add("pudhumai-penn");
  if (e.state === "tn" && e.gender === "male" && higherEd && tnGovtSchool) add("tamil-pudhalvan");
  if (e.state === "tn" && e.community === "scst") add("tahdco", "tn-sc-st-post-matric");
  if (e.state === "tn" && ["obc", "ebc-dnt"].includes(e.community) && mayQualify(2.5)) add("tn-bc-mbc-dnc-post-matric");
  if (e.gender === "female") add("aicte-pragati-saksham-swanath", "bank-scholarships", "company-scholarships");
  if (e.disability) add("central-disability-scholarships", "aicte-pragati-saksham-swanath");
  if (e.orphan) add("aicte-pragati-saksham-swanath", "legrand-empowering");
  if (["scst", "obc", "minority", "ebc-dnt"].includes(e.community)) add("central-community-scholarships");
  if (mayQualify(4.5)) add("central-sector-college");
  if (technical && mayQualify(8)) add("aicte-tuition-waiver");
  if (technical) add("aicte-pragati-saksham-swanath", "company-scholarships");
  if (professional && mayQualify(4)) add("ffe-stem-scholarships");
  if (e.gender === "female" && professional && mayQualify(6)) add("kotak-kanya");
  if ((e.gender === "female" || e.disability || e.orphan) && professional && mayQualify(5)) add("legrand-empowering");
  if (e.gender === "female" && technical) add("rolls-royce-unnati");
  if (e.courseLevel === "school" || mayQualify(8)) add("hdfc-parivartan-ecss");

  for (const c of cats) {
    if (!libraryCategories.some((l) => l.id === c)) continue;
    for (const r of scholarshipResources) {
      if (r.relatedCategories.includes(c) && !r.relatedCategories.includes("all")) ids.add(r.id);
    }
  }
  return scholarshipResources.filter((r) => ids.has(r.id)).slice(0, 16);
}
