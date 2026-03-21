function resolveLink(link?: string) {
  if (!link) return undefined
  return link.startsWith("http") ? link : `https://changeworker.vercel.app${link}`
}

export function buildNotificationEmail({
  title,
  message,
  link,
  linkText,
}: {
  title: string
  message: string
  link?: string
  linkText?: string
}) {
  const href = resolveLink(link)

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:24px;background:#fff7ed;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #fed7aa;border-radius:24px;overflow:hidden;box-shadow:0 18px 40px rgba(249,115,22,0.12);">
        <div style="padding:28px;background:linear-gradient(135deg,#fff7ed 0%,#ffffff 70%);border-bottom:1px solid #ffedd5;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="height:54px;width:54px;border-radius:18px;background:#fff7ed;border:1px solid #fdba74;display:flex;align-items:center;justify-content:center;">
              <img src="https://changeworker.vercel.app/logo.png" alt="changeworker" style="height:30px;width:30px;object-fit:contain;" />
            </div>
            <div>
              <div style="font-size:22px;font-weight:800;color:#111827;">changeworker</div>
              <div style="font-size:13px;color:#9a3412;font-weight:600;">Platform notification</div>
            </div>
          </div>
        </div>
        <div style="padding:30px 28px;">
          <div style="font-size:26px;line-height:1.2;font-weight:800;color:#111827;">${title}</div>
          <div style="margin-top:18px;padding:20px 22px;border-radius:20px;background:#fff7ed;border:1px solid #fdba74;font-size:16px;line-height:1.7;color:#374151;">
            ${message}
          </div>
          ${
            href
              ? `<div style="margin-top:28px;"><a href="${href}" style="display:inline-block;padding:14px 22px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;">${linkText || "Open in changeworker"}</a></div>`
              : ""
          }
        </div>
        <div style="padding:20px 28px;background:#111827;color:#cbd5e1;font-size:12px;line-height:1.7;">
          This notification was sent from changeworker. Open your dashboard to view the latest activity and linked records.
        </div>
      </div>
    </body>
  </html>
  `
}
