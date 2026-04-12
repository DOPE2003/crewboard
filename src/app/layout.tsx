import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "./SessionProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeRouteClass from "@/components/ui/ThemeRouteClass";
import ThemeProvider from "@/components/ui/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import HeartbeatPing from "@/components/ui/HeartbeatPing";
import BottomTabBarServer from "@/components/mobile/BottomTabBarServer";
import { SolanaProvider } from "@/components/ui/SolanaProvider";
import WalletAutoSave from "@/components/ui/WalletAutoSave";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body>
        <AuthProvider>
          <LanguageProvider>
            <SolanaProvider>
              <ThemeProvider />
              <ThemeRouteClass />
              <HeartbeatPing />
              <WalletAutoSave />
              <Navbar />
              <div className="main-content">
                {children}
                <Footer />
              </div>
              <div className="md:hidden">
                <BottomTabBarServer />
              </div>
            </SolanaProvider>
          </LanguageProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
