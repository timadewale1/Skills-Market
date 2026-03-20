import nodemailer from "nodemailer"

// create transporter only when needed and verify credentials
function createTransporter() {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS

console.log("EMAIL_USER:", process.env.EMAIL_USER)
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS)

  if (!user || !pass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variable")
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  })
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  let transporter
  try {
    transporter = createTransporter()
  } catch (err: any) {
    console.warn("Skipping email send, credentials not configured:", err.message)
    return
  }

  try {
    await transporter.sendMail({
      from: `"changeworker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error("sendEmail failed:", err)
  }
}
