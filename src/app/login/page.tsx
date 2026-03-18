"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f7ff] via-white to-[#e8f4fd] relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Alaii Engage</h1>
          <p className="text-text-secondary text-sm mt-2">AI-powered social media engagement, on autopilot</p>
        </div>

        {!sent ? (
          <div className="bg-white/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl shadow-black/[0.03]">
            <h2 className="text-xl font-semibold text-text-primary text-center mb-2">
              Sign in to your account
            </h2>
            <p className="text-text-muted text-sm text-center mb-8">
              We&apos;ll send you a magic link — no password needed
            </p>

            {(error || urlError) && (
              <div className="bg-error/5 border border-error/20 text-error text-sm rounded-xl p-3 mb-6 text-center">
                {error || (urlError === "invalid_token" ? "Link expired or already used. Try again." : "Something went wrong.")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send magic link →"
                )}
              </button>
            </form>

            <p className="text-text-muted text-xs text-center mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        ) : (
          /* Check your inbox state */
          <div className="bg-white/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl shadow-black/[0.03] text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 mx-auto flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Check your email</h2>
            <p className="text-text-secondary text-sm mb-1">
              We sent a sign-in link to
            </p>
            <p className="text-text-primary font-medium text-sm mb-6">{email}</p>
            <p className="text-text-muted text-xs">
              Didn&apos;t receive it?{" "}
              <button
                onClick={() => { setSent(false); setError(""); }}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Try again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
