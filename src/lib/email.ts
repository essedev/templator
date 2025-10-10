/**
 * Email sending utilities.
 *
 * SETUP INSTRUCTIONS:
 * 1. Installa Resend: pnpm add resend
 * 2. Aggiungi env var: RESEND_API_KEY=re_xxxxx
 * 3. Verifica dominio su Resend dashboard
 * 4. Decommentare codice Resend e commentare mockSendEmail
 */

// ============================================
// OPZIONE 1: MOCK (default - nessuna email inviata)
// ============================================

export interface EmailPayload {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Mock email sender - logga su console invece di inviare.
 * Utile per development e testing senza API key.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  console.log("📧 [MOCK EMAIL] Email NOT sent (mock mode)");
  console.log("📧 To:", payload.to);
  console.log("📧 Subject:", payload.subject);
  console.log("📧 Body:", payload.html.substring(0, 100) + "...");

  // Simula delay di invio
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// ============================================
// OPZIONE 2: RESEND (production ready)
// ============================================

// Decommentare per abilitare Resend:
/*
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not found, email not sent');
    return;
  }

  try {
    await resend.emails.send({
      from: payload.from || 'noreply@yourdomain.com', // Cambia con tuo dominio verificato
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    console.log('✅ Email sent successfully to:', payload.to);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}
*/

// ============================================
// OPZIONE 3: ALTRI PROVIDER
// ============================================

// SendGrid:
// import sgMail from '@sendgrid/mail';
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Postmark:
// import { ServerClient } from 'postmark';
// const client = new ServerClient(process.env.POSTMARK_API_KEY);

// Cloudflare MailChannels (gratis su Workers):
// https://mailchannels.cloudflare.net/

// ============================================
// TEMPLATE HELPERS
// ============================================

/**
 * Template email per notifica contact form all'admin.
 */
export function contactFormEmailTemplate(data: {
  name: string;
  email: string;
  message: string;
}): EmailPayload {
  return {
    to: process.env.ADMIN_EMAIL || "admin@yourdomain.com",
    subject: `Nuovo messaggio da ${data.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nuovo messaggio di contatto</h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Da:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        </div>

        <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <p><strong>Messaggio:</strong></p>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Rispondi direttamente a ${data.email} per contattare l'utente.
        </p>
      </div>
    `,
    text: `
Nuovo messaggio di contatto

Da: ${data.name}
Email: ${data.email}

Messaggio:
${data.message}
    `.trim(),
  };
}

/**
 * Template email di benvenuto per newsletter.
 */
export function newsletterWelcomeEmailTemplate(email: string): EmailPayload {
  return {
    to: email,
    subject: "Benvenuto nella nostra newsletter!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Grazie per esserti iscritto!</h2>
        <p>Riceverai i nostri aggiornamenti direttamente nella tua inbox.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Non vuoi più ricevere email?
          <a href="https://yourdomain.com/unsubscribe?email=${encodeURIComponent(email)}">Disiscrivi</a>
        </p>
      </div>
    `,
    text: "Grazie per esserti iscritto alla newsletter!",
  };
}
