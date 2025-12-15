import nodemailer from "nodemailer";
import { getWelcomeSetupEmailTemplate } from "./email-templates/welcome-setup";
import { getPasswordResetLinkEmailTemplate } from "./email-templates/password-reset-link";
import { getBackupEmailTemplate } from "./email-templates/backup";

// Configurazione transporter Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: 587,
  secure: false, // true per port 465, false per altri
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // App Password di Gmail
  },
});

// Verifica connessione (opzionale, utile per debug)
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Server email pronto per l'invio");
    return true;
  } catch (error) {
    console.error("❌ Errore connessione email:", error);
    return false;
  }
}

// Funzione generica per inviare notifiche
export async function sendNotificationEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
    text: textContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email notifica inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email notifica:", error);
    throw error;
  }
}

// Template email per nuovo account - Link setup password
export async function sendWelcomeSetupEmail(
  to: string,
  username: string,
  setupUrl: string
) {
  const { html, text } = getWelcomeSetupEmailTemplate(username, setupUrl, to);

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Benvenuto su Time Tracker - Configura il tuo account",
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email benvenuto con setup link inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email benvenuto:", error);
    throw error;
  }
}

// Template email per reset password con link
export async function sendPasswordResetLinkEmail(
  to: string,
  username: string,
  resetUrl: string,
  validityDuration: string = "1 ora"
) {
  const { html, text } = getPasswordResetLinkEmailTemplate(
    username,
    resetUrl,
    validityDuration
  );

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Reimposta la tua password - Time Tracker",
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email reset password link inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email reset link:", error);
    throw error;
  }
}

// Invia email di backup
export async function sendBackupEmail(
  to: string,
  success: boolean,
  filename?: string,
  filePath?: string,
  errorMessage?: string
) {
  const subject = success
    ? `✅ Backup Database Completato: ${filename}`
    : `❌ Errore Backup Database`;

  const { html } = getBackupEmailTemplate(success, filename, errorMessage);

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  if (success && filePath && filename) {
    mailOptions.attachments = [
      {
        filename: filename,
        path: filePath,
      },
    ];
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email backup inviata a ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Errore invio email backup:", error);
    return false;
  }
}

