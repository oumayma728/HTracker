"use client";
import {useRouter} from "next/navigation";
import {signOut} from "@/lib/auth_client";

export function SignOutButton({className}:{className?:string}) {
const router = useRouter();
async function handleClick (){
    await signOut();
    router.push("/login");
    router.refresh();
}
return (
    <button type="button" className={className} onClick={handleClick}>
      Sign out
    </button>
  );

}