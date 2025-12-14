# Testing Guide - Stripe Payments Integration

This guide will help you test the Stripe payment integration for your educational platform.

## Prerequisites

Before testing, ensure you have:

- ✅ Stripe account configured with test keys
- ✅ Database migrations applied (`007_payments_setup.sql`)
- ✅ Environment variables set in `.env`
- ✅ Development server running (`npm run dev`)

## Test Cards

Stripe provides several test card numbers for different scenarios. Use these cards in test mode:

### Successful Payments

| Card Number         | Description                  |
| ------------------- | ---------------------------- |
| 4242 4242 4242 4242 | Visa - Always succeeds       |
| 5555 5555 5555 4444 | Mastercard - Always succeeds |
| 3782 822463 10005   | American Express             |

### Authentication Required

| Card Number         | Description                           |
| ------------------- | ------------------------------------- |
| 4000 0025 0000 3155 | Requires 3D Secure authentication     |
| 4000 0027 6000 3184 | Requires authentication (always fails)|

### Payment Failures

| Card Number         | Description                     |
| ------------------- | ------------------------------- |
| 4000 0000 0000 0002 | Card declined - Generic decline |
| 4000 0000 0000 9995 | Insufficient funds              |
| 4000 0000 0000 9987 | Lost card                       |
| 4000 0000 0000 9979 | Stolen card                     |

### Card Details for All Tests

For all test cards:
- **Expiration Date:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **Postal Code:** Any valid postal code (e.g., 12345)

## Testing Scenarios

### 1. Free Course Enrollment

**Steps:**
1. As admin, create a course without setting a price
2. Log in as a student user
3. Navigate to `/courses`
4. Click on the free course
5. Click "Zapisz się na kurs (Darmowy)"
6. Verify enrollment is created immediately
7. Check that course lessons are now accessible

**Expected Result:**
- User is enrolled without payment
- Course content is immediately accessible
- No payment record is created

---

### 2. Paid Course Purchase (Success)

**Steps:**
1. As admin, create a course and set price to 99.99 PLN
2. Verify in database that `stripe_product_id` and `stripe_price_id` are created
3. Log in as a student user (or use guest account)
4. Navigate to `/courses`
5. Click on the paid course
6. Click "Kup teraz za 99.99 PLN"
7. You'll be redirected to Stripe Checkout
8. Fill in test card: `4242 4242 4242 4242`
9. Fill in email and other details
10. Complete payment

**Expected Result:**
- Redirect to Stripe Checkout page
- After payment, redirect to success page
- User is enrolled in the course
- Payment record created with status "succeeded"
- Course content is accessible
- Payment appears in admin panel under "Płatności"

**To Verify:**
1. Check database `payments` table for new record
2. Check database `course_enrollments` table for enrollment
3. Admin panel → Płatności should show the transaction
4. Stripe Dashboard should show the payment

---

### 3. Payment Declined

**Steps:**
1. Follow steps 1-6 from "Paid Course Purchase"
2. Use test card: `4000 0000 0000 0002` (declined card)
3. Complete checkout

**Expected Result:**
- Payment fails with error message
- User is NOT enrolled
- Payment record created with status "failed"
- User can retry payment

---

### 4. Payment Canceled by User

**Steps:**
1. Follow steps 1-6 from "Paid Course Purchase"
2. On Stripe Checkout page, click "Back" or close the window
3. User is redirected to cancel page

**Expected Result:**
- User returned to course page with cancel message
- No enrollment created
- Payment record remains "pending" or not created
- User can retry purchase

---

### 5. Duplicate Purchase Prevention

**Steps:**
1. Purchase a course successfully (see scenario 2)
2. Try to purchase the same course again
3. Click "Kup teraz" button

**Expected Result:**
- Error message: "Już masz dostęp do tego kursu"
- No new checkout session created
- User is not charged again

---

### 6. Admin Changes Course Price

**Steps:**
1. Create a course with price 49.99 PLN
2. User purchases the course
3. Admin changes price to 79.99 PLN
4. New user tries to purchase

**Expected Result:**
- Original buyer retains access (paid old price)
- New buyer pays new price (79.99 PLN)
- Both enrollments work correctly
- Old Stripe price ID archived, new one created

---

### 7. Webhook Event Handling

**Prerequisites:**
Start Stripe CLI webhook forwarding:

```bash
stripe listen --forward-to localhost:4321/api/payments/webhook
```

**Steps:**
1. Complete a test payment (scenario 2)
2. Watch Stripe CLI output for webhook events
3. Check server logs for webhook processing

**Expected Events:**
- `checkout.session.completed` - Creates enrollment
- `payment_intent.succeeded` - Updates payment status
- Enrollment created automatically
- Payment status updated to "succeeded"

**To Verify:**
```bash
# In Stripe CLI output, look for:
✓ checkout.session.completed [evt_xxx] 
✓ payment_intent.succeeded [evt_xxx]
```

---

