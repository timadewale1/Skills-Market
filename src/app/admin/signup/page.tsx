"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

export default function AdminSignup() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  async function signup() {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      role: "admin",
      createdAt: new Date(),
    })
    router.push("/admin/dashboard")
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-[400px] space-y-4">
        <h1 className="text-2xl font-bold">Admin Signup</h1>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full"
        />
        <button
          onClick={signup}
          className="bg-black text-white w-full p-2"
        >
          Create Admin
        </button>
      </div>
    </div>
  )
}