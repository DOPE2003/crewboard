import { computeProfileScore } from "./profileScore";

export interface FreelancerLevelInput {
  bio?: string | null;
  image?: string | null;
  skills?: string[];
  walletAddress?: string | null;
  gigCount: number;        // total gigs posted
  completedOrders: number; // orders with status="completed" where user is seller
  avgRating: number | null; // null when no reviews yet
}

export interface FreelancerLevelResult {
  level: 1 | 2 | 3 | 4 | 5;
  points: number;          // 0–100
  breakdown: {
    profile: number;       // 0–25
    services: number;      // 0–25
    completed: number;     // 0–30
    rating: number;        // 0–20
  };
}

function profilePoints(score: number): number {
  return Math.round(score * 0.25); // 0-100 → 0-25
}

function servicesPoints(gigCount: number): number {
  if (gigCount >= 5) return 25;
  if (gigCount >= 3) return 17;
  if (gigCount >= 1) return 10;
  return 0;
}

function completedPoints(completedOrders: number): number {
  if (completedOrders >= 10) return 30;
  if (completedOrders >= 5)  return 20;
  if (completedOrders >= 3)  return 12;
  if (completedOrders >= 1)  return 5;
  return 0;
}

function ratingPoints(avgRating: number | null): number {
  if (avgRating === null) return 0;
  if (avgRating >= 4.5) return 20;
  if (avgRating >= 4.0) return 15;
  if (avgRating >= 3.5) return 10;
  return 5;
}

export function computeFreelancerLevel(input: FreelancerLevelInput): FreelancerLevelResult {
  const profileScore = computeProfileScore({
    bio: input.bio,
    image: input.image,
    skills: input.skills,
    gigCount: input.gigCount,
    walletAddress: input.walletAddress,
  }).score;

  const profile   = profilePoints(profileScore);
  const services  = servicesPoints(input.gigCount);
  const completed = completedPoints(input.completedOrders);
  const rating    = ratingPoints(input.avgRating);

  const points = profile + services + completed + rating;

  const level: 1 | 2 | 3 | 4 | 5 =
    points >= 80 ? 5 :
    points >= 60 ? 4 :
    points >= 40 ? 3 :
    points >= 20 ? 2 : 1;

  return { level, points, breakdown: { profile, services, completed, rating } };
}

export const LEVEL_META: Record<number, { label: string; color: string; bg: string; desc: string }> = {
  1: { label: "Newcomer",    color: "#6b7280", bg: "rgba(107,114,128,0.1)", desc: "Just getting started" },
  2: { label: "Rising",      color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  desc: "Building a presence" },
  3: { label: "Established", color: "#22c55e", bg: "rgba(34,197,94,0.1)",   desc: "Proven track record" },
  4: { label: "Expert",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  desc: "Top performer" },
  5: { label: "Elite",       color: "#14b8a6", bg: "rgba(20,184,166,0.15)", desc: "Best of the best" },
};
