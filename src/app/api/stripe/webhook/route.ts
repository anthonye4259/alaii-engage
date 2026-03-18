import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUser } from "@/lib/auth";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.metadata?.userEmail || session.customer_email;
      const plan = (session.metadata?.plan as "pro" | "agency") || "pro";

      if (email) {
        await updateUser(email, {
          plan,
          stripeCustomerId: session.customer as string,
          onboarded: true,
        });
        console.log(`✅ ${email} upgraded to ${plan}, customer: ${session.customer}`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // If subscription goes active after a trial or payment
      if (subscription.status === "active") {
        console.log(`📝 Subscription active: ${customerId}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      // Downgrade to free when subscription is canceled
      const customerEmail = await getEmailFromCustomer(stripe, subscription.customer as string);
      if (customerEmail) {
        await updateUser(customerEmail, { plan: "free" });
        console.log(`❌ ${customerEmail} downgraded to free`);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = await getEmailFromCustomer(stripe, invoice.customer as string);
      if (customerEmail) {
        console.log(`⚠️ Payment failed for ${customerEmail}`);
        // Could pause the account or send a notification
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function getEmailFromCustomer(stripe: Stripe, customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer.email;
  } catch {
    return null;
  }
}
