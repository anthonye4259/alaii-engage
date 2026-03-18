import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Complete API reference for Alaii Engage. Generate AI-powered social media engagement content across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook. Bearer token auth, $0.01/call.",
  openGraph: {
    title: "Alaii Engage API Docs — Social Media AI API",
    description: "Full API reference. Sign up, generate content, check usage. Agent-friendly with OpenAPI spec.",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
