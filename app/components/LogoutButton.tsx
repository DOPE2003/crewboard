// app/components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn-primary"
      onClick={async () => {
        setLoading(true);
        await signOut({ callbackUrl: "/login" });
      }}
      disabled={loading}
    >
      {loading ? "SIGNING OUT..." : "SIGN OUT"}
    </button>
  );
}