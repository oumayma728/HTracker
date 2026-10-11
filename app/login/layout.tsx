import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Signed-in users never see the login form: send them to the app instead.
// This checks the real session (not just the cookie), so an expired cookie still shows the form.
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");
  return children;
}
