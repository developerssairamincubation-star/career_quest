import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { HouseId } from "@/lib/auth";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export type HouseStanding = {
  house: HouseId;
  points: number;
  members: number;
  levelsCleared: number;
  rank: number;
};

/** Alliance-wide house totals (aggregates only), cached for five minutes. Throws on failure, so a
 * failure is never cached in place of real standings. */
const cachedStandings = unstable_cache(
  async (): Promise<HouseStanding[]> => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc("alliance_standings");
    if (error || !data) throw new Error(`alliance_standings failed: ${error?.message ?? "no data"}`);
    const rows = data as { house: HouseId; points: number; members: number; levels_cleared: number }[];
    // Equal points share a rank, so a tie is shown as a tie.
    return rows.map((r) => ({
      house: r.house,
      points: Number(r.points),
      members: Number(r.members),
      levelsCleared: Number(r.levels_cleared),
      rank: 1 + rows.filter((o) => Number(o.points) > Number(r.points)).length,
    }));
  },
  ["alliance-standings-v2"],
  { revalidate: 300, tags: ["standings"] },
);

/** Standings for the public landing page, or null (e.g. before migration 0003 is run) so the page still renders. */
export async function getAllianceStandings(): Promise<HouseStanding[] | null> {
  try {
    return await cachedStandings();
  } catch {
    return null;
  }
}
