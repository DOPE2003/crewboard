import db from "@/lib/db";
import Link from "next/link";
import { auth } from "@/auth";
import GigsFilters from "./GigsFilters";
import T from "@/components/ui/T";

function formatPrice(price: number): string {
  if (price >= 1000000) return "$" + (price / 1000000).toFixed(1) + "m";
  if (price >= 1000) return "$" + price.toLocaleString();
  return "$" + price;
}

export const GIG_CATEGORIES = [
  "KOL Manager",
  "Exchange Listings Manager",
  "Web3 Web Designer",
  "Social Marketing",
  "Artist",
  "Video & Animation",
  "Coding & Tech",
  "AI Engineer",
  "Content Creator",
  "Graphic & Design",
];

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; maxPrice?: string }>;
}) {
  const { q = "", category = "", maxPrice = "" } = await searchParams;
  const session = await auth();
  const isLoggedIn = !!(session?.user as any)?.userId;

  const where: Record<string, unknown> = { status: "active" };

  if (q.trim()) {
    where.OR = [
      { title:       { contains: q.trim(), mode: "insensitive" } },
      { description: { contains: q.trim(), mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  const maxPriceNum = parseInt(maxPrice, 10);
  if (maxPriceNum > 0) where.price = { lte: maxPriceNum };

  const gigs = await db.gig.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, twitterHandle: true, image: true, role: true } },
    },
  });

  return (
    <main className="page">
      <section className="talent-wrap">
        <div className="talent-header">
          <div className="auth-kicker"><T k="gigs.kicker" /></div>
          <h1 className="auth-title"><T k="gigs.title" /></h1>
          <p className="auth-sub"><T k="gigs.subtitle" /></p>
          {isLoggedIn && (
            <Link href="/gigs/new" className="btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
              <T k="gigs.post" />
            </Link>
          )}
        </div>

        <GigsFilters categories={GIG_CATEGORIES} defaultQ={q} defaultCategory={category} defaultMaxPrice={maxPrice} />

        {gigs.length === 0 ? (
          <div className="talent-empty">
            <p>No gigs found{q || category ? " for this search" : ""}.</p>
            {isLoggedIn && (
              <Link href="/gigs/new" className="btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
                <T k="gigs.postFirst" />
              </Link>
            )}
          </div>
        ) : (
          <div className="gig-grid">
            {gigs.map((gig) => {
              const userName = gig.user.name ?? gig.user.twitterHandle;
              const userInitials = userName.slice(0, 2).toUpperCase();
              return (
                <Link key={gig.id} href={`/gigs/${gig.id}`} className="gig-card">
                  <div className="gig-card-top">
                    <span className="gig-category-badge">{gig.category}</span>
                    <div className="gig-price-wrap">
                      <span className="gig-price-label">from</span>
                      <span className="gig-price">{formatPrice(gig.price)}</span>
                    </div>
                  </div>
                  <h2 className="gig-title">{gig.title}</h2>
                  <p className="gig-desc">{gig.description}</p>
                  {gig.tags.length > 0 && (
                    <div className="gig-tags">
                      {gig.tags.slice(0, 3).map((t) => (
                        <span key={t} className="dash-skill-chip">{t}</span>
                      ))}
                      {gig.tags.length > 3 && (
                        <span className="dash-skill-chip">+{gig.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="gig-footer">
                    <div className="gig-user">
                      {gig.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={gig.user.image} alt="" className="gig-user-avatar" />
                      ) : (
                        <div className="gig-user-avatar-initials">{userInitials}</div>
                      )}
                      <div className="gig-user-info">
                        <span className="gig-user-name">{userName}</span>
                        {gig.user.role && <span className="gig-user-role">{gig.user.role}</span>}
                      </div>
                    </div>
                    <div className="gig-delivery-wrap">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="gig-delivery">{gig.deliveryDays}d</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
