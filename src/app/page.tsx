import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";
import { LEVELS, POINTS_PER_LEVEL } from "@/lib/houses";
import { getAllianceStandings } from "@/lib/standings";
import { createClient } from "@/lib/supabase/server";
import { HousesShowcase, ModelCredits } from "./_landing/houses-showcase";
import "./_landing/landing.css";

export const metadata: Metadata = {
  title: { absolute: "Career House Quest · Sairam Grand House Alliance" },
  description:
    "Find the careers that fit you, plan the route to get there, and earn points for your house. For Grades 9–12 in the Sairam Grand House Alliance.",
};

export default async function Landing() {
  const supabase = await createClient();
  const [{ data: claims }, standings] = await Promise.all([supabase.auth.getClaims(), getAllianceStandings()]);
  const signedIn = Boolean(claims?.claims);

  return (
    <div className="landing">
      <header className="landing-header fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-crest text-lg font-bold">
            <Image src="/houses/alliance-clear.png" alt="" width={36} height={36} priority />
            <span>Career House Quest</span>
          </Link>
          <Link href={signedIn ? "/start" : "/login"} className="btn btn-primary ml-auto min-h-10 px-4">
            {signedIn ? "Open my quest" : "Log in"}
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero relative flex min-h-svh items-center overflow-hidden px-4 pb-16 pt-24 sm:px-6">
          <div aria-hidden className="cloud-layer cloud-hero" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="font-crest text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
                Find your path. <span className="text-royal">Lift your house.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted">
                Career House Quest helps you discover the careers that suit you, then plan the real route to
                them: the courses, the colleges, the scholarships. Every level you complete earns{" "}
                {POINTS_PER_LEVEL} points for your house.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={signedIn ? "/start" : "/login"} className="btn btn-primary px-5">
                  {signedIn ? "Continue my quest" : "Log in to start"}
                </Link>
                <a href="#houses" className="btn btn-quiet bg-surface/70 px-5">
                  Meet the houses <ArrowDown size={18} aria-hidden />
                </a>
              </div>
              {!signedIn && (
                <p className="mt-3 text-sm text-muted">Your school creates your account. Ask your teacher for your login.</p>
              )}
            </div>
            <div className="crest-float mx-auto aspect-square w-full max-w-[20rem] overflow-hidden rounded-full bg-white p-3 lg:max-w-[25rem] lg:p-4">
              <Image
                src="/houses/alliance.png"
                alt="Sairam Grand House Alliance crest: the four houses under the lion of Leo"
                width={640}
                height={640}
                priority
                sizes="(min-width: 1024px) 25rem, 20rem"
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="levels-title" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h2 id="levels-title" className="font-crest text-3xl font-bold sm:text-4xl">Five levels, one route</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Start with an assessment, then do the research a career decision deserves. Teachers review each write-up
              before the points count.
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {LEVELS.map((l) => (
                <li key={l.level} className="panel p-5">
                  <p className="tabular text-sm font-semibold text-gold">Level {l.level}</p>
                  <h3 className="mt-1 font-crest text-xl font-bold">{l.name}</h3>
                  <p className="mt-2 text-sm text-muted">{l.task}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <HousesShowcase standings={standings} />
      </main>

      <footer className="border-t border-line bg-surface px-4 py-8 text-sm text-muted sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/" className="flex items-center gap-2.5 font-crest text-base font-bold text-ink">
            <Image src="/houses/alliance-clear.png" alt="" width={32} height={32} />
            Career House Quest
          </Link>
          <span>Sairam Grand House Alliance</span>
          <Link href={signedIn ? "/start" : "/login"} className="ml-auto font-semibold text-royal underline">
            {signedIn ? "Open my quest" : "Log in"}
          </Link>
        </div>
        <ModelCredits className="mx-auto mt-4 max-w-7xl text-xs" />
      </footer>
    </div>
  );
}
