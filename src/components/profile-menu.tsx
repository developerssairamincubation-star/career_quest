"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";

/** The signed-in person, top right. Opens a small menu holding Change password and Sign out. */
export function ProfileMenu({ name, role, house, crest }: { name: string; role: string; house?: string; crest?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

  return (
    <div ref={box} className="relative ml-auto shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 hover:bg-white/80"
      >
        <span
          className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-sm font-bold shadow-[0_0_0_2px_var(--color-gold-soft),0_0_0_3px_var(--color-gold)]"
          aria-hidden
        >
          {crest ? <Image src={crest} alt="" width={40} height={40} className="size-9" /> : initials}
        </span>
        <span className="hidden text-left text-sm leading-tight md:block">
          <span className="block font-semibold">{name}</span>
          <span className="block capitalize text-muted">{house ? `${role} · ${house}` : role}</span>
        </span>
        <ChevronDown size={16} aria-hidden className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-60 rounded-2xl bg-white p-2 shadow-[0_1px_2px_rgb(27_24_56/0.06),0_18px_40px_-14px_rgb(27_24_56/0.3)]"
        >
          <div className="px-3 py-2 md:hidden">
            <p className="font-semibold">{name}</p>
            <p className="text-sm capitalize text-muted">{role}</p>
          </div>
          <Link
            href="/account/password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold hover:bg-sunken"
          >
            <KeyRound size={18} aria-hidden />
            Change password
          </Link>
          <form action={signOut}>
            <button type="submit" role="menuitem" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-semibold hover:bg-sunken">
              <LogOut size={18} aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
