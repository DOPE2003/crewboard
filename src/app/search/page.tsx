import { Suspense } from "react";
import db from "@/lib/db";
import Link from "next/link";

async function SearchResults({ q }: { q: string }) {
  if (!q || q.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p style={{ fontSize: 16, color: "#9ca3af" }}>Enter a search term to find talent and services</p>
      </div>
    );
  }

  const [users, gigs] = await Promise.all([
    db.user.findMany({
      where: {
        profileComplete: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { twitterHandle: { contains: q, mode: "insensitive" } },
          { userTitle: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, name: true, twitterHandle: true,
        image: true, userTitle: true, bio: true, skills: true, availability: true,
      },
      take: 20,
    }),
    db.gig.findMany({
      where: {
        status: "active",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, title: true, description: true,
        price: true, category: true, deliveryDays: true, tags: true,
        user: { select: { name: true, twitterHandle: true, image: true } },
      },
      take: 20,
    }),
  ]);

  if (users.length === 0 && gigs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>No results found</h2>
        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>
          Try a different search term or browse our talent
        </p>
        <Link href="/talent" style={{
          display: "inline-block", padding: "10px 24px",
          background: "#14B8A6", color: "white", borderRadius: 10,
          textDecoration: "none", fontWeight: 600, fontSize: 14,
        }}>
          Browse Profiles
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>
        {users.length + gigs.length} results for <strong>&ldquo;{q}&rdquo;</strong>
      </p>

      {/* Talent */}
      {users.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>
            Talent ({users.length})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {users.map((user) => (
              <Link key={user.id} href={`/u/${user.twitterHandle}`} style={{
                display: "block", background: "white", border: "1px solid #e5e7eb",
                borderRadius: 16, padding: 20, textDecoration: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  {user.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.image} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#14B8A6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, fontWeight: 700 }}>
                      {(user.name ?? user.twitterHandle)[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name ?? user.twitterHandle}
                    </p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>@{user.twitterHandle}</p>
                  </div>
                </div>
                {user.userTitle && (
                  <span style={{
                    display: "inline-block",
                    fontSize: 11, fontWeight: 600, padding: "3px 10px",
                    borderRadius: 99, background: "#E1F5EE", color: "#0F6E56",
                  }}>
                    {user.userTitle}
                  </span>
                )}
                {user.bio && (
                  <p style={{
                    fontSize: 12, color: "#6b7280", margin: "10px 0 0", lineHeight: 1.5,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                  }}>
                    {user.bio}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {gigs.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>
            Services ({gigs.length})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {gigs.map((gig) => (
              <Link key={gig.id} href={`/gigs/${gig.id}`} style={{
                display: "block", background: "white", border: "1px solid #e5e7eb",
                borderRadius: 16, padding: 20, textDecoration: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px",
                    borderRadius: 99, background: "#E1F5EE", color: "#0F6E56",
                  }}>
                    {gig.category}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#14B8A6" }}>${gig.price}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 6px", lineHeight: 1.4 }}>
                  {gig.title}
                </p>
                <p style={{
                  fontSize: 12, color: "#6b7280", margin: "0 0 14px", lineHeight: 1.5,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                }}>
                  {gig.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {gig.user.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={gig.user.image} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700 }}>
                      {(gig.user.name ?? gig.user.twitterHandle)[0].toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: "#9ca3af", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {gig.user.name ?? `@${gig.user.twitterHandle}`}
                  </span>
                  <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>
                    {gig.deliveryDays}d delivery
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q ?? "";

  return (
    <main className="main-content" style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            {q ? `Results for "${q}"` : "Search"}
          </h1>
        </div>
      </div>
      <Suspense fallback={
        <div style={{ padding: 60, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
          Searching...
        </div>
      }>
        <SearchResults q={q} />
      </Suspense>
    </main>
  );
}
