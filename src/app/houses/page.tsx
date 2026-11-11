import { getAllianceStandings } from "@/lib/standings";
import { HousesShowcase, ModelCredits } from "../_landing/houses-showcase";

export const metadata = { title: "About the houses" };

export default async function AboutTheHouses() {
  const standings = await getAllianceStandings();
  return (
    <div className="landing">
      <HousesShowcase standings={standings} />
      <ModelCredits className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted sm:px-6" />
    </div>
  );
}
