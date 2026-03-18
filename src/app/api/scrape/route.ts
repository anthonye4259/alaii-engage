import { NextRequest, NextResponse } from "next/server";

/**
 * Website Scraper — Fetches a website and uses OpenAI to extract business context
 *
 * POST { url: "https://example.com" }
 * Returns: { businessName, industry, description, tone, targetAudience, alwaysMention, neverSay }
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Fetch the website
    let html: string;
    try {
      const pageRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AlaiBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      html = await pageRes.text();
    } catch {
      return NextResponse.json({ error: "Could not fetch website. Check the URL." }, { status: 400 });
    }

    // 2. Strip HTML to text (basic extraction)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000); // Limit to 4K chars for OpenAI context

    // 3. Ask OpenAI to analyze
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a business analyst. Analyze the website content below and extract key business information. Return ONLY valid JSON with these fields:
{
  "businessName": "The business name",
  "industry": "The industry or niche (e.g. 'barbershop', 'fitness training', 'SaaS')",
  "description": "1-2 sentence description of what they do",
  "tone": "The brand voice/tone (e.g. 'casual and friendly', 'professional and warm')",
  "targetAudience": "Who their customers are",
  "alwaysMention": ["website URL", "key selling points to mention"],
  "neverSay": ["competitor names or things to avoid"]
}
Be specific and accurate. If you can't determine a field, use an empty string or empty array.`,
          },
          {
            role: "user",
            content: `Website URL: ${url}\n\nWebsite content:\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const aiData = await aiRes.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiText];
      const parsed = JSON.parse(jsonMatch[1]!.trim());
      return NextResponse.json({ success: true, data: parsed });
    } catch {
      return NextResponse.json({ success: true, data: { raw: aiText } });
    }
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: "Failed to analyze website" }, { status: 500 });
  }
}
