import { requireProfileAllowingReset } from "@/lib/auth";
import { TopBar } from "@/components/top-bar";

// Reachable even while a default password is pending, so people can choose their own.
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const profile = await requireProfileAllowingReset();
  return (
    <>
      <TopBar profile={profile} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-10">{children}</main>
    </>
  );
}
