"use client"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db, auth } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, orderBy, getDoc, setDoc } from "firebase/firestore"
import toast from "react-hot-toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wallet, Landmark, ArrowDownToLine, Edit2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type WalletDoc = {
  uid: string
  role: "talent" | "client"
  availableBalance?: number
  pendingBalance?: number
  totalEarned?: number
  totalWithdrawn?: number
  totalSpent?: number
  bank?: {
    accountNumber: string
    bankCode: string
    bankName: string
    accountName: string
    recipientCode: string
  }
}

type Tx = {
  id: string
  type: "credit" | "debit"
  reason: string
  amount: number
  status: string
  createdAt?: any
  meta?: any
}

function money(n?: number) {
  const v = Number(n || 0)
  return v.toLocaleString("en-NG", { style: "currency", currency: "NGN" })
}

export default function WalletPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<WalletDoc | null>(null)
  const [txs, setTxs] = useState<Tx[]>([])

  const [banks, setBanks] = useState<Array<{ name: string; code: string; slug: string }>>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState<{ name: string; code: string; slug: string } | null>(null)
  const [bankSearch, setBankSearch] = useState("")

  const [accountNumber, setAccountNumber] = useState("")
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawing, setWithdrawing] = useState(false)

  const isTalent = wallet?.role === "talent"
  const isClient = wallet?.role === "client"
  const clientEscrowFunded = txs
    .filter((tx) => tx.reason === "workspace_funding" && tx.status === "completed")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  const filteredBanks = banks.filter((bank) => {
    const query = bankSearch.trim().toLowerCase()
    if (!query) return true
    return `${bank.name} ${bank.code}`.toLowerCase().includes(query)
  })

  useEffect(() => {
    ;(async () => {
      try {
        setBanksLoading(true)
        const resp = await fetch("/api/paystack/banks")
        if (!resp.ok) throw new Error("Failed to fetch banks")
        const data = await resp.json()

        const seen = new Set<string>()
        const uniqueBanks = (data.banks || []).filter((bank: any) => {
          if (seen.has(bank.code)) return false
          seen.add(bank.code)
          return true
        })
        setBanks(uniqueBanks)
      } catch (error) {
        console.error("Failed to fetch banks:", error)
        toast.error("Failed to load bank list")
      } finally {
        setBanksLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!user?.uid) return

    ;(async () => {
      try {
        const ref = doc(db, "wallets", user.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)
          const role = ((userSnap.data() as any)?.role as "talent" | "client") || "talent"
          await setDoc(
            ref,
            {
              uid: user.uid,
              role,
              availableBalance: 0,
              pendingBalance: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
              totalSpent: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            { merge: true }
          )
        }
      } catch (error) {
        console.error("wallet init failed", error)
      }
    })()

    const unsubWallet = onSnapshot(doc(db, "wallets", user.uid), (snap) => {
      setWallet(snap.exists() ? (snap.data() as WalletDoc) : null)
    })

    const unsubTx = onSnapshot(
      query(collection(db, "wallets", user.uid, "transactions"), orderBy("createdAt", "desc")),
      (snap) => setTxs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    )

    return () => {
      unsubWallet()
      unsubTx()
    }
  }, [user?.uid])

  const tokenGetter = useMemo(
    () => async () => {
      const current = auth.currentUser
      if (!current) throw new Error("Not signed in")
      return current.getIdToken()
    },
    []
  )

  const verifyBank = async () => {
    if (!selectedBank) return toast.error("Select a bank")
    if (!accountNumber || accountNumber.length !== 10) {
      return toast.error("Enter a valid 10-digit account number")
    }

    setVerifying(true)
    try {
      const token = await tokenGetter()
      const resp = await fetch("/api/paystack/resolve-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountNumber, bankCode: selectedBank.code }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || "Verification failed")
      setResolvedAccountName(json.accountName)
      toast.success(`Verified: ${json.accountName}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to verify")
    } finally {
      setVerifying(false)
    }
  }

  const saveBank = async () => {
    if (!selectedBank || !accountNumber || !resolvedAccountName) {
      return toast.error("Verify account first")
    }

    setSaving(true)
    try {
      const token = await tokenGetter()
      const resp = await fetch("/api/paystack/create-recipient", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBank.code,
          accountName: resolvedAccountName,
          bankName: selectedBank.name,
        }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || "Save failed")
      toast.success("Bank details saved")
      setAccountNumber("")
      setSelectedBank(null)
      setBankSearch("")
      setResolvedAccountName(null)
      setEditMode(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = () => {
    setEditMode(true)
    if (wallet?.bank) {
      setAccountNumber(wallet.bank.accountNumber)
      const matchBank = banks.find((bank) => bank.code === wallet.bank?.bankCode)
      setSelectedBank(matchBank || null)
      setBankSearch("")
      setResolvedAccountName(wallet.bank.accountName || null)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setAccountNumber("")
    setSelectedBank(null)
    setBankSearch("")
    setResolvedAccountName(null)
  }

  const withdraw = async () => {
    const amount = Number(withdrawAmount || 0)
    if (!amount || amount < 1000) return toast.error("Minimum withdrawal is ₦1,000")

    setWithdrawing(true)
    try {
      const token = await tokenGetter()
      const resp = await fetch("/api/paystack/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || "Withdrawal failed")
      toast.success("Withdrawal initiated")
      setWithdrawAmount("")
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to withdraw")
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base font-extrabold">
                <Wallet className="h-5 w-5 text-[var(--primary)]" />
                Wallet
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              {!wallet ? (
                <div className="text-gray-600">
                  No wallet yet. It will be created automatically after your first payment or earning.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {isTalent ? (
                    <>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="font-semibold text-gray-600">Available</div>
                        <div className="text-xl font-extrabold">{money(wallet.availableBalance)}</div>
                        <div className="mt-1 text-xs font-semibold text-gray-500">Withdrawable balance</div>
                      </div>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="font-semibold text-gray-600">Pending</div>
                        <div className="text-xl font-extrabold">{money(wallet.pendingBalance)}</div>
                        <div className="mt-1 text-xs font-semibold text-gray-500">Transfers in progress</div>
                      </div>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="font-semibold text-gray-600">Total earned</div>
                        <div className="text-xl font-extrabold">{money(wallet.totalEarned)}</div>
                        <div className="mt-1 text-xs font-semibold text-gray-500">After platform fee deductions</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border bg-white p-4 md:col-span-2">
                        <div className="font-semibold text-gray-600">Total funded</div>
                        <div className="text-2xl font-extrabold">{money(wallet.totalSpent || clientEscrowFunded)}</div>
                        <div className="mt-1 text-xs font-semibold text-gray-500">Confirmed workspace funding history</div>
                      </div>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="font-semibold text-gray-600">Escrow funded</div>
                        <div className="text-xl font-extrabold">{money(clientEscrowFunded)}</div>
                        <div className="mt-1 text-xs font-semibold text-gray-500">Funding transaction volume</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {wallet ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="inline-flex w-full items-center justify-between gap-2 text-base font-extrabold">
                    <span className="inline-flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-[var(--primary)]" />
                      Bank details
                    </span>
                    {wallet.bank?.recipientCode && !editMode ? (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:opacity-70"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {wallet.bank?.recipientCode && !editMode ? (
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-extrabold">{wallet.bank.accountName}</div>
                      <div className="mt-1 text-gray-600">
                        {wallet.bank.accountNumber} • {wallet.bank.bankName}
                      </div>
                      <Badge className="mt-2 rounded-full border border-green-200 bg-green-100 text-green-900">
                        Verified on Paystack
                      </Badge>
                      <div className="mt-2 text-xs font-semibold text-gray-500">
                        {isTalent
                          ? "Withdrawals will go to this account."
                          : "Refunds or future settlement support can use this account."}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-2xl border bg-white p-4">
                      <div className="text-xs font-semibold text-gray-500">
                        {isTalent
                          ? "Select your bank and account. We'll verify it via Paystack for withdrawals."
                          : "Add a bank account for refund and settlement support. We'll verify it via Paystack."}
                      </div>

                      {banksLoading ? (
                        <div className="rounded-2xl border px-3 py-2 text-sm text-gray-600">Loading banks...</div>
                      ) : banks.length === 0 ? (
                        <div className="rounded-2xl border px-3 py-2 text-sm text-gray-600">
                          Failed to load banks. Please refresh.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            placeholder="Search bank..."
                            className="rounded-2xl"
                          />
                          <Select
                            value={selectedBank?.code || ""}
                            onValueChange={(value) => {
                              const bank = banks.find((item) => item.code === value) || null
                              setSelectedBank(bank)
                            }}
                          >
                            <SelectTrigger className="rounded-2xl bg-white">
                              <SelectValue placeholder="Select bank..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {filteredBanks.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-600">No banks match your search.</div>
                              ) : (
                                filteredBanks.map((bank, idx) => (
                                  <SelectItem key={`${bank.code}-${idx}`} value={bank.code}>
                                    {bank.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="Account number (10 digits)"
                        className="rounded-2xl"
                        maxLength={10}
                      />

                      <button
                        type="button"
                        onClick={verifyBank}
                        disabled={verifying || !selectedBank || accountNumber.length !== 10}
                        className="w-full rounded-2xl bg-[var(--primary)] py-2 font-extrabold text-white disabled:opacity-60"
                      >
                        {verifying ? "Verifying..." : resolvedAccountName ? "Verified ✓" : "Verify account"}
                      </button>

                      {resolvedAccountName ? (
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-3">
                          <div className="text-xs font-semibold text-green-700">Verified account name</div>
                          <div className="mt-1 font-extrabold text-green-900">{resolvedAccountName}</div>
                        </div>
                      ) : null}

                      {resolvedAccountName ? (
                        <button
                          type="button"
                          onClick={saveBank}
                          disabled={saving}
                          className="w-full rounded-2xl bg-green-600 py-2 font-extrabold text-white disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save & create transfer recipient"}
                        </button>
                      ) : null}

                      {editMode ? (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="w-full rounded-2xl border border-gray-300 py-2 font-extrabold text-gray-700"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              {isTalent ? (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="inline-flex items-center gap-2 text-base font-extrabold">
                      <ArrowDownToLine className="h-5 w-5 text-[var(--primary)]" />
                      Withdraw
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="text-xs font-semibold text-gray-500">Minimum withdrawal is ₦1,000.</div>
                    <Input
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount (₦)"
                      className="rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={withdraw}
                      disabled={withdrawing || !wallet.bank?.recipientCode || (wallet.availableBalance || 0) < 1000}
                      className="w-full rounded-2xl bg-[var(--primary)] py-2 font-extrabold text-white disabled:opacity-60"
                    >
                      {withdrawing ? "Processing..." : "Withdraw to bank"}
                    </button>
                    {!wallet.bank?.recipientCode ? (
                      <div className="text-xs font-semibold text-orange-700">
                        Add and verify your bank details first.
                      </div>
                    ) : null}
                    {wallet.bank?.recipientCode && (wallet.availableBalance || 0) < 1000 ? (
                      <div className="text-xs font-semibold text-orange-700">
                        Your available balance is {money(wallet.availableBalance)}. Minimum is ₦1,000 to withdraw.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="inline-flex items-center gap-2 text-base font-extrabold">
                      <Wallet className="h-5 w-5 text-[var(--primary)]" />
                      Funding overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-semibold text-gray-600">Funding transactions</div>
                      <div className="text-xl font-extrabold">
                        {txs.filter((tx) => tx.reason === "workspace_funding").length}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-gray-500">
                        Workspace funding records captured so far
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-semibold text-gray-600">Bank setup</div>
                      <div className="text-base font-extrabold">
                        {wallet.bank?.recipientCode ? "Ready" : "Not added yet"}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-gray-500">
                        Keep a verified bank account on file for account support.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {txs.length === 0 ? (
                <div className="text-gray-600">No transactions yet.</div>
              ) : (
                txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-extrabold">{tx.reason}</div>
                      <div className="text-xs font-semibold text-gray-500">{tx.id}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-extrabold ${tx.type === "credit" ? "text-green-700" : "text-gray-900"}`}>
                        {tx.type === "credit" ? "+" : "-"} {money(tx.amount)}
                      </div>
                      <Badge className="rounded-full border bg-gray-100 text-gray-700">{tx.status}</Badge>
                    </div>
                  </div>
                ))
              )}
              <Separator />
              <div className="text-xs font-semibold text-gray-500">
                Note: Client payments are held in escrow for safety and released through the payout flow.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  )
}
