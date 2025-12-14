# Stripe Payment Integration Setup Guide

This guide will help you configure Stripe payments for your educational platform.

## Prerequisites

- A Stripe account (free to create)
- Access to your `.env` file

## Step 1: Create a Stripe Account

1. Visit https://dashboard.stripe.com/register
2. Sign up for a free Stripe account
3. Complete the account verification process

## Step 2: Get Your API Keys

1. Log in to your Stripe Dashboard
2. Click on **Developers** in the left sidebar
3. Click on **API keys**
4. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_`) - Safe to use in client-side code
   - **Secret key** (starts with `sk_test_`) - Keep this private, server-side only

5. Copy both keys and add them to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
```

## Step 3: Configure Webhook (for Local Development)

For local development, you'll use the Stripe CLI to forward webhooks to your local server.

### Install Stripe CLI

**Windows (with Scoop):**
```bash
scoop install stripe
```

**macOS (with Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl -s https://packages.stripe.com/api/v1/install.sh | bash
```

### Login to Stripe CLI

```bash
stripe login
```

This will open a browser window to authenticate.

### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:4321/api/payments/webhook
```

This command will output a webhook signing secret (starts with `whsec_`). Copy it and add to your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important:** Keep the `stripe listen` command running while testing payments locally.

## Step 4: Configure Webhook (for Production)

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL: `https://yourdomain.com/api/payments/webhook`
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add it to your production `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_production_webhook_secret
```

## Step 5: Set Application URL

Update your `.env` with the correct application URL:

**Local Development:**
```env
PUBLIC_APP_URL=http://localhost:4321
```

**Production:**
```env
PUBLIC_APP_URL=https://yourdomain.com
```

## Step 6: Run Database Migration

After configuring Stripe keys, run the payment setup migration:

```bash
# Connect to your Supabase project and run:
# supabase/migrations/007_payments_setup.sql
```

Or use the Supabase dashboard to run the migration directly.

## Step 7: Test the Integration

### Test Card Numbers

Stripe provides test card numbers for testing payments:

- **Success:** `4242 4242 4242 4242`
- **Requires authentication:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 9995`
- **Insufficient funds:** `4000 0000 0000 9995`

**For all test cards:**
- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC
- Use any postal code

### Testing Workflow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:4321/api/payments/webhook
   ```

3. Log in to your admin panel and create a course with a price

4. As a student user, try to purchase the course

5. Use test card `4242 4242 4242 4242` to complete payment

6. Verify that:
   - Payment appears in Stripe Dashboard
   - User is enrolled in the course
   - Payment record is created in database

## Switching to Production

When ready to accept real payments:

1. **Activate your Stripe account:**
   - Complete business information
   - Add bank account details
   - Verify your identity

2. **Switch to live keys:**
   - In Stripe Dashboard, toggle from "Test mode" to "Live mode"
   - Copy the live keys (start with `pk_live_` and `sk_live_`)
   - Update your production `.env` with live keys

3. **Configure production webhook:**
   - Add webhook endpoint with your production URL
   - Update `STRIPE_WEBHOOK_SECRET` with production signing secret

4. **Update APP_URL:**
   ```env
   PUBLIC_APP_URL=https://yourdomain.com
   ```

## Troubleshooting

### Webhook Not Receiving Events

- Ensure `stripe listen` is running for local development
- Check that webhook URL is correct in Stripe Dashboard for production
- Verify webhook signing secret matches in `.env`

### Payment Not Creating Enrollment

- Check webhook logs in Stripe Dashboard
- Verify database permissions (RLS policies)
- Check server logs for errors

### Stripe Dashboard Shows Test Data

- Make sure you're in "Test mode" during development
- Test mode and live mode data are completely separate

## Security Reminders

- ✅ Never commit `.env` file to version control
- ✅ Keep `STRIPE_SECRET_KEY` private (server-side only)
- ✅ Use environment variables in production
- ✅ Verify webhook signatures on all webhook endpoints
- ✅ Use HTTPS in production

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing
