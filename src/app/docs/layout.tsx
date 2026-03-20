import { Metadata } from "next";
import DocsClientLayout from "./DocsClientLayout";

export const metadata: Metadata = {
  title: "Alaii Engage Documentation",
  description:
    "Complete documentation for Alaii Engage — the open-source AI engagement engine for social media. Self-host or use the managed API.",
  openGraph: {
    title: "Alaii Engage Docs — Open Source AI Engagement",
    description: "Installation guides, API reference, platform setup, and more.",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsClientLayout>{children}</DocsClientLayout>;
}
