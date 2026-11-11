"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header navigation: the section you are in is lit. A section's home matches only itself. */
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  const homes = new Set(links.map((l) => l.href).filter((h) => links.some((o) => o.href !== h && o.href.startsWith(h + "/"))));
  const isActive = (href: string) => (homes.has(href) ? path === href : path === href || path.startsWith(href + "/"));
  return (
    <>
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className="nav-pill">
          {l.label}
        </Link>
      ))}
    </>
  );
}
