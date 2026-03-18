import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import AppShell from "@/components/AppShell";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: {
    default: "Alaii Engage — AI Social Media Engagement Automation",
    template: "%s | Alaii Engage",
  },
  description:
    "Automate social media engagement with AI. Comment, like, reply, and DM across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook — on autopilot. API available for developers and AI agents at $0.01/call.",
  keywords: [
    "social media automation",
    "AI engagement",
    "Instagram automation",
    "TikTok automation",
    "social media AI",
    "engagement bot",
    "comment automation",
    "DM automation",
    "social media API",
    "AI agent API",
    "Alaii Engage",
    "social media marketing",
    "engagement platform",
    "automated replies",
    "content generation API",
  ],
  authors: [{ name: "Alaii" }],
  creator: "Alaii",
  publisher: "Alaii",
  metadataBase: new URL("https://alaii-engage.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://alaii-engage.vercel.app",
    siteName: "Alaii Engage",
    title: "Alaii Engage — AI Social Media Engagement Automation",
    description:
      "Automate social media engagement with AI across 6 platforms. API available for developers and AI agents.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Alaii Engage — AI-powered social media engagement automation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alaii Engage — AI Social Media Engagement",
    description:
      "Automate comments, likes, replies, and DMs across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="canonical" href="https://alaii-engage.vercel.app" />
        <meta name="theme-color" content="#4A9FD4" />
      </head>
      <body className="flex min-h-screen">
        <JsonLd />
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
