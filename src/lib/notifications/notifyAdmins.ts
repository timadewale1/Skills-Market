import { getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "./sendPlatformNotification"

interface NotifyOptions {
  type: string
  title: string
  message: string
  link?: string
  emailSubject?: string
  emailHtml?: string
  meta?: any
}

function shouldEmailAdmin(type: string) {
  const value = String(type || "").toLowerCase()
  return value.includes("dispute") || value.includes("payment") || value.includes("withdraw") || value.includes("verification")
}

export async function notifyAdmins(opts: NotifyOptions) {
  const adminDb = getAdminDb()
  const adminSnap = await adminDb.collection("users").where("role", "==", "admin").get()
  const admins: string[] = []
  adminSnap.forEach((doc: any) => {
    if (doc.exists) {
      const data = doc.data()
      if (data?.email) admins.push(doc.id)
    }
  })

  // send notification/email to each admin
  const sendEmail = shouldEmailAdmin(opts.type)
  for (const uid of admins) {
    try {
      await notifyUser({
        userId: uid,
        type: opts.type,
        title: opts.title,
        message: opts.message,
        link: opts.link,
        emailSubject: opts.emailSubject,
        emailHtml: opts.emailHtml,
        sendEmail,
        meta: opts.meta || {},
      })
    } catch (err) {
      console.error("notifyAdmins error for", uid, err)
    }
  }
}
