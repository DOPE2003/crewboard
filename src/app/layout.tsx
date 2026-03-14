import "@/styles/globals.css";
import type { Viewport } from "next";
import AuthProvider from "./SessionProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeRouteClass from "@/components/ui/ThemeRouteClass";
import ThemeProvider from "@/components/ui/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
