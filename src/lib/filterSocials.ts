const PATTERNS = [
  // Emails
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  // Any URL (http/https or bare www.)
  /https?:\/\/[^\s]+/,
  /www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  // Social & messaging platforms (with or without path)
  /t\.me(\/\S*)?/i,
  /discord\.gg(\/\S*)?/i,
  /discord\.com(\/\S*)?/i,
  /instagram\.com(\/\S*)?/i,
  /telegram\.me(\/\S*)?/i,
  /linkedin\.com(\/\S*)?/i,
  /twitter\.com(\/\S*)?/i,
  /x\.com(\/\S*)?/i,
  /youtube\.com(\/\S*)?/i,
  /youtu\.be(\/\S*)?/i,
  /tiktok\.com(\/\S*)?/i,
  /snapchat\.com(\/\S*)?/i,
  /facebook\.com(\/\S*)?/i,
  /fb\.com(\/\S*)?/i,
  /wa\.me(\/\S*)?/i,
  /whatsapp\.com(\/\S*)?/i,
  /github\.com(\/\S*)?/i,
  /twitch\.tv(\/\S*)?/i,
  /reddit\.com(\/\S*)?/i,
  /warpcast\.com(\/\S*)?/i,
  /farcaster\.xyz(\/\S*)?/i,
  /lens\.xyz(\/\S*)?/i,
  /mirror\.xyz(\/\S*)?/i,
  /substack\.com(\/\S*)?/i,
  /medium\.com(\/\S*)?/i,
  /linktr\.ee(\/\S*)?/i,
  /linktree\.com(\/\S*)?/i,
  /bio\.link(\/\S*)?/i,
  // @handle pattern — requires whitespace/start before @ so "it@something" doesn't false-positive
  /(?:^|\s)@[a-zA-Z0-9_]{2,}/,
  // Phone numbers (7+ digits with optional spaces/dashes/parens)
  /(\+?[\d][\d\s\-().]{6,}[\d])/,
];

export function containsSocial(text: string): boolean {
  return PATTERNS.some((re) => re.test(text));
}

export const SOCIAL_ERROR =
  "Your bio cannot contain email addresses, social handles, phone numbers, or links. Keep all communication on Crewboard.";
