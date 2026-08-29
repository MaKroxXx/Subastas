import { siteUrl } from '@/lib/env';

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
}

/**
 * Envia un email con SendGrid. Si no hay clave configurada, registra el
 * mensaje y sigue: las notificaciones nunca deben romper el flujo principal.
 */
export async function sendEmail({ to, subject, text }: EmailPayload): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !from) {
    console.info(`[email] SendGrid no configurado. Email omitido -> ${to}: ${subject}`);
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: 'DealStartups' },
        subject,
        content: [{ type: 'text/plain', value: text }],
      }),
    });

    if (!response.ok) {
      console.error('[email] SendGrid respondio', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] Error enviando email:', error);
    return false;
  }
}

export function newContactEmail(dealTitle: string, dealId: string, visitorName: string, message: string) {
  return {
    subject: `Nueva consulta en tu deal: ${dealTitle}`,
    text: [
      `Alguien esta interesado en tu deal "${dealTitle}".`,
      '',
      `De: ${visitorName}`,
      `Mensaje: ${message}`,
      '',
      `Ver el deal: ${siteUrl()}/deals/${dealId}`,
      `Ver todas las consultas: ${siteUrl()}/dashboard`,
    ].join('\n'),
  };
}

export function dealPublishedEmail(dealTitle: string, dealId: string, bid: number) {
  return {
    subject: `Tu deal ya esta publicado: ${dealTitle}`,
    text: [
      `Tu deal "${dealTitle}" ya esta visible en DealStartups con una puja de ${bid} EUR.`,
      '',
      `Verlo: ${siteUrl()}/deals/${dealId}`,
    ].join('\n'),
  };
}
