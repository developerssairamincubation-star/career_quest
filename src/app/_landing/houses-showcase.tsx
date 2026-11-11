import type { HouseId } from "@/lib/auth";
import { houseById } from "@/lib/houses";
import type { HouseStanding } from "@/lib/standings";
import { HouseCard, type Habitat } from "./house-card";
import { ClanStage } from "./clan-stage";
import "./landing.css";

// Crest order. Each house's island and what its animal is doing there.
const SCENES: { id: HouseId; habitat: Habitat }[] = [
  { id: "veera", habitat: { animal: "Tiger", action: "leaps onto", place: "its rock and roars" } },
  { id: "vaaranam", habitat: { animal: "Elephant", action: "patrols", place: "the forest and trumpets" } },
  { id: "varunaa", habitat: { animal: "Dolphins", action: "dive through", place: "the open sea" } },
  { id: "vimaana", habitat: { animal: "Eagle", action: "circles", place: "the high spire" } },
];

/** "The four houses": the scroll-driven island tour. Shared by the landing page and "About the houses". */
export function HousesShowcase({ standings }: { standings: HouseStanding[] | null }) {
  const leader = standings?.[0] ?? null;
  const totals = standings && {
    members: standings.reduce((s, h) => s + h.members, 0),
    points: standings.reduce((s, h) => s + h.points, 0),
  };
  const houses = SCENES.map((s) => ({ ...s, house: houseById(s.id)! }));

  return (
    <section id="houses" aria-labelledby="houses-title" className="relative">
      <div className="px-4 pb-6 pt-10 text-center sm:px-6">
        <h2 id="houses-title" className="font-crest text-4xl font-bold sm:text-5xl">The four houses</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          {totals
            ? `${totals.members.toLocaleString("en-IN")} students, ${totals.points.toLocaleString("en-IN")} points so far. Scroll to visit each house.`
            : "Every student belongs to a house. Scroll to visit each one."}
        </p>
      </div>
      <ClanStage
        houses={houses.map(({ id, habitat, house }) => ({
          id,
          name: house.name,
          crest: house.crest,
          color: house.color,
          onColor: house.onColor,
          rank: standings?.find((s) => s.house === id)?.rank,
          points: standings?.find((s) => s.house === id)?.points,
          members: standings?.find((s) => s.house === id)?.members,
          card: (
            <HouseCard
              house={house}
              habitat={habitat}
              standing={standings?.find((s) => s.house === id) ?? null}
              leader={leader}
            />
          ),
        }))}
      />
    </section>
  );
}

const CREDITS = [
  { what: "Tiger", title: "Tiger rebuilt", by: "kenchoo", href: "https://sketchfab.com/3d-models/tiger-rebuilt-6b5d14b2de984ffcb00ee00e404ad208" },
  { what: "Elephant", title: "African Elephant", by: "jimmyho905", href: "https://sketchfab.com/3d-models/african-elephant-b960467b14f34cfc84feeb3361a21f54" },
  { what: "Dolphins", title: "Killer Whale", by: "Abner Wu", href: "https://sketchfab.com/3d-models/killer-whale-63b680d7e58f463a9868ed7bf163094a" },
  { what: "Eagle", title: "Bald Eagle", by: "ucdavisterc", href: "https://sketchfab.com/3d-models/bald-eagle-8874cfcf83a54575ba8068376f8a63a8" },
];

/** CC BY credit for the Sketchfab animals; shown wherever the islands are. */
export function ModelCredits({ className }: { className?: string }) {
  return (
    <p className={className}>
      3D animals:{" "}
      {CREDITS.map((c, i) => (
        <span key={c.what}>
          {c.what}, <a href={c.href} className="underline">&ldquo;{c.title}&rdquo;</a> by {c.by}
          {i < CREDITS.length - 1 ? "; " : ". "}
        </span>
      ))}
      Licensed under{" "}
      <a href="http://creativecommons.org/licenses/by/4.0/" className="underline">CC BY 4.0</a>,
      reduced to low poly, recoloured and animated for this site.
    </p>
  );
}
