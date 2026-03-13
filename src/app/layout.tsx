import "@/styles/globals.css";
import type { Viewport } from "next";
import AuthProvider from "./SessionProvider";
import StarsBackground from "@/components/ui/StarsBackground";
import Navbar from "@/components/layout/Navbar";
import ThemeRouteClass from "@/components/ui/ThemeRouteClass";
import { SolanaProvider } from "@/components/ui/SolanaProvider";
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
          <SolanaProvider>
            <ThemeRouteClass />
            <StarsBackground />
            <Navbar />
            {children}
          </SolanaProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
