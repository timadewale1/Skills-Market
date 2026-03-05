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
import { Wallet, Landmark, ArrowDownToLine, Check, ChevronsUpDown, Edit2 } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

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

  // bank setup
  const [banks, setBanks] = useState<Array<{ name: string; code: string; slug: string }>>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState<{ name: string; code: string; slug: string } | null>(
    null
  )

  const [accountNumber, setAccountNumber] = useState("")
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // withdraw
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawing, setWithdrawing] = useState(false)

  const isTalent = wallet?.role === "talent"
  const isClient = wallet?.role === "client"

  useEffect(() => {
    // Fetch banks on mount
    ;(async () => {
      try {
        setBanksLoading(true)
        const resp = await fetch("/api/paystack/banks")
        if (!resp.ok) throw new Error("Failed to fetch banks")
        const data = await resp.json()
        
        // Deduplicate banks by code
        const seen = new Set<string>()
        const uniqueBanks = (data.banks || []).filter((b: any) => {
          if (seen.has(b.code)) return false
          seen.add(b.code)
          return true
        })
        setBanks(uniqueBanks)
      } catch (e: any) {
        console.error("Failed to fetch banks:", e)
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
          const uSnap = await getDoc(userRef)
          const role = ((uSnap.data() as any)?.role as any) || "talent"
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
      } catch (e: any) {
        console.error("wallet init failed", e)
      }
    })()

    const unsubWallet = onSnapshot(doc(db, "wallets", user.uid), (snap) => {
      setWallet(snap.exists() ? (snap.data() as any) : null)
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
      const u = auth.currentUser
      if (!u) throw new Error("Not signed in")
      return await u.getIdToken()
    },
    []
  )

  const verifyBank = async () => {
    if (!selectedBank) return toast.error("Select a bank")
    if (!accountNumber || accountNumber.length !== 10) return toast.error("Enter a valid 10-digit account number")

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
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to verify")
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
      toast.success("Bank details saved!")
      setAccountNumber("")
      setSelectedBank(null)
      setResolvedAccountName(null)
      setEditMode(false)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = () => {
    setEditMode(true)
    if (wallet?.bank) {
      setAccountNumber(wallet.bank.accountNumber)
      const matchBank = banks.find((b) => b.code === wallet.bank?.bankCode)
      setSelectedBank(matchBank || null)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setAccountNumber("")
    setSelectedBank(null)
    setResolvedAccountName(null)
  }

  const withdraw = async () => {
    const amt = Number(withdrawAmount || 0)
    if (!amt || amt < 1000) return toast.error("Minimum withdrawal is ₦1,000")
    setWithdrawing(true)
    try {
      const token = await tokenGetter()
      const resp = await fetch("/api/paystack/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || "Withdrawal failed")
      toast.success("Withdrawal initiated")
      setWithdrawAmount("")
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to withdraw")
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-extrabold inline-flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[var(--primary)]" />
                Wallet
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              {!wallet ? (
                <div className="text-gray-600">No wallet yet. It will be created automatically after your first payment/earning.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {isTalent ? (
                    <>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="text-gray-600 font-semibold">Available</div>
                        <div className="text-xl font-extrabold">{money(wallet.availableBalance)}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">Withdrawable</div>
                      </div>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="text-gray-600 font-semibold">Pending</div>
                        <div className="text-xl font-extrabold">{money(wallet.pendingBalance)}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">Transfers processing</div>
                      </div>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="text-gray-600 font-semibold">Total earned</div>
                        <div className="text-xl font-extrabold">{money(wallet.totalEarned)}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">After platform fees</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border bg-white p-4 md:col-span-2">
                        <div className="text-gray-600 font-semibold">Total spent</div>
                        <div className="text-2xl font-extrabold">{money(wallet.totalSpent)}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">Workspace funding history below</div>
                      </div>
                      <div className="rounded-2xl border bg-white p-4">
                        <div className="text-gray-600 font-semibold">Role</div>
                        <div className="text-xl font-extrabold">Client</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {wallet && isTalent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank details */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold inline-flex items-center gap-2 justify-between w-full">
                    <span className="inline-flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-[var(--primary)]" />
                      Bank details
                    </span>
                    {wallet.bank?.recipientCode && !editMode && (
                      <button
                        onClick={startEdit}
                        className="text-xs font-semibold text-[var(--primary)] inline-flex items-center gap-1 hover:opacity-70"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {wallet.bank?.recipientCode && !editMode ? (
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-extrabold">{wallet.bank.accountName}</div>
                      <div className="text-gray-600 mt-1">
                        {wallet.bank.accountNumber} • {wallet.bank.bankName}
                      </div>
                      <Badge className="mt-2 rounded-full bg-green-100 text-green-900 border border-green-200">
                        Verified on Paystack
                      </Badge>
                      <div className="text-xs text-gray-500 font-semibold mt-2">
                        Withdrawals will go to this account.
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border bg-white p-4 space-y-3">
                      <div className="text-xs text-gray-500 font-semibold">
                        Select your bank and account. We'll verify via Paystack.
                      </div>

                      {/* Bank dropdown */}
                      <Popover open={bankOpen} onOpenChange={setBankOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full rounded-2xl border px-3 py-2 text-sm text-left font-medium flex items-center justify-between",
                              selectedBank ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-gray-300"
                            )}
                          >
                            <span>{selectedBank?.name || "Select bank..."}</span>
                            <ChevronsUpDown className="w-4 h-4 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search banks..." />
                            <CommandEmpty>No banks found.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {banks.map((bank, idx) => (
                                  <CommandItem
                                    key={`${bank.code}-${idx}`}
                                    value={bank.code}
                                    onSelect={() => {
                                      setSelectedBank(bank)
                                      setBankOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedBank?.code === bank.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {bank.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Account number input */}
                      <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="Account number (10 digits)"
                        className="rounded-2xl"
                        maxLength={10}
                      />

                      {/* Verify button */}
                      <button
                        onClick={verifyBank}
                        disabled={verifying || !selectedBank || !accountNumber || accountNumber.length !== 10}
                        className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 disabled:opacity-60"
                      >
                        {verifying ? "Verifying…" : resolvedAccountName ? "Verified ✓" : "Verify account"}
                      </button>

                      {/* Resolved account display */}
                      {resolvedAccountName && (
                        <div className="rounded-2xl bg-green-50 border border-green-200 p-3">
                          <div className="text-xs text-green-700 font-semibold">Verified account name</div>
                          <div className="font-extrabold text-green-900 mt-1">{resolvedAccountName}</div>
                        </div>
                      )}

                      {/* Save button */}
                      {resolvedAccountName && (
                        <button
                          onClick={saveBank}
                          disabled={saving}
                          className="w-full rounded-2xl bg-green-600 text-white font-extrabold py-2 disabled:opacity-60"
                        >
                          {saving ? "Saving…" : "Save & create transfer recipient"}
                        </button>
                      )}

                      {editMode && (
                        <button
                          onClick={cancelEdit}
                          className="w-full rounded-2xl border border-gray-300 text-gray-700 font-extrabold py-2"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Withdraw */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold inline-flex items-center gap-2">
                    <ArrowDownToLine className="w-5 h-5 text-[var(--primary)]" />
                    Withdraw
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="text-xs text-gray-500 font-semibold">
                    Minimum withdrawal is ₦1,000.
                  </div>
                  <Input
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Amount (₦)"
                    className="rounded-2xl"
                  />
                  <button
                    onClick={withdraw}
                    disabled={
                      withdrawing ||
                      !wallet.bank?.recipientCode ||
                      (wallet.availableBalance || 0) < 1000
                    }
                    className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 disabled:opacity-60"
                  >
                    {withdrawing ? "Processing…" : "Withdraw to bank"}
                  </button>
                  {!wallet.bank?.recipientCode && (
                    <div className="text-xs text-orange-700 font-semibold">
                      Add & verify your bank details first.
                    </div>
                  )}
                  {wallet.bank?.recipientCode && (wallet.availableBalance || 0) < 1000 && (
                    <div className="text-xs text-orange-700 font-semibold">
                      Your available balance is {money(wallet.availableBalance)}. Minimum is ₦1,000 to withdraw.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* History */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {txs.length === 0 ? (
                <div className="text-gray-600">No transactions yet.</div>
              ) : (
                txs.map((t) => (
                  <div key={t.id} className="rounded-2xl border bg-white p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">{t.reason}</div>
                      <div className="text-xs text-gray-500 font-semibold">{t.id}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-extrabold ${t.type === "credit" ? "text-green-700" : "text-gray-900"}`}>
                        {t.type === "credit" ? "+" : "-"} {money(t.amount)}
                      </div>
                      <Badge className="rounded-full bg-gray-100 border text-gray-700">{t.status}</Badge>
                    </div>
                  </div>
                ))
              )}
              <Separator />
              <div className="text-xs text-gray-500 font-semibold">
                Note: Client payments are held in escrow for safety and released through the payout flow.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  )
}
