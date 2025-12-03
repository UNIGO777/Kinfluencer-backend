import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST || process.env.EMAIL_HOST
const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587)
const secure = (process.env.SMTP_SECURE || '').toString() === 'true' || port === 465
const user = process.env.SMTP_USER || process.env.EMAIL_USER
const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user && pass ? { user, pass } : undefined,
  logger: process.env.SMTP_DEBUG === 'true',
  debug: process.env.SMTP_DEBUG === 'true',
})

export const verifyEmailTransport = async () => {
  if (!host || !user || !pass) {
    throw new Error('email service not configured')
  }
  try {
    await transporter.verify()
    return true
  } catch (err) {
    throw new Error('email transport verification failed')
  }
}

export const sendEmail = async ({ to, subject, html, from }) => {
  await verifyEmailTransport()
  const mailFrom = from || process.env.EMAIL_FROM || process.env.MAIL_FROM || user
  const info = await transporter.sendMail({ from: mailFrom, to, subject, html })
  return info
}
