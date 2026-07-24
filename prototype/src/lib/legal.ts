/**
 * Versioned legal documents + consent checkbox copy for the apply form.
 * Keep documentVersion in sync with the headers in src/content/legal/*.md
 */

export const TERMS_VERSION = 'tc-2026-07-v1';
export const PRIVACY_VERSION = 'privacy-2026-07-v1';
/** Combined version string stored on the merged Terms + Privacy consent. */
export const TERMS_AND_PRIVACY_VERSION = `${TERMS_VERSION}+${PRIVACY_VERSION}`;

export const TERMS_AND_PRIVACY_CONSENT_TEXT =
  'I agree to the Terms & Conditions and Privacy Policy, and consent to processing of my '
  + 'personal data as described there. I can withdraw this consent anytime.';

export const WHATSAPP_SERVICE_CONSENT_TEXT =
  'I consent to receive game-related WhatsApp messages (reminders, confirmations, announcements).';
