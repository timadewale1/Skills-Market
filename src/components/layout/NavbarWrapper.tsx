"use client"

import { useAuth } from "@/context/AuthContext"
import Navbar from "./Navbar"
import AuthNavbar from "./AuthNavbar"

export default function NavbarWrapper() {
  const { user } = useAuth()

  return user ? <AuthNavbar /> : <Navbar />
}
