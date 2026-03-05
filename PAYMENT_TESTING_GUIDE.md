# Payment System Testing Guide

## Pre-Flight Checklist

Before testing, ensure:

- [ ] All environment variables set (see `PAYSTACK_ENV_SETUP.md`)
- [ ] Firestore rules published
- [ ] Cloud Functions deployed (`npm run deploy`)
- [ ] Paystack account created (test or live)
- [ ] Webhook configured in Paystack dashboard (for production testing)

---

## Local Testing Setup

### 1. Environment Variables

Create `.env.local`:

```bash
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PAYSTACK_WEBHOOK_SECRET=sk_test_your_key_here  # Same as secret key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Webhook Testing with ngrok

For webhook testing locally:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel (replace with your port)
ngrok http 3000

# Add to Paystack Dashboard:
# Webhook URL: https://your-ngrok-url.ngrok.io/api/paystack/webhook
# Events: charge.success, charge.failed
```

---

## Test Scenarios

### Scenario 1: Client Funds Workspace

**Goal**: Test escrow funding flow

**Steps:**

1. Sign in as **Client**
2. Create or open a workspace
3. Scroll to "Escrow funding" card
4. Click "Fund workspace on Paystack"
5. Verify workspace has `amountAgreed` set
   - This comes from agreement or workspace doc
   - Must be ≥ ₦100

**Test Paystack Payment:**

- Use test card: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 12/30)
- CVC: Any 3 digits (e.g., 123)
- OTP (if prompted): Use any 6 digits

**Expected Results:**

- ✅ Redirected to Paystack checkout
- ✅ Payment succeeds (test environment)
- ✅ Redirected back with `?paid=1`
- ✅ Workspace payment status changes to "funded"
- ✅ Client wallet created with `totalSpent` tally
- ✅ Transaction recorded in `wallets/{clientUid}/transactions`

**Verify in Firebase:**

```javascript
// Check workspace
workspaces/{wsId}
  payment: {
    status: "funded"
    fundedAt: Timestamp
    amount: 5000 (or your test amount)
    escrow: true
  }

// Check wallet
wallets/{clientUid}
  totalSpent: 5000
  role: "client"

// Check transaction
wallets/{clientUid}/transactions/{reference}
  type: "debit"
  reason: "workspace_funding"
  amount: 5000
  status: "completed"
```

---

### Scenario 2: Client Cannot Fund Without Agreement

**Goal**: Prevent funding if no amount specified

**Steps:**

1. Create new workspace with **no agreement** amount
2. Click "Fund workspace on Paystack"

**Expected Result:**

- ❌ Error: "Invalid amountAgreed on workspace"

**Fix:**

- Ensure workspace has `amountAgreed` or `agreement.amountAgreed` field set before funding

---

### Scenario 3: Talent Requests Payout (After Final Work)

**Goal**: Test payout gating with Final Work

**Steps:**

1. Sign in as **Talent**
2. Open funded workspace
3. Submit a milestone (non-hourly) or Final Work
4. Scroll to "Payout requests" card
5. Click "Request payout"

**Before Fix (Should Fail):**

- Button disabled if Final Work not submitted
- Helper text: "Submit final work before requesting payout"

**After Final Work Submitted:**

- Button becomes enabled ✅
- Click → Opens approval dialog

**Expected Results:**

- ✅ Payout request created in `workspaces/{wsId}/payoutRequests`
- ✅ Including `finalWorkId: "submission"`
- ✅ Status: `"requested"`
- ✅ Auto-approval timer: 24 hours

---

### Scenario 4: Talent Adds Bank Details

**Goal**: Test bank account verification

**Steps:**

1. Go to **Wallet** page (tab in dashboard)
2. Scroll to "Bank details" card
3. Enter:
   - Account number: Any 10-digit number (test: `0123456789`)
   - Bank code: Paystack bank code (test: `044` for GTBank)
4. Click "Verify & save"

**Expected Results:**

- ✅ Paystack resolves account (test account returns valid name)
- ✅ Recipient created and verified
- ✅ Bank details displayed with green "Verified" badge
- ✅ Account saved to `wallets/{talentUid}.bank`

**Paystack Test Banks:**

