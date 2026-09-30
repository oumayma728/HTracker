"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconCheck } from "@/components/Icons";
import { signIn, signUp } from "@/lib/auth_client";
type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [error , setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  function switchMode(next :Mode){
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Prevent the default form submission behavior
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");  
    
    const res = isSignup
    ? await signUp.email({name: String(formData.get("name") ?? ""), email, password})
    : await signIn.email({ email, password });

    setLoading(false);
    if (res.error) {
      setError(res.error.message || "An error occurred. Please try again.");
      return;
    }
    router.push("/home");
    router.refresh();
  }


  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand">
          <div className="brand-mark">
            <IconCheck size={18} />
          </div>
          <span className="brand-name">Tally</span>
        </div>

        <div className="stack" style={{ gap: 28 }}>
          <h1 className="login-headline">Small habits, kept daily.</h1>
          <p className="login-copy">
            Check in once a day. Watch your streaks build and see which habits are really sticking.
          </p>
          <div className="login-dots" aria-hidden="true">
            {[true, true, true, true, true, false, false].map((on, i) => (
              <div key={i} className={`login-dot ${on ? "is-on" : "is-off"}`}>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 15, color: "#dce8df" }}>Free to use. Your data stays yours.</p>
      </section>

      <section className="login-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="stack" style={{ gap: 6 }}>
            <h2 className="page-title" style={{ fontSize: 34 }}>
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="muted">
              {isSignup ? "Start tracking in under a minute." : "Sign in to check in on today."}
            </p>
          </div>

          <div className="segmented">
            <button type="button" aria-pressed={!isSignup} onClick={() => setMode("signin")}>
              Sign in
            </button>
            <button type="button" aria-pressed={isSignup} onClick={() => setMode("signup")}>
              Create account
            </button>
          </div>

          {isSignup && (
            <div className="field">
              <label className="label" htmlFor="name">
                Name
              </label>
              <input id="name" name="name" type="text" className="input" placeholder="Your name" autoComplete="name" />
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="At least 8 characters"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            {isSignup ? "Create account" : "Sign in"}
          </button>
          <div className="divider">or</div>
        </form>
      </section>
    </div>
  );
}
