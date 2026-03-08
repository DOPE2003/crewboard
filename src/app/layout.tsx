import "@/styles/globals.css";
import AuthProvider from "./SessionProvider";
import StarsBackground from "@/components/ui/StarsBackground";
import Navbar from "@/components/layout/Navbar";
import ThemeRouteClass from "@/components/ui/ThemeRouteClass";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeRouteClass />
          <StarsBackground />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
