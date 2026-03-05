import admin from "firebase-admin"

let adminAppInstance: any = null
let initError: Error | null = null

function initAdmin() {
  // Return cached instance if already initialized
  if (adminAppInstance) {
    console.log("[Firebase Admin Init] Using cached instance")
    return adminAppInstance
  }
  if (initError) {
    throw initError
  }

  // If Firebase is already initialized (e.g., by Cloud Functions), just use it
  if (admin.apps.length > 0) {
    console.log("[Firebase Admin Init] Firebase already initialized, using existing app")
    adminAppInstance = admin.app()
    return adminAppInstance
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  let rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ""

  console.log("[Firebase Admin Init] projectId:", projectId)
  console.log("[Firebase Admin Init] clientEmail:", clientEmail)
  console.log("[Firebase Admin Init] rawKey length:", rawKey.length)

  // sanitize: trim, remove surrounding quotes and convert literal \n sequences to actual newlines
  rawKey = rawKey.trim()
  if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1)
  if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1)
  const privateKey = rawKey.replace(/\\n/g, "\n")

  console.log("[Firebase Admin Init] privateKey length after sanitize:", privateKey.length)

  if (!projectId || !clientEmail || !privateKey) {
    initError = new Error(`Missing Firebase Admin env vars: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`)
    throw initError
  }

  try {
    const cert = { projectId, clientEmail, privateKey }
    console.log("[Firebase Admin Init] Creating credential...")
    
    const credential = admin.credential.cert(cert)
    console.log("[Firebase Admin Init] credential created successfully")
    
    adminAppInstance = admin.initializeApp({
      credential,
      projectId,
    })
    console.log("[Firebase Admin Init] initializeApp succeeded, app projectId:", adminAppInstance.options?.projectId)
  } catch (err: any) {
    console.error("[Firebase Admin Init] FAILED:", err)
    initError = err
    throw err
  }

  return adminAppInstance
}

export function getAdminApp() {
  return initAdmin()
}

export function getAdminDb() {
  return getAdminApp().firestore()
}

export function getAdminAuth() {
  return admin.auth(getAdminApp())
}

export function getAdminStorage() {
  return admin.storage(getAdminApp())
}