- GTBank: `044`
- First Bank: `011`
- Zenith Bank: `057`

---

### Scenario 5: Talent Withdraws Earnings

**Goal**: Test withdrawal flow

**Prerequisites:**

- ✅ Bank details verified
- ✅ Talent has available balance (mock: manually add to Firestore for testing)
- ✅ Minimum ₦1,000

**Steps:**

1. Go to **Wallet**
2. Scroll to "Withdraw" card
3. Enter amount: ₦1,500 (or test amount)
4. Click "Withdraw to bank"

**Expected Results:**

- ✅ `availableBalance` decreases by ₦1,500
- ✅ `pendingBalance` increases by ₦1,500
- ✅ Withdrawal doc created in `wallets/{uid}/withdrawals/{id}`
- ✅ Status: `"processing"`
- ✅ Paystack transfer initiated
- ✅ Transaction recorded as "withdrawal" debit

**Verify in Firebase:**

```javascript
wallets/{talentUid}
  availableBalance: previous - 1500
  pendingBalance: previous + 1500

wallets/{talentUid}/withdrawals/{withdrawalId}
  amount: 1500
  status: "processing"
  paystack: {
    transferCode: "TRF_xxx"
    reference: "wd_xxx"
  }
```

---

### Scenario 6: Test Error Handling

#### A) Insufficient Balance

**Steps:**

1. Try to withdraw ₦100,000 with ₦10,000 available
2. Expected: "Insufficient balance" error

#### B) No Bank Details

**Steps:**

1. Try to withdraw without verified bank account
2. Expected: "Add & verify bank details first" message
3. Button disabled ❌

#### C) Minimum Withdrawal

**Steps:**

1. Enter ₦500 (below ₦1,000 minimum)
2. Click withdraw
3. Expected: "Minimum withdrawal is ₦1,000" error

#### D) Webhook Signature Mismatch

**Steps:**

1. Manually POST to `/api/paystack/webhook` with wrong signature
2. Expected: 401 "Invalid signature"

---

## Debugging Checklist

| Issue | Solution |
|-------|----------|
| "Missing PAYSTACK_SECRET_KEY" | Add env var to `.env.local` + restart dev server |
| Webhook not firing | Check Paystack webhook URL + sign secret in dashboard |
| Payment status not updating | Check webhook logs + Firebase transaction |
| "Client email required" | Add `clientEmail` to workspace doc |
| Withdrawal fails silently | Check Cloud Function logs |
| "wallets/{uid} not found" | Wallet created on first transaction; do a test payment first |

---

## Manual Testing via Firestore

If UI isn't ready, manually test data flow:

```javascript
// 1. Create payment on workspace
workspaces/{wsId}/payments/{reference}
  reference: "ws_xxx_123_abc"
  amount: 5000
  status: "initiated"

// 2. Simulate webhook by updating to "funded"
// (In production, Paystack webhook does this)
workspaces/{wsId}
  payment.status = "funded"

// 3. Simulate wallet creation
wallets/{clientUid}
  uid: "client123"
  role: "client"
  totalSpent: 5000
  createdAt: now

// 4. Simulate transaction
wallets/{clientUid}/transactions/{reference}
  type: "debit"
  reason: "workspace_funding"
  amount: 5000
  status: "completed"
```

---

## Performance Metrics

Expected response times:

| Operation | Time |
|-----------|------|
| Initialize payment | 200-300ms |
| Paystack redirect | Instant |
| Webhook processing | < 500ms |
| Bank verification | 1-2s |
| Withdraw initiation | 1-2s |

---

## Rollback Plan

If issues occur:

1. **Revert Paystack integration**: Replace `startPaystackFunding` with placeholder
2. **Disable withdrawals**: Set `PAYSTACK_SECRET_KEY` to empty
3. **Fix and redeploy**: Apply fixes + `npm run deploy`

---

## Next Steps (Post-Testing)

- [ ] Add Paystack live keys to Vercel
- [ ] Configure production webhook URL
- [ ] Set up Paystack alerts for failed transfers  
- [ ] Monitor Cloud Function logs
- [ ] Deploy to production
- [ ] Send payment instructions to early users

