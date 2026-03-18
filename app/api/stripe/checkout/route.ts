import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "ログインが必要です。" },
      { status: 401 }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe の設定が不足しています。" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout セッションのURLを取得できませんでした。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout error:", err);
    return NextResponse.json(
      { error: "決済画面の作成に失敗しました。" },
      { status: 500 }
    );
  }
}
