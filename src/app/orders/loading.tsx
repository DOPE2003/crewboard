export default function OrdersLoading() {
  return (
    <main className="page">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 8, marginBottom: "1.5rem" }} />
        {[1,2,3,4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: "0.75rem" }} />
        ))}
      </div>
    </main>
  );
}
