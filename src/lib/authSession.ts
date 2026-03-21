"use client"

import { auth } from "@/lib/firebase"
import {
  browserSessionPersistence,
  setPersistence,
  signOut,
} from "firebase/auth"

export const AUTH_SESSION_DURATION_MS = 3 * 60 * 60 * 1000
export const AUTH_SESSION_STARTED_AT_KEY = "cw_auth_session_started_at"
export const AUTH_SESSION_UID_KEY = "cw_auth_session_uid"

export async function ensureBrowserSessionPersistence() {
  await setPersistence(auth, browserSessionPersistence)
}

export function markAuthSession(uid: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(AUTH_SESSION_STARTED_AT_KEY, String(Date.now()))
  window.sessionStorage.setItem(AUTH_SESSION_UID_KEY, uid)
}

export function getAuthSessionStartedAt() {
  if (typeof window === "undefined") return 0
  return Number(window.sessionStorage.getItem(AUTH_SESSION_STARTED_AT_KEY) || 0)
}

export function isAuthSessionExpired() {
  const startedAt = getAuthSessionStartedAt()
  if (!startedAt) return false
  return Date.now() - startedAt >= AUTH_SESSION_DURATION_MS
}

export function getAuthSessionDismissKey(scope: string) {
  const startedAt = getAuthSessionStartedAt()
  if (!startedAt) return null
  return `${scope}:${startedAt}`
}

export function clearAuthSession() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(AUTH_SESSION_STARTED_AT_KEY)
  window.sessionStorage.removeItem(AUTH_SESSION_UID_KEY)
}

export async function logoutExpiredSession() {
  clearAuthSession()
  window.localStorage.removeItem("sm_role")
  await signOut(auth)
}
