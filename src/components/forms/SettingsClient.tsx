"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LangCode } from "@/lib/i18n";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺 🇰🇬" },
];

const T: Record<string, Record<string, string>> = {
  en: {
    preferences: "Preferences",
    subtitle: "Customize your Crewboard experience.",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    langNote: "Full translations coming soon. Your preference is saved.",
    proTitle: "Crewboard Pro",
    proSub: "Unlock advanced features",
    proF1: "Priority placement in talent search",
    proF2: "Verified Pro badge on your profile",
    proF3: "Advanced analytics & insights",
    proF4: "Escrow fee discounts",
    proBtn: "Notify Me When Available",
  },
  fr: {
    preferences: "Préférences",
    subtitle: "Personnalisez votre expérience Crewboard.",
    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    language: "Langue",
    langNote: "Traductions complètes bientôt disponibles. Votre préférence est enregistrée.",
    proTitle: "Crewboard Pro",
    proSub: "Débloquez des fonctionnalités avancées",
    proF1: "Priorité dans la recherche de talents",
    proF2: "Badge Pro vérifié sur votre profil",
    proF3: "Analytiques avancées",
    proF4: "Réductions sur les frais d'entiercement",
    proBtn: "Me notifier quand disponible",
  },
  de: {
    preferences: "Einstellungen",
    subtitle: "Passen Sie Ihre Crewboard-Erfahrung an.",
    theme: "Design",
    light: "Hell",
    dark: "Dunkel",
    language: "Sprache",
    langNote: "Vollständige Übersetzungen kommen bald. Ihre Einstellung wurde gespeichert.",
    proTitle: "Crewboard Pro",
    proSub: "Erweiterte Funktionen freischalten",
    proF1: "Priorität in der Talentsuche",
    proF2: "Verifiziertes Pro-Abzeichen im Profil",
    proF3: "Erweiterte Analysen & Einblicke",
    proF4: "Ermäßigungen auf Treuhandgebühren",
    proBtn: "Benachrichtigen, wenn verfügbar",
  },
  ru: {
    preferences: "Настройки",
    subtitle: "Настройте ваш опыт в Crewboard.",
    theme: "Тема",
    light: "Светлая",
    dark: "Тёмная",
    language: "Язык",
    langNote: "Полный перевод скоро. Ваш выбор сохранён.",
    proTitle: "Crewboard Pro",
    proSub: "Откройте расширенные возможности",
    proF1: "Приоритет в поиске талантов",
    proF2: "Значок Pro на вашем профиле",
    proF3: "Расширенная аналитика",
    proF4: "Скидки на комиссии эскроу",
    proBtn: "Уведомить меня о запуске",
  },
};

export default function SettingsClient() {
  const { lang, setLang } = useLanguage();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme((localStorage.getItem("cb-theme") as "light" | "dark") ?? "light");
    setMounted(true);
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    setTheme(t);
    localStorage.setItem("cb-theme", t);
    if (t === "dark") document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  };

  const applyLang = (code: LangCode) => {
    setLang(code);
  };

  if (!mounted) return null;

  const isDark = theme === "dark";
  const t = T[lang] ?? T.en;

  const card: React.CSSProperties = {
    borderRadius: 16,
    padding: "1.5rem",
    background: isDark ? "#1e293b" : "#fff",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
    boxShadow: isDark ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 8px rgba(0,0,0,0.03)",
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: "Space Mono, monospace",
    fontSize: "0.58rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: "1rem",
  };

  const inactiveBtn: React.CSSProperties = {
    border: isDark ? "2px solid rgba(255,255,255,0.1)" : "2px solid rgba(0,0,0,0.08)",
    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
  };

  const activeBtn: React.CSSProperties = {
    border: "2px solid #14b8a6",
    background: isDark ? "rgba(20,184,166,0.1)" : "rgba(20,184,166,0.06)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

      {/* ── Theme ── */}
      <div style={card}>
        <div style={sectionLabel}>{t.theme}</div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {(["light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => applyTheme(mode)}
              style={{
                flex: 1,
                padding: "1.1rem 0.75rem",
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.6rem",
                transition: "all 0.15s",
                ...(theme === mode ? activeBtn : inactiveBtn),
              }}
            >
              {mode === "light" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme === mode ? "#14b8a6" : "#64748b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme === mode ? "#14b8a6" : (isDark ? "rgba(255,255,255,0.5)" : "#64748b")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: theme === mode ? "#14b8a6" : (isDark ? "rgba(255,255,255,0.55)" : "#475569"), textTransform: "capitalize" }}>
                {mode === "light" ? t.light : t.dark}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Language ── */}
      <div style={card}>
        <div style={sectionLabel}>{t.language}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => applyLang(l.code as any)}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                transition: "all 0.15s",
                ...(lang === l.code ? activeBtn : inactiveBtn),
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{l.flag}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: lang === l.code ? "#14b8a6" : (isDark ? "rgba(255,255,255,0.7)" : "#334155") }}>
                {l.label}
              </span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.7rem", color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8", marginTop: "0.75rem" }}>
          {t.langNote}
        </p>
      </div>

      {/* ── Crewboard Pro ── */}
      <div style={{
        ...card,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(20,184,166,0.2)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 140, height: 140, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1rem", color: "#f1f5f9" }}>
                {t.proTitle}
              </span>
              <span style={{
                fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                background: "rgba(20,184,166,0.18)", color: "#2DD4BF",
                fontFamily: "Space Mono, monospace", letterSpacing: "0.08em",
                textTransform: "uppercase", border: "1px solid rgba(20,184,166,0.3)",
              }}>
                Coming Soon
              </span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {t.proSub}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1.1rem" }}>
          {[t.proF1, t.proF2, t.proF3, t.proF4].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{
          width: "100%", padding: "0.75rem",
          borderRadius: 99, background: "rgba(20,184,166,0.1)",
          border: "1px solid rgba(20,184,166,0.25)",
          color: "#2DD4BF", fontWeight: 700, fontSize: "0.8rem",
          letterSpacing: "0.05em", textAlign: "center",
          cursor: "default", userSelect: "none",
        }}>
          {t.proBtn}
        </div>
      </div>

    </div>
  );
}
