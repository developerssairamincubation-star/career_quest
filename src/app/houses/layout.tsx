import { requireProfile } from "@/lib/auth";
import { TopBar } from "@/components/top-bar";

export default async function HousesLayout({ children }: LayoutProps<"/houses">) {
  const profile = await requireProfile();
  return (
    <>
      <TopBar profile={profile} />
      <main className="flex-1">{children}</main>
    </>
  );
}
