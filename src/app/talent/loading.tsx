export default function TalentLoading() {
  return (
    <main className="page">
      <section className="talent-wrap">
        <div className="talent-header">
          <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 6, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 36, width: 300, borderRadius: 8, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: 400, borderRadius: 6 }} />
        </div>
        <div className="talent-grid" style={{ marginTop: "2rem" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 220, borderRadius: 20 }} />
          ))}
        </div>
      </section>
    </main>
  );
}
