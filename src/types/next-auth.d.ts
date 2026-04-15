import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      userId?: string;
      twitterHandle?: string;
      profileComplete?: boolean;
      role?: "USER" | "SUPPORT" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    twitterHandle?: string;
    profileComplete?: boolean;
    role?: "USER" | "SUPPORT" | "ADMIN";
    twitterAccessToken?: string;
    imageRefreshedAt?: number;
    issuedAt?: number;
  }
}
