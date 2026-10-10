"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconCheck, IconChart, IconList, IconRoute, IconSliders, IconSun } from "./Icons";
import type { User } from "@/lib/data";
import {SignOutButton} from "./SignOutButton";
import { ThemeToggle } from "./settings/ThemeToggle";

const LINKS = [
  { href: "/home", label: "Today", Icon: IconSun },
  { href: "/habits", label: "Habits", Icon: IconList },
  { href: "/journey", label: "Journey", Icon: IconRoute }, // Journey feature: step-by-step roadmap
  { href: "/Calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/Statistics", label: "Stats", Icon: IconChart },
  { href: "/Profile", label: "Settings", Icon: IconSliders },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <Link href="/home" className="brand">
          <span className="brand-mark">
            <IconCheck size={18} />
          </span>
          <span className="brand-name">habit</span>
        </Link>
        <ThemeToggle />
      </div>

      <nav aria-label="Main" className="nav">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={active ? "nav-link is-active" : "nav-link"}
              aria-current={active ? "page" : undefined}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="user">
        <div className="avatar">{user.initials}</div>
        <div>
          <span className="user-name">{user.name}</span>
          <SignOutButton className="user-out" />
        </div>
      </div>
    </aside>
  );
}
