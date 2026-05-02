"use client";

import { useRef } from "react";
import NavProfileDropdown from "@/components/layout/NavProfileDropdown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
  name: string | null;
  twitterHandle: string | null;
  userTitle: string | null;
  availability: string | null;
  unreadCount?: number;
  gigsCount?: number;
}

export default function ProfileModal({
  isOpen,
  onClose,
  image,
  name,
  twitterHandle,
  userTitle,
  availability,
  unreadCount = 0,
  gigsCount = 0,
}: Props) {
  // NavProfileDropdown needs an anchorRef for desktop positioning; on mobile it's unused
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <NavProfileDropdown
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      image={image}
      name={name}
      twitterHandle={twitterHandle}
      role={userTitle}
      availability={availability}
      unreadCount={unreadCount}
      gigsCount={gigsCount}
    />
  );
}
