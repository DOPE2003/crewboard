"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OnboardingStatus } from "@/actions/dashboard";

const DISMISS_KEY = "onboarding_dismissed_at";
const DISMISS_HOURS = 24;

const ITEMS = [
  {
    key: "needsAvatar" as keyof OnboardingStatus,
    label: "Upload a profile photo",
    href: "/settings",
    action: "Upload",
  },
  {
    key: "needsCv" as keyof OnboardingStatus,
    label: "Upload your CV",
    href: "/settings",
    action: "Upload",
  },
  {
    key: "needsWallet" as keyof OnboardingStatus,
    label: "Connect your wallet",
    href: "/settings",
    action: "Connect",
  },
  {
    key: "needsGig" as keyof OnboardingStatus,
    label: "Post your first gig",
    href: "/gigs/new",
    action: "Post gig",
  },
];

export default function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  // Start hidden until we check localStorage (avoids flash)
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) {
      const hoursSince = (Date.now() - new Date(raw).getTime()) / 3_600_000;
      if (hoursSince < DISMISS_HOURS) return; // still within dismiss window
      localStorage.removeItem(DISMISS_KEY);
    }
    setVisible(true);
  }, []);

  const allDone = !Object.values(status).some(Boolean);
  if (allDone || !visible) return null;

  const doneCount = ITEMS.filter((i) => !status[i.key]).length;
  const pct = Math.round((doneCount / ITEMS.length) * 100);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setVisible(false);
  }

  return (
    <div className="onboarding-card">
      <button className="onboarding-dismiss" onClick={dismiss} aria-label="Dismiss">✕</button>

      <div className="onboarding-title">Complete your profile</div>
      <div className="onboarding-subtitle">
        You&apos;re {pct}% set up — finish your profile to get discovered
      </div>

      <div className="onboarding-progress-track">
        <div className="onboarding-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="onboarding-items">
        {ITEMS.map((item) => {
          const needed = status[item.key];
          return (
            <div key={item.key} className="onboarding-item">
              <div className="onboarding-item-left">
                {needed ? (
                  <span className="onboarding-circle" />
                ) : (
                  <span className="onboarding-check">✓</span>
                )}
                <span className={`onboarding-item-label${needed ? "" : " onboarding-done"}`}>
                  {item.label}
                </span>
              </div>
              {needed && (
                <Link href={item.href} className="onboarding-action-btn">
                  {item.action}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
