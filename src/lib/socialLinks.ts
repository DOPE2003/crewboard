// Social media domains blocked in portfolio links
const BLOCKED_DOMAINS = [
  "twitter.com", "x.com", "t.co",
  "instagram.com", "instagr.am",
  "facebook.com", "fb.com", "fb.me",
  "tiktok.com",
  "snapchat.com",
  "telegram.me", "t.me",
  "discord.gg", "discord.com",
  "linkedin.com",
  "twitch.tv",
  "reddit.com",
  "threads.net",
  "mastodon.social",
  "bluesky.app", "bsky.app",
];

export function isSocialMediaUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = hostname.toLowerCase().replace(/^www\./, "");
    return BLOCKED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export const SOCIAL_URL_ERROR =
  "Social media links are not allowed in portfolio. Use a personal website, GitHub, or portfolio URL instead.";
