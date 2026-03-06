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
        meta: opts.meta || {},
      })
    } catch (err) {
      console.error("notifyAdmins error for", uid, err)
    }
  }
}
