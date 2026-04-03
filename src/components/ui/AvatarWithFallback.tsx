"use client";

interface Props {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export default function AvatarWithFallback({ src, name, size = 40, className }: Props) {
  const initial = (name ?? "U")[0].toUpperCase();

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? "User"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const fb = target.parentElement?.querySelector(".avfb") as HTMLElement | null;
            if (fb) fb.style.display = "flex";
          }}
        />
      )}
      <div
        className="avfb"
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #14B8A6, #0F6E56)",
          display: src ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size * 0.38),
          fontWeight: 700,
          color: "white",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {initial}
      </div>
    </div>
  );
}
