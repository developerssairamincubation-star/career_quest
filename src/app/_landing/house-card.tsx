import Image from "next/image";
import type { House } from "@/lib/houses";
import type { HouseStanding } from "@/lib/standings";

export type Habitat = { animal: string; place: string; action: string };

const fmt = (n: number) => n.toLocaleString("en-IN");

/** Score card shown beside a house's island. `standing` is null until standings are available. */
export function HouseCard({
  house,
  habitat,
  standing,
  leader,
}: {
  house: House;
  habitat: Habitat;
  standing: HouseStanding | null;
  leader: HouseStanding | null;
}) {
  const behind = standing && leader ? leader.points - standing.points : 0;
  const share = standing && leader?.points ? Math.max(4, Math.round((standing.points / leader.points) * 100)) : 0;
  const perMember = standing?.members ? Math.round(standing.points / standing.members) : 0;

  return (
    <article className="landing-card" style={{ ["--house" as string]: house.color, ["--on-house" as string]: house.onColor }}>
      <header className="flex items-center gap-4">
        <Image src={house.crest} alt="" width={72} height={72} className="size-12 shrink-0 sm:size-[72px]" />
        <div className="min-w-0">
          <h2 className="font-crest text-2xl font-bold sm:text-4xl">{house.name}</h2>
        </div>
        {standing && (
          <span className="rank-badge ml-auto" aria-label={`Rank ${standing.rank}`}>
            #{standing.rank}
          </span>
        )}
      </header>

      <p className="mt-3 hidden text-muted sm:block">
        {house.trait}. The {habitat.animal.toLowerCase()} {habitat.action} {habitat.place}.
      </p>

      {standing ? (
        <>
          <div className="mt-3 sm:mt-5">
            <p className="text-sm font-semibold text-muted">House points</p>
            <p className="tabular font-crest text-4xl font-bold leading-none sm:text-6xl">
              <span data-count={standing.points}>{fmt(standing.points)}</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
              <div className="h-full rounded-full bg-[var(--house)]" style={{ width: `${share}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {behind === 0 ? "Leading the alliance" : `${fmt(behind)} points behind the leader`}
            </p>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 sm:mt-5">
            <Stat label="Members" value={standing.members} />
            <Stat label="Levels cleared" value={standing.levelsCleared} />
            <Stat label="Points per member" value={perMember} />
          </dl>
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-sunken px-4 py-3 text-sm text-muted">
          House standings appear here once the season&rsquo;s first points are awarded.
        </p>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-sunken px-3 py-2.5">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="tabular text-xl font-bold">
        <span data-count={value}>{fmt(value)}</span>
      </dd>
    </div>
  );
}
