import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Subscriptions & API",
  description:
    "Alaii Engage pricing: Pro $40/mo and Agency $99/mo subscriptions for businesses, or $0.01/call API for developers and AI agents. No monthly minimum.",
  openGraph: {
    title: "Alaii Engage Pricing — From $0.01/call",
    description: "Subscription plans for businesses. Pay-per-call API for developers and AI agents.",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
