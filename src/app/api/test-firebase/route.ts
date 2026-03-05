import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== Firebase Diagnostics ===")
    
    // Check env vars
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    
    console.log("Env vars loaded:")
    console.log("- projectId:", projectId ? "✓ (length: " + projectId.length + ")" : "✗ missing")
    console.log("- clientEmail:", clientEmail ? "✓" : "✗ missing")
    console.log("- privateKey:", privateKey ? "✓ (length: " + privateKey.length + ", starts: " + privateKey.substring(0, 50) + ")" : "✗ missing")
    
    // Try to import and initialize
    try {
      const { adminApp, adminDb } = await import("@/lib/firebaseAdmin")
      console.log("Firebase Admin import: ✓")
      console.log("adminApp:", adminApp ? "✓ initialized" : "✗ null")
      console.log("adminDb:", adminDb ? "✓ initialized" : "✗ null")
      
      // Try a simple operation
      const testDoc = await adminDb.doc("test/connection").get()
      console.log("Firestore test read:", testDoc ? "✓" : "✗")
      
      return NextResponse.json({
        status: "ok",
        projectId: projectId ? "loaded" : "missing",
        clientEmail: clientEmail ? "loaded" : "missing", 
        privateKey: privateKey ? `loaded (${privateKey.length} chars)` : "missing",
        firebaseAdmin: "initialized",
      })
    } catch (firebaseErr: any) {
      console.error("Firebase Admin Error:", firebaseErr)
      return NextResponse.json({
        status: "error",
        firebaseError: firebaseErr?.message,
        projectId: projectId ? "loaded" : "missing",
        clientEmail: clientEmail ? "loaded" : "missing",
        privateKey: privateKey ? `loaded (${privateKey.length} chars, starts: ${privateKey.substring(0, 50)})` : "missing",
      }, { status: 500 })
    }
  } catch (e: any) {
    console.error("Diagnostics error:", e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
