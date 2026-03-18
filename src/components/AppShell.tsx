"use client";

import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PATHS = ["/login", "/onboarding", "/landing", "/pricing", "/docs", "/blog", "/privacy", "/terms"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";

  useEffect(() => {
    if (loading) return;

    // Not logged in on a protected page → redirect to landing
    if (!user && !isPublicPage) {
      router.replace("/landing");
    }

    // Logged in but not onboarded → redirect to onboarding
    if (user && !user.onboarded && !isPublicPage && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [user, loading, pathname, isPublicPage, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Public pages — no sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Not authenticated — don't render anything (redirect will fire)
  if (!user) {
    return null;
  }

  // Authenticated — render with sidebar
  return (
    <>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </>
  );
}
