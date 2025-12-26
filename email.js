import nodemailer from "nodemailer";

export function createTransportFromEnv() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendPasswordResetEmail(to, resetLink) {
  const transport = createTransportFromEnv();
  const from = process.env.SMTP_FROM || "no-reply@example.com";

  const subject = "Password Reset Request";
  const html = `
    <p>You requested a password reset.</p>
    <p>Click this link to reset your password:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
  `;

  if (!transport) {
    console.log("Password reset email (dev mode):");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("HTML:", html);
    return;
  }

  await transport.sendMail({ from, to, subject, html });
}

