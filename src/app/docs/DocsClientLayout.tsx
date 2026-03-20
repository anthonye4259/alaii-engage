"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebar = [
  {
    section: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "How It Works", href: "/docs/how-it-works" },
      { title: "Quickstart", href: "/docs/quickstart" },
    ],
  },
  {
    section: "Installation",
    items: [
      { title: "Docker Compose", href: "/docs/installation/docker" },
      { title: "Manual Setup", href: "/docs/installation/manual" },
      { title: "Deploy to Vercel", href: "/docs/installation/vercel" },
    ],
  },
  {
    section: "Configuration",
    items: [
      { title: "Environment Variables", href: "/docs/configuration/env" },
      { title: "Platform Setup", href: "/docs/configuration/platforms" },
      { title: "Webhooks", href: "/docs/configuration/webhooks" },
    ],
  },
  {
    section: "API Reference",
    items: [
      { title: "Authentication", href: "/docs/api/auth" },
      { title: "Generate Content", href: "/docs/api/generate" },
      { title: "Publish Content", href: "/docs/api/publish" },
      { title: "Usage & Billing", href: "/docs/api/usage" },
      { title: "Errors", href: "/docs/api/errors" },
    ],
  },
  {
    section: "Platforms",
    items: [
      { title: "Instagram", href: "/docs/platforms/instagram" },
      { title: "Facebook", href: "/docs/platforms/facebook" },
      { title: "X (Twitter)", href: "/docs/platforms/x" },
      { title: "LinkedIn", href: "/docs/platforms/linkedin" },
      { title: "Reddit", href: "/docs/platforms/reddit" },
      { title: "TikTok", href: "/docs/platforms/tiktok" },
    ],
  },
];

export default function DocsClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="font-semibold text-text-primary text-sm">Alaii Engage</span>
            </Link>
            <span className="text-text-muted text-xs font-medium">Docs</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/anthonye4259/alaii-engage"
              className="text-xs text-text-muted hover:text-text-secondary transition flex items-center gap-1.5"
              target="_blank"
              rel="noopener"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
            <Link
              href="/login?signup=true"
              className="px-4 py-1.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-xs font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border py-8 px-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden md:block">
          {sidebar.map((group) => (
            <div key={group.section} className="mb-6">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
                {group.section}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-8 px-8 md:px-12 max-w-3xl">
          {children}
        </main>
      </div>
    </div>
  );
}
