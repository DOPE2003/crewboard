import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import AuthProvider from "./SessionProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeRouteClass from "@/components/ui/ThemeRouteClass";
import ThemeProvider from "@/components/ui/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import HeartbeatPing from "@/components/ui/HeartbeatPing";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Crewboard — Web3 Freelancer Marketplace",
  description: "Hire and get hired in Web3. The talent marketplace for crypto-native freelancers.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider />
            <ThemeRouteClass />
            <HeartbeatPing />
            <Navbar />
            {children}
            <Footer />
          </LanguageProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
