# Payment System - Quick Reference

## 🔑 Environment Variables (Required)

```bash
PAYSTACK_SECRET_KEY=sk_test_xxx              # From Paystack
PAYSTACK_WEBHOOK_SECRET=sk_test_xxx          # Same as above
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx  # From Paystack
NEXT_PUBLIC_APP_URL=http://localhost:3000    # Or https://yourdomain.com
```

## 📍 Key Routes

| Route | Purpose | Who | Input | Output |
|-------|---------|-----|-------|--------|
| `POST /api/paystack/initialize` | Fund workspace | Client | `wsId` | `authorizationUrl` |
| `POST /api/paystack/webhook` | Confirm payment | Paystack | Signature | Updates workspace |
| `POST /api/paystack/resolve-bank` | Verify account | Talent | Account # + Code | `recipientCode` |
| `POST /api/paystack/withdraw` | Withdraw funds | Talent | Amount | `withdrawalId` |

## 💰 Flow Diagram

```
┌─────────────┐
│   CLIENT    │
└──────┬──────┘
       │ clicks "Fund workspace"
       ▼
┌──────────────────────────┐
│ /api/paystack/initialize │
│ Creates payment doc      │
└──────┬───────────────────┘
       │ returns authorizationUrl
       ▼
┌────────────────────────┐
│ Paystack Checkout      │◄──── Test card: 4111 1111 1111 1111
│ (Payment processing)   │
└──────┬─────────────────┘
       │ on success
       ▼
┌──────────────────────────┐
│ /api/paystack/webhook    │
│ - Verify signature       │
│ - Update workspace       │
│ - Create wallet + txn    │
└──────┬───────────────────┘
       │ redirect back
       ▼
┌────────────────┐      Status: "funded" ✅
│ Workspace Page │◄─────
└────────────────┘
```

## 👤 Talent Payout Workflow

```
1. Submit Final Work
   ↓
2. Button enabled: "Request payout"
   ↓
3. Client approves within 24h
   ↓
4. Earnings credited to wallet.availableBalance
   ↓
5. Go to Wallet → enter bank details
   ↓
6. Verify & save (Paystack validates)
   ↓
7. From Wallet → Click "Withdraw to bank"
   ↓
8. Transfer initiated (status: "processing")
```

## 🎯 Testing Checklist

- [ ] `.env.local` has all 4 Paystack keys
- [ ] Can visit /dashboard/wallet
- [ ] Client can click "Fund workspace on Paystack"
- [ ] Paystack checkout loads (test card works)
- [ ] Payment succeeds → workspace status "funded"
- [ ] Talent can add bank details → verified
- [ ] Talent can request payout after Final Work
- [ ] Withdrawal works (₦1,000+ minimum)

## 🔍 Debugging

| Error | Fix |
|-------|-----|
| "Missing PAYSTACK_SECRET_KEY" | Add to `.env.local` + restart |
| Webhook not firing | Check URL in Paystack + ngrok for local |
| "Client email required" | Add `clientEmail` field to workspace |
| Bank verify fails | Use legit bank code (044=GTBank, 011=First, 057=Zenith) |
| "Insufficient balance" | Can't withdraw more than `availableBalance` |

## 📚 Doc Links

| Doc | Purpose |
|-----|---------|
| `PAYSTACK_ENV_SETUP.md` | How to get Paystack keys |
| `PAYMENT_TESTING_GUIDE.md` | Full test scenarios |
| `PAYMENT_INTEGRATION_COMPLETE.md` | Technical details |
| `PAYMENT_SYSTEM_README.md` | Overview |

## 🚀 Deploy Checklist

- [ ] All env vars added to Vercel
- [ ] Firestore rules published
- [ ] Cloud Functions deployed
- [ ] Paystack webhook URL configured
- [ ] Test payment works end-to-end
- [ ] Check Cloud Function logs for errors
- [ ] Monitor wallet transactions post-launch

## 💾 Firestore Documents Modified

```
wallets/{uid}                          ← New
wallets/{uid}/transactions/{txId}       ← New
wallets/{uid}/withdrawals/{wdId}        ← New
workspaces/{wsId}/payments/{ref}        ← Already existed, now in use
firestore.rules                         ← Updated with wallet rules
```

## 📞 Paystack Contacts

- **Docs**: https://paystack.com/docs/api/
- **Dashboard**: https://dashboard.paystack.com
- **Test Webhook**: Use ngrok for local: `ngrok http 3000`
- **Status Page**: https://status.paystack.com

---

**TL;DR**: Add env vars → Test on localhost → Deploy → Monitor logs 🚀
