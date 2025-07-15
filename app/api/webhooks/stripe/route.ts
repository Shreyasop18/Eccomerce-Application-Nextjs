import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.log('No signature header on webhook');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Received Stripe event:', event.type, event.data.object.id);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded for paymentIntentId:', paymentIntent.id);
        
        // Find order by paymentIntentId
        const order = await prisma.order.findFirst({
          where: { 
            paymentIntentId: paymentIntent.id
          }
        });
        
        if (!order) {
          console.error('No order found for paymentIntentId:', paymentIntent.id);
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Skip if order is already in the correct state
        if (order.status === 'RECEIVED' && order.paymentStatus === 'succeeded') {
          console.log('Order already in correct state:', order.id);
          return NextResponse.json({ received: true });
        }
        
        console.log('Found order:', order.id, 'current status:', order.status, 'payment status:', order.paymentStatus);
        
        // Update order status only if needed
        const result = await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: 'RECEIVED',
            paymentStatus: 'succeeded',
          },
        });
        
        console.log('Order updated successfully:', result.id, 'new status:', result.status, 'new payment status:', result.paymentStatus);
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedPaymentIntent = event.data.object;
        console.log('Payment failed for paymentIntentId:', failedPaymentIntent.id);
        // Find order by paymentIntentId
        const order = await prisma.order.findFirst({
          where: { 
            paymentIntentId: failedPaymentIntent.id,
            status: 'RECEIVED',
            paymentStatus: 'pending'
          }
        });
        
        if (!order) {
          console.error('No received order found for paymentIntentId:', failedPaymentIntent.id);
          return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 });
        }
        
        console.log('Found order:', order.id, 'current status:', order.status, 'payment status:', order.paymentStatus);
        
        // Update order status
        const result = await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: 'FAILED', // Changed from 'PAYMENT_FAILED' to 'FAILED'
            paymentStatus: 'failed',
          },
        });
        console.log('Order update result:', result);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
} 