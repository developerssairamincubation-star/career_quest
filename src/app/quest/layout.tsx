import { requireRole } from "@/lib/auth";
import { DateStamp } from "@/components/date-stamp";
import { TopBar } from "@/components/top-bar";

export default async function QuestLayout({ children }: LayoutProps<"/quest">) {
  const profile = await requireRole("student");
  return (
    <>
      <TopBar profile={profile} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <DateStamp />
        {children}
      </main>
    </>
  );
}
