import db from "@/lib/db";
import Link from "next/link";
import { auth } from "@/auth";
import GigsFilters from "./GigsFilters";
import T from "@/components/ui/T";
import SaveGigButton from "@/components/gigs/SaveGigButton";

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
  searchParams: Promise<{ q?: string; category?: string; minPrice?: string; maxPrice?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const category = params.category || "";
  const minPrice = params.minPrice || "0";
  const maxPrice = params.maxPrice || "5000";
  const sort = params.sort || "newest";

  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  const isLoggedIn = !!userId;

  // Fetch saved gig IDs for the current user
  const savedGigIds = userId
    ? await db.savedGig.findMany({ where: { userId }, select: { gigId: true } })
        .then((rows) => new Set(rows.map((r) => r.gigId)))
    : new Set<string>();

  const where: Record<string, any> = { status: "active" };

  if (q.trim()) {
    where.OR = [
      { title:       { contains: q.trim(), mode: "insensitive" } },
      { description: { contains: q.trim(), mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  
  const minP = parseInt(minPrice, 10) || 0;
  const maxP = parseInt(maxPrice, 10) || 5000;
  where.price = { gte: minP, lte: maxP };

  // 1. Fetch Gigs with their reviews
  const rawGigs = await db.gig.findMany({
    where,
    include: {
      user: { select: { name: true, twitterHandle: true, image: true, userTitle: true } },
      orders: {
        where: { status: "completed" },
        select: { 
          reviews: { select: { rating: true } }
        }
      }
    },
    // We sort by price or date at the DB level first
    orderBy: sort === "price_asc" ? { price: "asc" } : 
             sort === "price_desc" ? { price: "desc" } : 
             { createdAt: "desc" }
  });

  // 2. Calculate average ratings on the spot
  const gigs = rawGigs.map(gig => {
    const allRatings = gig.orders.flatMap(o => o.reviews.map(r => r.rating));
    const reviewCount = allRatings.length;
    const avgRating = reviewCount > 0 
      ? allRatings.reduce((sum, r) => sum + r, 0) / reviewCount 
      : 0;
    
    return { ...gig, avgRating, reviewCount };
  });

  // 3. Apply custom "Top Rated" sort in memory if requested
  if (sort === "top_rated") {
    gigs.sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.reviewCount - a.reviewCount;
    });
  }

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
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

        <GigsFilters 
          categories={GIG_CATEGORIES} 
          defaultQ={q} 
          defaultCategory={category} 
          defaultMinPrice={minPrice}
          defaultMaxPrice={maxPrice}
          defaultSort={sort}
        />

        {gigs.length === 0 ? (
          <div className="talent-empty">
            <p>No services found{q || category ? " for this search" : ""}.</p>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span className="gig-user-role">{gig.user.userTitle || "Builder"}</span>
                          {gig.reviewCount > 0 && (
                            <span style={{ fontSize: "0.6rem", color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                              ★ {gig.avgRating.toFixed(1)} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({gig.reviewCount})</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="gig-delivery-wrap">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="gig-delivery">{gig.deliveryDays}d</span>
                    </div>
                    {isLoggedIn && (
                      <SaveGigButton gigId={gig.id} initialSaved={savedGigIds.has(gig.id)} />
                    )}
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
