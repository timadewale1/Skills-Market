import { sendNotification } from "./sendNotification"
import { sendEmail } from "@/lib/email/sendEmail"
import { getAdminDb } from "@/lib/firebaseAdmin"

function makeEmailTemplate(opts: {title:string;message:string;link?:string;linkText?:string}) {
  const { title, message, link, linkText } = opts
  const safeLink = link ? link.replace(/"/g, '&quot;') : ''
  const linkHtml = link
    ? `<p><a href="${safeLink}" style="display:inline-block;padding:10px 20px;background:#0066cc;color:#fff;text-decoration:none;border-radius:4px;">${linkText||'View details'}</a></p>`
    : ''
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#333;">
      <h2 style="margin-bottom:0.5rem;">${title}</h2>
      <p style="margin-bottom:1rem;">${message}</p>
      ${linkHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      <p style="font-size:0.8rem;color:#666;">This notification was sent by Skills Market platform.</p>
    </div>
  `
}

export async function notifyUser({
  userId,
  type,
  title,
  message,
  link,
  emailSubject,
  emailHtml,
}: any) {

  await sendNotification({
    userId,
    type,
    title,
    message,
    link,
  })

  const adminDb = getAdminDb()
  const user = await adminDb.collection("users").doc(userId).get()

  if (user.exists) {
    const email = user.data()?.email
    if (email) {
      const htmlContent =
        emailHtml || makeEmailTemplate({ title, message, link: link ? `https://skills-market.vercel.app${link}` : undefined })
      await sendEmail({
        to: email,
        subject: emailSubject || title,
        html: htmlContent,
      })
    }
  }
}