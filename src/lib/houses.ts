import type { HouseId } from "@/lib/auth";

export type House = {
  id: HouseId;
  name: string;
  numeral: string;
  crest: string;
  trait: string;
  /** CSS colour used for fills */
  color: string;
  /** text colour that passes AA on `color` */
  onColor: string;
};

export const HOUSES: House[] = [
  { id: "varunaa", name: "Varunaa", numeral: "House I", crest: "/houses/varunaa.png", trait: "Wisdom, depth and reflection", color: "var(--color-varunaa)", onColor: "#ffffff" },
  { id: "vaaranam", name: "Vaaranam", numeral: "House II", crest: "/houses/vaaranam.png", trait: "Strength, patience and service", color: "var(--color-vaaranam)", onColor: "#ffffff" },
  { id: "veera", name: "Veera", numeral: "House III", crest: "/houses/veera.png", trait: "Courage, action and leadership", color: "var(--color-veera)", onColor: "#ffffff" },
  { id: "vimaana", name: "Vimaana", numeral: "House IV", crest: "/houses/vimaana.png", trait: "Vision, flight and ambition", color: "var(--color-vimaana)", onColor: "#1b1838" },
];

export const houseById = (id: string | null | undefined) => HOUSES.find((h) => h.id === id) ?? null;

export const LEVELS = [
  { level: 1, name: "Explorer", task: "Take the career assessment and see your matches." },
  { level: 2, name: "Researcher", task: "Research how jobs in your shortlisted courses will look in 2030." },
  { level: 3, name: "Connector", task: "Talk to a working professional and write up what you learned." },
  { level: 4, name: "Scholarship Scout", task: "Check which scholarships you may qualify for and shortlist them." },
  { level: 5, name: "Pathfinder", task: "Map the colleges and entrance exams for your chosen route." },
] as const;

export const POINTS_PER_LEVEL = 100;
