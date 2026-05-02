/**
 * Profile completion score — 0 to 100.
 *
 * Weights (total = 100):
 *   bio           20 pts
 *   avatar        20 pts
 *   skills        20 pts  (any skill = full points)
 *   services      20 pts  (at least 1 active gig)
 *   wallet        20 pts
 *
 * Threshold to appear in talent marketplace: PROFILE_SCORE_THRESHOLD (70).
 */

export const PROFILE_SCORE_THRESHOLD = 70;

export interface ProfileScoreInput {
  bio?: string | null;
  image?: string | null;
  skills?: string[];
  gigCount?: number;       // number of active gigs
  walletAddress?: string | null;
}

export interface ProfileScoreResult {
  score: number;           // 0–100
  meetsThreshold: boolean;
  breakdown: {
    bio: number;
    avatar: number;
    skills: number;
    services: number;
    wallet: number;
  };
}

export function computeProfileScore(input: ProfileScoreInput): ProfileScoreResult {
  const bio      = input.bio?.trim() ? 20 : 0;
  const avatar   = input.image ? 20 : 0;
  const skills   = (input.skills?.length ?? 0) > 0 ? 20 : 0;
  const services = (input.gigCount ?? 0) > 0 ? 20 : 0;
  const wallet   = input.walletAddress ? 20 : 0;

  const score = bio + avatar + skills + services + wallet;

  return {
    score,
    meetsThreshold: score >= PROFILE_SCORE_THRESHOLD,
    breakdown: { bio, avatar, skills, services, wallet },
  };
}
