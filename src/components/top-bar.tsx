import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/auth";
import { houseById } from "@/lib/houses";
import { NavLinks } from "./nav-links";
import { ProfileMenu } from "./profile-menu";

/** Each role's menu; "About the houses" is common to all. */
function linksFor(role: Profile["role"]) {
  const links =
    role === "student"
      ? [{ href: "/quest", label: "My quest" }]
      : [{ href: "/staff", label: "Overview" }];
  if (role === "teacher" || role === "counsellor") links.push({ href: "/staff/review", label: "Reviews" });
  if (role === "counsellor" || role === "admin") {
    links.push({ href: "/staff/import", label: "Add students" }, { href: "/staff/classes", label: "Classes and staff" });
  }
  return [...links, { href: "/houses", label: "About the houses" }];
}

export function TopBar({ profile }: { profile: Profile }) {
  const house = houseById(profile.house);
  const links = linksFor(profile.role);
  return (
    <header className="app-header sticky top-0 z-30">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/start" className="flex shrink-0 items-center gap-2.5 font-crest text-lg font-bold">
          <Image src="/houses/alliance-clear.png" alt="" width={36} height={36} priority />
          <span className="sr-only sm:not-sr-only">Career House Quest</span>
        </Link>
        {/* On phones the links scroll sideways under a fade instead of wrapping onto extra lines. */}
        <nav
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] sm:ml-2"
          aria-label="Main"
        >
          <NavLinks links={links} />
        </nav>
        <ProfileMenu name={profile.full_name} role={profile.role} house={house?.name} crest={house?.crest} />
      </div>
    </header>
  );
}
