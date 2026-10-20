// Compatibility shim for older function imports. All operations use Resend.
// New code imports ./resend.ts directly; no Brevo credentials or requests remain.
export { sendMail, upsertContact, updateContactAttributes, unsubscribeContact, deleteContact } from './resend.ts';
