import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap font-crest text-lg font-bold">
          <Image src="/houses/alliance-clear.png" alt="" width={36} height={36} priority />
          <span>Career House Quest</span>
        </Link>
        <Link href="/login" className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden /> Sign in
        </Link>
      </div>
      <div className="mx-auto flex w-full flex-1 items-center py-8">
        <div className="house-panel mx-auto w-full max-w-md p-6 sm:p-8">
          <h1 className="font-crest text-3xl font-bold">Forgot password</h1>
          <p className="text-muted">
            Enter your school email. We&apos;ll send a temporary password, and you&apos;ll choose a new one when you sign in.
          </p>
          <div className="mt-6">
            <ForgotForm />
          </div>
          <p className="mt-6 text-sm text-muted">
            Students can also ask their class teacher to reset it. Teachers can ask their school admin.
          </p>
        </div>
      </div>
    </main>
  );
}
