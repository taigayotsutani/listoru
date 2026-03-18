import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 }
    );
  }

  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secretKey);

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 }
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;

  if (!userId || typeof userId !== "string") {
    console.error("Webhook: missing or invalid client_reference_id", session.id);
    return NextResponse.json(
      { error: "Missing client_reference_id." },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase admin credentials are not set");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      subscription_tier: "pro",
      monthly_credits: 3000,
    })
    .eq("id", userId);

  if (error) {
    console.error("Webhook: failed to update users", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
