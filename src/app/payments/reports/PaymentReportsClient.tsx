"use client";

export default function PaymentReportsClient({ currency, month }: { currency: string; month: string }) {
  function handleDownload() {
    const url = `/api/payments/report-pdf?currency=${currency}&month=${month}`;
    window.open(url, "_blank");
  }

  return (
    <button
      onClick={handleDownload}
      style={{
        width: "100%", padding: "16px 20px", borderRadius: 99, border: "none",
        background: "linear-gradient(360deg, #000000 0%, #232323 100%)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "inherit", letterSpacing: "-0.01em",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        marginBottom: 16,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 18 15 15"/>
      </svg>
      Download Payment Report (PDF)
    </button>
  );
}
