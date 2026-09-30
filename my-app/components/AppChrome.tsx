"use client";

import { usePathname , useRouter } from "next/navigation";
import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { Sidebar } from "./Sidebar";
import {useEffect} from "react";
import type { User as ChromeUser } from "@/lib/data";
const NO_CHROME_ROUTES = ["/login", "/"];

export function AppChrome({ children , user}: { children: ReactNode; user : ChromeUser |null }) {
  const pathname = usePathname();
  const router = useRouter();
  const noChrome = NO_CHROME_ROUTES.includes(pathname);
  useEffect(() => {
    if (!user && !noChrome) router.replace("/login");
  }, [user, noChrome, router]);

  if (noChrome) {
    return <>{children}</>;
  }
  
  if (!user) {
    return null; // or a loading spinner, or redirect to login
  }
  return (

      <div className="app-shell">
      <Sidebar user={user} />
      <main className="main">{children}</main>
      <BottomNav />
      </div>
      
  );
}
