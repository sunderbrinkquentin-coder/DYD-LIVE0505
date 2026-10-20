import { Webhook } from 'npm:svix@1.76.1';

interface ResendEvent {
  type: string;
  data?: { email?: string; to?: string[]; unsubscribed?: boolean };
}

export async function verifyResendWebhook(req: Request, secret: string): Promise<ResendEvent> {
  // Verification must use the original bytes, not parsed/re-serialized JSON.
  return new Webhook(secret).verify(await req.text(), {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }) as ResendEvent;
}

export function unsubscribedEmails(event: ResendEvent): string[] {
  let emails: unknown[] = [];
  if (event.type === 'contact.updated' && event.data?.unsubscribed === true) {
    emails = [event.data.email];
  } else if (['email.bounced', 'email.complained', 'email.suppressed'].includes(event.type)) {
    emails = Array.isArray(event.data?.to) ? event.data.to : [];
  }
  return [...new Set(emails.filter((v): v is string => typeof v === 'string' && v.includes('@'))
    .map(email => email.trim().toLowerCase()))];
}
