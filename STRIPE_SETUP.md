# Stripe Payment Integration Setup

This guide will help you set up Stripe payment integration for your Next.js e-commerce application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your Next.js application with the required dependencies installed

## Installation

The following packages have been installed:
- `stripe` - Server-side Stripe SDK
- `@stripe/stripe-js` - Client-side Stripe SDK
- `@stripe/react-stripe-js` - React components for Stripe

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Getting Your Stripe Keys

1. **Secret Key**: Go to your Stripe Dashboard → Developers → API Keys → Secret key
2. **Publishable Key**: Go to your Stripe Dashboard → Developers → API Keys → Publishable key
3. **Webhook Secret**: Set up a webhook endpoint (see Webhook Setup section)

## Database Migration

Run the following command to update your database schema with payment fields:

```bash
npx prisma migrate dev --name add_payment_fields
```

This will add the following fields to the Order model:
- `paymentIntentId` - Stripe payment intent ID
- `paymentStatus` - Payment status from Stripe

## Webhook Setup

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to your environment variables

## Testing

### Test Cards

Use these test card numbers for testing:

- **Successful Payment**: `4242 4242 4242 4242`
- **Declined Payment**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Mode

Make sure you're using test keys (starting with `sk_test_` and `pk_test_`) for development.

## Features Implemented

1. **Payment Intent Creation**: Creates Stripe payment intents for checkout
2. **Payment Form**: Secure payment form using Stripe Elements
3. **Order Creation**: Creates orders with payment intent IDs
4. **Webhook Handling**: Updates order status based on payment events
5. **Order Confirmation**: Shows order details after successful payment

## API Endpoints

- `POST /api/payment/create-payment-intent` - Creates payment intent
- `POST /api/webhooks/stripe` - Handles Stripe webhooks
- `GET /api/orders/by-payment-intent/[paymentIntentId]` - Gets order by payment intent

## Files Modified/Created

### New Files:
- `lib/stripe.ts` - Stripe server configuration
- `lib/stripe-client.ts` - Stripe client configuration
- `app/api/payment/create-payment-intent/route.ts` - Payment intent API
- `app/api/webhooks/stripe/route.ts` - Webhook handler
- `app/api/orders/by-payment-intent/[paymentIntentId]/route.ts` - Order lookup by payment intent
- `app/payment-success/page.tsx` - Payment success page

### Modified Files:
- `prisma/schema.prisma` - Added payment fields to Order model
- `app/api/orders/route.ts` - Updated to include payment intent ID
- `app/checkout/page.tsx` - Integrated Stripe payment form
- `app/order-confirmation/page.tsx` - Updated to handle payment intent IDs

## Security Notes

1. Never expose your Stripe secret key in client-side code
2. Always verify webhook signatures
3. Use HTTPS in production
4. Implement proper error handling
5. Test thoroughly with Stripe's test mode

## Production Deployment

1. Switch to live Stripe keys
2. Update webhook endpoint URL to production domain
3. Ensure HTTPS is enabled
4. Test the complete payment flow
5. Monitor webhook events in Stripe Dashboard

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your environment variables
2. **"Webhook signature verification failed"**: Verify webhook secret
3. **"Payment failed"**: Check test card numbers and Stripe Dashboard
4. **Database errors**: Run Prisma migrations

### Debug Tips:

1. Check browser console for client-side errors
2. Check server logs for API errors
3. Monitor Stripe Dashboard for payment events
4. Use Stripe CLI for local webhook testing

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com) 