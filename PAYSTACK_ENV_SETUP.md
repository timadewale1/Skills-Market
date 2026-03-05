# Environment Variables Setup

## Required for Paystack Integration

Add these environment variables to your **Vercel** project and local `.env.local`:

```bash
# Paystack API Key (Secret)
PAYSTACK_SECRET_KEY=sk_live_xxx_or_sk_test_xxx

# Paystack Webhook Secret (for signature verification)
PAYSTACK_WEBHOOK_SECRET=sk_live_xxx_or_sk_test_xxx

# Paystack Public Key (for client-side initialization)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx_or_pk_test_xxx

# App URL (for Paystack callback)
NEXT_PUBLIC_APP_URL=https://skills-market.vercel.app
```

## Steps to Get Keys

1. **Sign up on Paystack**: https://dashboard.paystack.com/signup
2. **Get Secret Key**:
   - Go to Settings → API Keys & Webhooks
   - Copy your **Secret Key** (starts with `sk_`)
3. **Get Public Key**:
   - Same page, copy **Public Key** (starts with `pk_`)
4. **Get Webhook Secret**:
   - Go to Settings → API Keys & Webhooks
   - Copy **Webhook Secret** (same as Secret Key format)

## Testing vs Live

- **Testing**: Use keys starting with `sk_test_` and `pk_test_`
- **Live**: Use keys starting with `sk_live_` and `pk_live_`

## Local Testing

Create `.env.local` in your project root:

```bash
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=sk_test_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Webhook Configuration

To receive real-time payment confirmations:

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Add webhook URL: `https://yourdomain.com/api/paystack/webhook`
3. Select events: `charge.success`, `charge.failed`
4. Copy the webhook secret and add to `PAYSTACK_WEBHOOK_SECRET`

## Deployment to Vercel

1. Go to your Vercel project settings
2. Add Environment Variables with the keys above
3. Redeploy your project

For webhook testing locally, use **ngrok**: `ngrok http 3000` and add the tunnel URL to Paystack webhooks.
