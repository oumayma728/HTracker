import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { headers } from "next/headers";
import { AppChrome } from "@/components/AppChrome";
import { auth } from "@/lib/auth";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Tally",
  description: "A simple daily habit tracker.",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  const user = session
    ? {
        name: session.user.name,
        email: session.user.email,
        initials: getInitials(session.user.name) || "?",
      }
    : null;

  return (
    <html lang="en"
    suppressHydrationWarning
    className={`${display.variable} ${body.variable}`}>
      <body>
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        >
        <AppChrome user={user}>{children}</AppChrome>

        </ThemeProvider>
      </body>
    </html>
  );
}