"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Props {
  action: () => Promise<{ redirectTo: string }>;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
}

export default function ActionButton({ action, children, style, className, disabled }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={disabled || pending}
      className={className}
      style={style}
      onClick={() => {
        startTransition(async () => {
          try {
            const { redirectTo } = await action();
            router.push(redirectTo);
          } catch (err: any) {
            console.error("[ActionButton]", err?.message);
            alert(err?.message ?? "Something went wrong. Please try again.");
          }
        });
      }}
    >
      {pending ? "..." : children}
    </button>
  );
}
