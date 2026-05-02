export default function DashboardLoading() {
  return (
    <main className="page">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="skeleton" style={{ height: 28, width: 220, borderRadius: 8, marginBottom: "2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }} className="dash-stats-grid">
          {[1,2,3,4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="dash-two-col">
          <div className="skeleton" style={{ height: 200, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 18 }} />
        </div>
      </div>
    </main>
  );
}
