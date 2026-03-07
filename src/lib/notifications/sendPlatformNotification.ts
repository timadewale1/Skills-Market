import { sendNotification } from "./sendNotification"
import { sendEmail } from "@/lib/email/sendEmail"
import { getAdminDb } from "@/lib/firebaseAdmin"

function makeEmailTemplate(opts: {title:string;message:string;link?:string;linkText?:string}) {
  const { title, message, link, linkText } = opts
  const safeLink = link ? link.replace(/"/g, '&quot;') : ''
  const linkHtml = link ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${safeLink}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); transition: all 0.3s ease;">
        ${linkText||'View Details'}
      </a>
    </div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
            Skills Market
          </h1>
          <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
            Connecting Talent with Opportunity
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
            <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
                ${title}
              </h2>
              <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
            </div>
          </div>

          ${linkHtml}

          <!-- Message bubble for chat-like feel -->
          <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-style: italic; font-size: 14px;">
              💬 <strong>Pro tip:</strong> Check your dashboard regularly to stay connected with your conversations and opportunities.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1e293b; padding: 30px; text-align: center;">
          <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
            This notification was sent by the Skills Market platform
          </p>
          <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              © 2024 Skills Market. All rights reserved.<br>
              <a href="https://changeworker.vercel.app" style="color: #f97316; text-decoration: none;">Visit our platform</a> |
              <a href="mailto:support@changeworker.com" style="color: #f97316; text-decoration: none;">Contact Support</a>
            </p>
          </div>
        </div>
      </div>

      <!-- Unsubscribe notice -->
      <div style="max-width: 600px; margin: 20px auto; text-align: center;">
        <p style="color: #64748b; font-size: 11px; margin: 0;">
          You're receiving this because you're a member of Skills Market.
          <a href="#" style="color: #f97316; text-decoration: underline;">Manage notifications</a>
        </p>
      </div>
    </body>
    </html>
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
        emailHtml || makeEmailTemplate({ title, message, link: link ? `https://changeworker.vercel.app${link}` : undefined })
      try {
        await sendEmail({
          to: email,
          subject: emailSubject || title,
          html: htmlContent,
        })
      } catch (err) {
        console.error("notifyUser: sendEmail error", err)
      }
    }
  }
}