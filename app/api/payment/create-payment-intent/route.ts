import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { findUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get user from request headers
    const userEmail = request.headers.get('user-email');
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized - Email required" }, { status: 401 });
    }

    const user = await findUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { amount, currency = 'inr' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        userId: user.id,
        userEmail: user.email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
} 