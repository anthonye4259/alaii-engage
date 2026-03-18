export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Alaii Engage",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered social media engagement automation. Automate comments, likes, replies, and DMs across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook.",
    url: "https://alaii-engage.vercel.app",
    offers: [
      {
        "@type": "Offer",
        name: "API Pay-per-call",
        price: "0.01",
        priceCurrency: "USD",
        description: "AI content generation API at $0.01 per call",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "40.00",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "Full engagement automation for growing businesses",
      },
      {
        "@type": "Offer",
        name: "Agency",
        price: "99.00",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "For agencies managing multiple brands",
      },
    ],
    featureList: [
      "Instagram automation",
      "TikTok automation",
      "LinkedIn automation",
      "Facebook automation",
      "X (Twitter) automation",
      "Reddit automation",
      "AI content generation",
      "Anti-detection responses",
      "API access for developers",
      "Agent-friendly signup",
    ],
    creator: {
      "@type": "Organization",
      name: "Alaii",
      url: "https://alaii.app",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