### 8. Access Control

**Test Free Course Access:**
1. Create free course with 3 lessons
2. Visit course page (not logged in)
3. Verify lessons are visible

**Test Paid Course Access (No Purchase):**
1. Create paid course with 3 lessons
2. Visit course page (not logged in or as non-enrolled user)
3. Verify lessons are NOT visible
4. Message shown: "Kup kurs, aby uzyskać dostęp"

**Test Paid Course Access (After Purchase):**
1. Purchase paid course
2. Visit course page
3. Verify all lessons are now visible and clickable

---

### 9. Admin Payment Management

**Steps:**
1. Log in as admin
2. Navigate to "Płatności" in sidebar
3. View list of all payments
4. Filter by status (Opłacono, Oczekuje, Niepowodzenie)
5. Export to CSV

**Expected Result:**
- All payments displayed in table
- Filtering works correctly
- CSV export contains all payment data
- Payment details show: date, user, course, amount, status

---

### 10. Multi-Currency Support (Future)

Currently set to PLN. To test other currencies:

1. Update `createCheckoutSession` in `stripe.server.ts`
2. Change `currency` parameter
3. Test with appropriate test cards for that currency

---

## Webhook Testing with Stripe CLI

### Setup

1. **Install Stripe CLI** (if not already installed):

```bash
# Windows (Scoop)
scoop install stripe

# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.com/api/v1/install.sh | bash
```

2. **Login to Stripe CLI:**

```bash
stripe login
```

3. **Start webhook forwarding:**

```bash
stripe listen --forward-to localhost:4321/api/payments/webhook
```

4. **Copy the webhook signing secret** displayed and add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx...
```

### Manual Webhook Testing

You can trigger webhooks manually:

```bash
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed

# Trigger a payment_intent.succeeded event
stripe trigger payment_intent.succeeded
```

---

## Debugging

### Check Stripe Logs

1. Go to Stripe Dashboard → Developers → Logs
2. Filter by event type
3. Check for errors in webhook delivery

### Check Application Logs

Watch your terminal running `npm run dev` for:
- Webhook processing logs
- Payment creation logs
- Enrollment creation logs

### Common Issues

**Issue: Webhook signature verification failed**
- **Solution:** Make sure `STRIPE_WEBHOOK_SECRET` matches the CLI output or Dashboard webhook

**Issue: Payment succeeded but enrollment not created**
- **Check:** Webhook handler logs
- **Check:** Database RLS policies allow insertion
- **Check:** Stripe webhook events are being received

**Issue: "Stripe key not configured"**
- **Solution:** Verify `.env` has correct `STRIPE_SECRET_KEY` and `STRIPE_PUBLIC_KEY`

**Issue: Checkout session creation fails**
- **Check:** Course has `stripe_price_id` set
- **Check:** Stripe price exists in Stripe Dashboard
- **Solution:** Re-save course price in admin panel to regenerate Stripe IDs

---

## Production Testing Checklist

Before going live with real payments:

- [ ] Switch to live Stripe keys (`sk_live_` and `pk_live_`)
- [ ] Configure production webhook URL in Stripe Dashboard
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production secret
- [ ] Test with real card (small amount, then refund)
- [ ] Verify emails are sent (if configured)
- [ ] Check RLS policies are active
- [ ] Monitor first few real transactions closely
- [ ] Have rollback plan ready

---

## Performance Testing

### Load Testing Webhooks

Simulate multiple concurrent webhooks:

```bash
# Send 10 webhook events
for i in {1..10}; do
  stripe trigger checkout.session.completed &
done
```

### Monitor Database

Check for:
- Duplicate enrollments (should not happen)
- Payment status inconsistencies
- Slow queries

---

## Security Testing

### Verify Webhook Signature

1. Try to send webhook without signature
2. Try to send webhook with invalid signature
3. Both should be rejected with 400 error

### Test RLS Policies

1. Try to access another user's payments via API
2. Should be blocked by RLS
3. Only admin should see all payments

---

## Automated Testing (Future Enhancement)

Consider adding:
- Integration tests with Stripe test mode API
- End-to-end tests with Playwright/Cypress
- Unit tests for payment logic
- Mock webhook events for CI/CD

---

## Support

If you encounter issues:

1. Check Stripe Dashboard logs
2. Check application logs
3. Review STRIPE_SETUP.md for configuration
4. Stripe Support: https://support.stripe.com
5. Stripe Testing Docs: https://stripe.com/docs/testing

---

## Quick Reference

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Auth Required: `4000 0025 0000 3155`

**URLs:**
- Courses: `/courses`
- Course Detail: `/courses/{id}`
- Admin Payments: `/admin/payments`
- Stripe Checkout: Auto-redirect
- Success: `/api/payments/success`
- Cancel: `/api/payments/cancel`

**Stripe CLI:**
```bash
stripe listen --forward-to localhost:4321/api/payments/webhook
stripe trigger checkout.session.completed
```
