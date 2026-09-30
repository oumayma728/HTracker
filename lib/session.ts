import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Returns the logged-in user, or sends the visitor to /login.
 * Every function that reads or writes data starts by calling this.
 */
export async function requireUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");
    return session.user;
}
