const PATTERNS = [
  // Emails
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  // URLs
  /https?:\/\/[^\s]+/,
  /www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  // Social shortcuts
  /t\.me\/\S+/i,
  /discord\.gg\/\S+/i,
  /instagram\.com\/\S+/i,
  /telegram\.me\/\S+/i,
  /linkedin\.com\/\S+/i,
  /twitter\.com\/\S+/i,
  /x\.com\/\S+/i,
  /youtube\.com\/\S+/i,
  /tiktok\.com\/\S+/i,
  /snapchat\.com\/\S+/i,
  // @handle pattern (min 2 chars after @, not email — email already caught above)
  /@[a-zA-Z0-9_]{2,}/,
  // Phone numbers (7+ digits with optional spaces/dashes)
  /(\+?[\d][\d\s\-().]{6,}[\d])/,
];

export function containsSocial(text: string): boolean {
  return PATTERNS.some((re) => re.test(text));
}

export const SOCIAL_ERROR =
  "Your bio cannot contain email addresses, social handles, phone numbers, or links. Keep all communication on Crewboard.";
