import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { HOUSES } from "@/lib/houses";
import { DustLogo } from "./dust-logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  "no-profile": "Your account isn't linked to a school yet. Ask your teacher or the school admin to add you.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const notice = typeof error === "string" ? NOTICES[error] : undefined;

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap font-crest text-lg font-bold">
          <Image src="/houses/alliance-clear.png" alt="" width={36} height={36} priority />
          <span>Career House Quest</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> Home
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_1fr] lg:gap-14">
        <section className="flex flex-col items-center text-center">
          <DustLogo className="w-full max-w-[15rem] sm:max-w-[20rem] lg:max-w-[30rem]" />
          <p className="mt-4 hidden font-crest text-4xl font-bold leading-[1.05] lg:block">
            Find your path. <span className="text-royal">Lift your house.</span>
          </p>
        </section>

        <section className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="house-panel mx-auto max-w-md p-6 sm:p-8">
            <div>
              <h1 className="font-crest text-3xl font-bold">Sign in</h1>
              <p className="text-muted">Use the email and password from your teacher.</p>
            </div>
            <div className="mt-6">
              <LoginForm notice={notice} />
            </div>
            <ul className="mt-6 flex justify-center gap-2" aria-label="Houses">
              {HOUSES.map((h) => (
                <li key={h.id} className="h-1.5 w-10 rounded-full" style={{ background: h.color }} title={h.name} />
              ))}
            </ul>
          </div>
          <p className="mx-auto mt-4 max-w-md text-center text-sm text-muted">
            Your school creates your account. Forgot your password? Use the link above, or ask your teacher to reset it.
          </p>
        </section>
      </div>
    </main>
  );
}
