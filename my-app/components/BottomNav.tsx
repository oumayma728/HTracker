"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconChart, IconList, IconSliders, IconSun } from "./Icons";

const LINKS = [
  { href: "/home", label: "Today", Icon: IconSun },
  { href: "/habits", label: "Habits", Icon: IconList },
  { href: "/Calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/Statistics", label: "Stats", Icon: IconChart },
  { href: "/Profile", label: "Settings", Icon: IconSliders },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="bottom-nav">
      {LINKS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className="bottom-nav-link" aria-current={active ? "page" : undefined}>
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
