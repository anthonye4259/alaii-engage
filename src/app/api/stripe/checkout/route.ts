import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser, authenticateApiKey } from "@/lib/auth";

const PRICE_TO_PLAN: Record<string, "pro" | "agency"> = {
  price_pro_monthly: "pro",
  price_agency_monthly: "agency",
};

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();
    const stripe = getStripe();

    // Get the current user (from cookie or API key)
    let email = "unknown";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ae_")) {
      const user = await authenticateApiKey(authHeader.replace("Bearer ", ""));
      if (user) email = user.email;
    } else {
      const user = await getCurrentUser();
      if (user) email = user.email;
    }

    const plan = PRICE_TO_PLAN[priceId] || "pro";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email !== "unknown" ? email : undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userEmail: email,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
