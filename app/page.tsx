import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Entry point ("/", also the PWA start_url): go straight to the app if already signed in.
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session ? "/home" : "/login");
}
